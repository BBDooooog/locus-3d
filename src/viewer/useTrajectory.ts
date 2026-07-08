import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { Track, ColorMode, ReferencePlaneMode } from '../types/track'
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
  disposeLayers,
  computeXZBounds,
} from '../geometry/sceneLayers'
import { wgs84ToENU } from '../transform'
import type { SceneSetup } from './useScene'

interface Layers {
  refPlane: THREE.GridHelper | null
  projectionLines: THREE.LineSegments | null
  groundProjection: THREE.Line | null
}

export function useTrajectory() {
  const trajectoryRef = useRef<ReturnType<typeof buildTrajectory> | null>(null)
  const markersRef = useRef<Markers | null>(null)
  const layersRef = useRef<Layers>({
    refPlane: null,
    projectionLines: null,
    groundProjection: null,
  })

  function getRefPlaneY(enuPositions: Float32Array, mode: ReferencePlaneMode): number {
    if (mode === 'seaLevel') return 0
    let minY = Infinity
    for (let i = 1; i < enuPositions.length; i += 3) {
      if (enuPositions[i] < minY) minY = enuPositions[i]
    }
    return minY === Infinity ? 0 : minY
  }

  /** Build all 4 layers from ENU positions */
  function buildAllLayers(
    enuPositions: Float32Array,
    refPlaneY: number,
  ): Layers {
    const bounds = computeXZBounds(enuPositions)
    return {
      refPlane: buildReferencePlane(refPlaneY, bounds),
      projectionLines: buildProjectionLines(enuPositions, refPlaneY),
      groundProjection: buildGroundProjection(enuPositions, refPlaneY),
    }
  }

  const loadTrack = useCallback(
    (
      setup: SceneSetup,
      track: Track,
      colorMode: ColorMode,
      altitudeScale: number,
      referencePlaneMode: ReferencePlaneMode,
    ) => {
      trajectoryRef.current?.dispose()
      markersRef.current?.dispose()
      disposeLayers(layersRef.current)

      const enuPositions = wgs84ToENU(track.points, altitudeScale)

      // Trajectory
      const trajectory = buildTrajectory(track, colorMode, altitudeScale)
      setup.scene.add(trajectory.line)

      // Markers
      const markers = buildMarkers(track, altitudeScale)
      setup.scene.add(markers.start)
      setup.scene.add(markers.end)

      // Layers
      const refPlaneY = getRefPlaneY(enuPositions, referencePlaneMode)
      const layers = buildAllLayers(enuPositions, refPlaneY)
      setup.scene.add(layers.refPlane!)
      setup.scene.add(layers.projectionLines!)
      setup.scene.add(layers.groundProjection!)

      trajectoryRef.current = trajectory
      markersRef.current = markers
      layersRef.current = layers

      const box = new THREE.Box3()
      box.expandByObject(trajectory.line)
      box.expandByObject(layers.refPlane!)
      return box
    },
    [],
  )

  const changeAltitudeScale = useCallback(
    (track: Track, altitudeScale: number, referencePlaneMode: ReferencePlaneMode) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      updateAltitudeScale(track, trajectory.line, altitudeScale)

      if (markersRef.current) {
        const oldM = markersRef.current
        const newM = buildMarkers(track, altitudeScale)
        oldM.start.position.copy(newM.start.position)
        oldM.end.position.copy(newM.end.position)
        newM.dispose()
      }

      const enuPositions = wgs84ToENU(track.points, altitudeScale)
      const refPlaneY = getRefPlaneY(enuPositions, referencePlaneMode)

      const setup = trajectory.line.parent
      if (setup) {
        disposeLayers(layersRef.current)
        const layers = buildAllLayers(enuPositions, refPlaneY)
        setup.add(layers.refPlane!)
        setup.add(layers.projectionLines!)
        setup.add(layers.groundProjection!)
        layersRef.current = layers
      }
    },
    [],
  )

  const changeReferencePlane = useCallback(
    (track: Track, altitudeScale: number, mode: ReferencePlaneMode) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      const enuPositions = wgs84ToENU(track.points, altitudeScale)
      const refPlaneY = getRefPlaneY(enuPositions, mode)

      const setup = trajectory.line.parent
      if (setup) {
        disposeLayers(layersRef.current)
        const layers = buildAllLayers(enuPositions, refPlaneY)
        setup.add(layers.refPlane!)
        setup.add(layers.projectionLines!)
        setup.add(layers.groundProjection!)
        layersRef.current = layers
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
    layersRef.current = { refPlane: null, projectionLines: null, groundProjection: null }
  }, [])

  return {
    loadTrack,
    changeAltitudeScale,
    changeColorMode,
    changeReferencePlane,
    updateRes,
    dispose,
  }
}
