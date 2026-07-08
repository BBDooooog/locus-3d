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
} from '../geometry/sceneLayers'
import { wgs84ToENU } from '../transform'
import type { SceneSetup } from './useScene'

interface Layers {
  refPlane: THREE.Group | null
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

  /** Compute reference plane Y based on mode */
  function getRefPlaneY(
    enuPositions: Float32Array,
    mode: ReferencePlaneMode,
  ): number {
    if (mode === 'seaLevel') return 0

    // Find minimum Y (up value) in the ENU positions
    let minY = Infinity
    for (let i = 1; i < enuPositions.length; i += 3) {
      if (enuPositions[i] < minY) minY = enuPositions[i]
    }
    return minY === Infinity ? 0 : minY
  }

  /** Compute the size needed for the reference plane based on trajectory extent */
  function getPlaneSize(enuPositions: Float32Array): number {
    let maxDist = 0
    // Find max XZ extent from center
    let cx = 0,
      cz = 0
    const pointCount = enuPositions.length / 3
    for (let i = 0; i < pointCount; i++) {
      cx += enuPositions[i * 3]
      cz += enuPositions[i * 3 + 2]
    }
    cx /= pointCount
    cz /= pointCount
    for (let i = 0; i < pointCount; i++) {
      const dx = enuPositions[i * 3] - cx
      const dz = enuPositions[i * 3 + 2] - cz
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > maxDist) maxDist = dist
    }
    // Plane covers 2.5x the max radius for plenty of margin
    return Math.max(maxDist * 5, 500)
  }

  const loadTrack = useCallback(
    (
      setup: SceneSetup,
      track: Track,
      colorMode: ColorMode,
      altitudeScale: number,
      referencePlaneMode: ReferencePlaneMode,
    ) => {
      // Dispose previous
      trajectoryRef.current?.dispose()
      markersRef.current?.dispose()
      disposeLayers(layersRef.current)

      // Compute shared ENU positions
      const enuPositions = wgs84ToENU(track.points, altitudeScale)

      // Layer 2: Trajectory
      const trajectory = buildTrajectory(track, colorMode, altitudeScale)
      setup.scene.add(trajectory.line)

      // Start/End Markers
      const markers = buildMarkers(track, altitudeScale)
      setup.scene.add(markers.start)
      setup.scene.add(markers.end)

      // Layer 1: Reference Plane
      const refPlaneY = getRefPlaneY(enuPositions, referencePlaneMode)
      const planeSize = getPlaneSize(enuPositions)
      const refPlane = buildReferencePlane(refPlaneY, planeSize)
      setup.scene.add(refPlane)

      // Layer 3: Projection Lines
      const projectionLines = buildProjectionLines(enuPositions, refPlaneY)
      setup.scene.add(projectionLines)

      // Layer 4: Ground Projection
      const groundProjection = buildGroundProjection(enuPositions, refPlaneY)
      setup.scene.add(groundProjection)

      trajectoryRef.current = trajectory
      markersRef.current = markers
      layersRef.current = { refPlane, projectionLines, groundProjection }

      // Return bounding box of the full scene (all 4 layers)
      const box = new THREE.Box3()
      box.expandByObject(trajectory.line)
      box.expandByObject(refPlane)
      return box
    },
    [],
  )

  const changeAltitudeScale = useCallback(
    (
      track: Track,
      altitudeScale: number,
      referencePlaneMode: ReferencePlaneMode,
    ) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      // Update trajectory
      updateAltitudeScale(track, trajectory.line, altitudeScale)

      // Rebuild markers
      if (markersRef.current) {
        const oldMarkers = markersRef.current
        const newMarkers = buildMarkers(track, altitudeScale)
        oldMarkers.start.position.copy(newMarkers.start.position)
        oldMarkers.end.position.copy(newMarkers.end.position)
        newMarkers.dispose()
      }

      // Compute new ENU positions and reference plane Y
      const enuPositions = wgs84ToENU(track.points, altitudeScale)
      const refPlaneY = getRefPlaneY(enuPositions, referencePlaneMode)

      // Rebuild layers
      const layers = layersRef.current
      const setup = trajectory.line.parent
      if (setup) {
        // Dispose old
        disposeLayers(layers)

        // Build new
        const planeSize = getPlaneSize(enuPositions)
        const refPlane = buildReferencePlane(refPlaneY, planeSize)
        const projectionLines = buildProjectionLines(enuPositions, refPlaneY)
        const groundProjection = buildGroundProjection(enuPositions, refPlaneY)

        setup.add(refPlane)
        setup.add(projectionLines)
        setup.add(groundProjection)

        layersRef.current = { refPlane, projectionLines, groundProjection }
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
      const planeSize = getPlaneSize(enuPositions)

      const layers = layersRef.current
      const setup = trajectory.line.parent
      if (setup) {
        disposeLayers(layers)

        const refPlane = buildReferencePlane(refPlaneY, planeSize)
        const projectionLines = buildProjectionLines(enuPositions, refPlaneY)
        const groundProjection = buildGroundProjection(enuPositions, refPlaneY)

        setup.add(refPlane)
        setup.add(projectionLines)
        setup.add(groundProjection)

        layersRef.current = { refPlane, projectionLines, groundProjection }
      }
    },
    [],
  )

  const changeColorMode = useCallback(
    (track: Track, colorMode: ColorMode) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return
      updateColors(track, trajectory.line, colorMode)
    },
    [],
  )

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
