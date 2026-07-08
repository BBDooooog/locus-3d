import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { Track, ColorMode } from '../types/track'
import { buildTrajectory, updateAltitudeScale, updateColors, updateLineResolution } from '../geometry/trajectoryBuilder'
import { buildMarkers, type Markers } from '../geometry/markerBuilder'
import type { SceneSetup } from './useScene'

export function useTrajectory() {
  const trajectoryRef = useRef<ReturnType<typeof buildTrajectory> | null>(null)
  const markersRef = useRef<Markers | null>(null)

  const loadTrack = useCallback(
    (
      setup: SceneSetup,
      track: Track,
      colorMode: ColorMode,
      altitudeScale: number,
    ) => {
      // Dispose previous
      trajectoryRef.current?.dispose()
      markersRef.current?.dispose()

      const trajectory = buildTrajectory(track, colorMode, altitudeScale)
      const markers = buildMarkers(track, altitudeScale)

      setup.scene.add(trajectory.line)
      setup.scene.add(markers.start)
      setup.scene.add(markers.end)

      trajectoryRef.current = trajectory
      markersRef.current = markers

      // Compute bounding box of the trajectory
      const box = new THREE.Box3().setFromObject(trajectory.line)
      return box
    },
    [],
  )

  const changeAltitudeScale = useCallback(
    (track: Track, altitudeScale: number) => {
      const trajectory = trajectoryRef.current
      if (!trajectory) return

      updateAltitudeScale(track, trajectory.line, altitudeScale)

      // Rebuild markers at new positions
      const setup = markersRef.current
      if (setup && markersRef.current) {
        const oldMarkers = markersRef.current
        const newMarkers = buildMarkers(track, altitudeScale)
        // Copy new positions to old markers
        oldMarkers.start.position.copy(newMarkers.start.position)
        oldMarkers.end.position.copy(newMarkers.end.position)
        newMarkers.dispose()
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
    trajectoryRef.current = null
    markersRef.current = null
  }, [])

  return {
    loadTrack,
    changeAltitudeScale,
    changeColorMode,
    updateRes,
    dispose,
  }
}
