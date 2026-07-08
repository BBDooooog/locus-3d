import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { Track, ColorMode, ReferencePlaneMode, LayerVisibility } from '../types/track'
import {
  buildTrajectory,
  updateAltitudeScale,
  updateColors,
  updateLineResolution,
} from '../geometry/trajectoryBuilder'
import { buildMarkers, type Markers } from '../geometry/markerBuilder'
import {
  buildReferencePlane,
  buildProjectionLines,
  buildGroundProjection,
  buildCompassLabels,
  disposeLayers,
  computeXZBounds,
} from '../geometry/sceneLayers'
import { wgs84ToENU } from '../transform'
import type { SceneSetup } from './useScene'

interface Layers {
  refPlane: THREE.GridHelper | null
  projectionLines: THREE.LineSegments | null
  groundProjection: THREE.Line | null
  compass: THREE.Group | null
}

export function useTrajectory() {
  const trajectoryRef = useRef<ReturnType<typeof buildTrajectory> | null>(null)
  const markersRef = useRef<Markers | null>(null)
  const layersRef = useRef<Layers>({
    refPlane: null,
    projectionLines: null,
    groundProjection: null,
    compass: null,
  })
  // Store the unscaled ref plane Y so it doesn't change with altitude scale
  const refPlaneYRef = useRef<number>(0)
  const refPlaneModeRef = useRef<ReferencePlaneMode>('minAltitude')

  function getRefPlaneY(enuPositions: Float32Array, mode: ReferencePlaneMode): number {
    if (mode === 'seaLevel') return 0
    let minY = Infinity
    for (let i = 1; i < enuPositions.length; i += 3) {
      if (enuPositions[i] < minY) minY = enuPositions[i]
    }
    return minY === Infinity ? 0 : minY
  }

  /** Build reference plane + compass */
  function buildFixedLayers(
    setup: THREE.Scene | THREE.Object3D | null,
    unscaledENU: Float32Array,
    mode: ReferencePlaneMode,
  ) {
    if (!setup) return
    const old = layersRef.current
    if (old.refPlane) { setup.remove(old.refPlane); disposeLayers({ refPlane: old.refPlane }) }
    if (old.compass) { setup.remove(old.compass); disposeLayers({ compass: old.compass }) }

    refPlaneModeRef.current = mode
    const refY = getRefPlaneY(unscaledENU, mode)
    refPlaneYRef.current = refY

    const bounds = computeXZBounds(unscaledENU)
    const refPlane = buildReferencePlane(refY, bounds)
    const compass = buildCompassLabels(bounds, refY)

    setup.add(refPlane)
    setup.add(compass)

    layersRef.current = { ...layersRef.current, refPlane, compass }
  }

  /** Find the minimum Y from ENU positions (for ref plane alignment) */
  function minYFrom(enuPositions: Float32Array): number {
    let minY = Infinity
    for (let i = 1; i < enuPositions.length; i += 3) {
      if (enuPositions[i] < minY) minY = enuPositions[i]
    }
    return minY === Infinity ? 0 : minY
  }

  /** Build trajectory-dependent layers (affected by altitude scale) */
  function buildDynamicLayers(
    setup: THREE.Scene | THREE.Object3D | null,
    enuPositions: Float32Array,
  ) {
    if (!setup) return
    const old = layersRef.current
    if (old.projectionLines) { setup.remove(old.projectionLines); disposeLayers({ projectionLines: old.projectionLines }) }
    if (old.groundProjection) { setup.remove(old.groundProjection); disposeLayers({ groundProjection: old.groundProjection }) }

    // Reference plane Y from scaled data in minAltitude mode — ensures nothing goes below plane
    const refY = refPlaneModeRef.current === 'seaLevel' ? 0 : minYFrom(enuPositions)
    refPlaneYRef.current = refY

    // Move the reference plane + compass to match
    if (old.refPlane) old.refPlane.position.y = refY
    if (old.compass) old.compass.position.y = refY + 1.0

    const projectionLines = buildProjectionLines(enuPositions, refY)
    const groundProjection = buildGroundProjection(enuPositions, refY)

    setup.add(projectionLines)
    setup.add(groundProjection)

    layersRef.current = { ...layersRef.current, projectionLines, groundProjection }
  }

  const loadTrack = useCallback(
    (
      setup: SceneSetup,
      track: Track,
      colorMode: ColorMode,
      altitudeScale: number,
      referencePlaneMode: ReferencePlaneMode,
      trajectoryScale: number,
    ) => {
      trajectoryRef.current?.dispose()
      markersRef.current?.dispose()
      disposeLayers(layersRef.current)

      const scaledENU = wgs84ToENU(track.points, altitudeScale, trajectoryScale)
      const unscaledENU = wgs84ToENU(track.points, 1, trajectoryScale)

      // Trajectory
      const trajectory = buildTrajectory(track, colorMode, altitudeScale, trajectoryScale)
      setup.scene.add(trajectory.line)

      // Markers
      const markers = buildMarkers(track, altitudeScale, trajectoryScale)
      setup.scene.add(markers.start)
      setup.scene.add(markers.end)

      // Fixed layers (unscaled)
      buildFixedLayers(setup.scene, unscaledENU, referencePlaneMode)

      // Dynamic layers (scaled)
      buildDynamicLayers(setup.scene, scaledENU)

      trajectoryRef.current = trajectory
      markersRef.current = markers

      const box = new THREE.Box3()
      box.expandByObject(trajectory.line)
      if (layersRef.current.refPlane) box.expandByObject(layersRef.current.refPlane)
      return box
    },
    [],
  )

  const changeAltitudeScale = useCallback(
    (track: Track, altitudeScale: number, trajectoryScale: number, layers: LayerVisibility) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      updateAltitudeScale(track, trajectory.line, altitudeScale, trajectoryScale)

      if (markersRef.current) {
        const oldM = markersRef.current
        const newM = buildMarkers(track, altitudeScale, trajectoryScale)
        oldM.start.position.copy(newM.start.position)
        oldM.end.position.copy(newM.end.position)
        newM.dispose()
      }

      const scaledENU = wgs84ToENU(track.points, altitudeScale, trajectoryScale)
      buildDynamicLayers(trajectory.line.parent, scaledENU)
      applyLayerVisibility(layers)
    },
    [],
  )

  const changeReferencePlane = useCallback(
    (track: Track, altitudeScale: number, mode: ReferencePlaneMode, trajectoryScale: number, layers: LayerVisibility) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      const unscaledENU = wgs84ToENU(track.points, 1, trajectoryScale)
      buildFixedLayers(trajectory.line.parent, unscaledENU, mode)

      const scaledENU = wgs84ToENU(track.points, altitudeScale, trajectoryScale)
      buildDynamicLayers(trajectory.line.parent, scaledENU)
      applyLayerVisibility(layers)
    },
    [],
  )

  /** Rebuild everything with new trajectory scale */
  const changeTrajectoryScale = useCallback(
    (track: Track, altitudeScale: number, referencePlaneMode: ReferencePlaneMode, trajectoryScale: number, layers: LayerVisibility) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      updateAltitudeScale(track, trajectory.line, altitudeScale, trajectoryScale)

      if (markersRef.current) {
        const oldM = markersRef.current
        const newM = buildMarkers(track, altitudeScale, trajectoryScale)
        oldM.start.position.copy(newM.start.position)
        oldM.end.position.copy(newM.end.position)
        newM.dispose()
      }

      const unscaledENU = wgs84ToENU(track.points, 1, trajectoryScale)
      buildFixedLayers(trajectory.line.parent, unscaledENU, referencePlaneMode)

      const scaledENU = wgs84ToENU(track.points, altitudeScale, trajectoryScale)
      buildDynamicLayers(trajectory.line.parent, scaledENU)
      applyLayerVisibility(layers)
    },
    [],
  )

  const applyLayerVisibility = useCallback(
    (layers: LayerVisibility) => {
      const l = layersRef.current
      const m = markersRef.current
      if (l.refPlane) l.refPlane.visible = layers.referencePlane
      if (l.projectionLines) l.projectionLines.visible = layers.projectionLines
      if (l.groundProjection) l.groundProjection.visible = layers.groundProjection
      if (l.compass) l.compass.visible = layers.compass
      if (m) {
        m.start.visible = layers.markers
        m.end.visible = layers.markers
      }
    },
    [],
  )

  const changeColorMode = useCallback((track: Track, colorMode: ColorMode) => {
    const trajectory = trajectoryRef.current
    if (!trajectory) return
    updateColors(track, trajectory.line, colorMode)
  }, [])

  const updateRes = useCallback((width: number, height: number) => {
    if (trajectoryRef.current) {
      updateLineResolution(trajectoryRef.current.line, width, height)
    }
  }, [])

  const dispose = useCallback(() => {
    trajectoryRef.current?.dispose()
    markersRef.current?.dispose()
    disposeLayers(layersRef.current)
    trajectoryRef.current = null
    markersRef.current = null
    layersRef.current = { refPlane: null, projectionLines: null, groundProjection: null, compass: null }
  }, [])

  return {
    loadTrack,
    changeAltitudeScale,
    changeColorMode,
    changeReferencePlane,
    changeTrajectoryScale,
    applyLayerVisibility,
    updateRes,
    dispose,
  }
}
