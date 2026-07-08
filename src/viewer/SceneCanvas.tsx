import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useViewerStore } from '../store/useViewerStore'
import { useScene } from './useScene'
import { useTrajectory } from './useTrajectory'
import { useFlyover } from './useFlyover'
import type { SceneSetup } from './useScene'

export default function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { getSetup, fitCameraToBox } = useScene(containerRef)
  const { loadTrack, changeAltitudeScale, changeColorMode } = useTrajectory()
  const { buildCurve, startFlyover, pauseFlyover, stopFlyover } = useFlyover()

  const track = useViewerStore((s) => s.track)
  const settings = useViewerStore((s) => s.settings)
  const isFlyoverPlaying = useViewerStore((s) => s.isFlyoverPlaying)

  // Load track when it changes
  useEffect(() => {
    const setup = getSetup()
    if (!setup || !track) return

    const box = loadTrack(setup, track, settings.colorMode, settings.altitudeScale)
    buildCurve(track, settings.altitudeScale)

    if (box) {
      fitCameraToBox(box)
    }

    // Auto rotate
    setup.controls.autoRotate = settings.autoRotate
    setup.controls.autoRotateSpeed = settings.autoRotateSpeed
  }, [track]) // Only on track change

  // Sync autoRotate
  useEffect(() => {
    const setup = getSetup()
    if (!setup || !track) return
    setup.controls.autoRotate = settings.autoRotate
    setup.controls.autoRotateSpeed = settings.autoRotateSpeed
  }, [settings.autoRotate, settings.autoRotateSpeed, track, getSetup])

  // Sync altitude scale
  useEffect(() => {
    if (!track) return
    changeAltitudeScale(track, settings.altitudeScale)
    buildCurve(track, settings.altitudeScale)
  }, [settings.altitudeScale, track, changeAltitudeScale, buildCurve])

  // Sync color mode
  useEffect(() => {
    if (!track) return
    changeColorMode(track, settings.colorMode)
  }, [settings.colorMode, track, changeColorMode])

  // Sync grid/axis visibility
  useEffect(() => {
    const setup = getSetup()
    if (!setup) return
    setup.grid.visible = settings.showGrid
    setup.axes.visible = settings.showAxis
  }, [settings.showGrid, settings.showAxis, getSetup])

  // Flyover
  useEffect(() => {
    const setup = getSetup()
    if (!setup) return
    if (isFlyoverPlaying) {
      startFlyover(setup)
    }
  }, [isFlyoverPlaying, getSetup, startFlyover])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const setup = getSetup()
      if (!setup || !track) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          useViewerStore.getState().setAutoRotate(
            !useViewerStore.getState().settings.autoRotate,
          )
          break
        case 'r':
        case 'R':
          e.preventDefault()
          // Re-fit camera
          const trajectory = setup.scene.children.find((c) => c.type === 'Line2') as THREE.Object3D | undefined
          if (trajectory) {
            const box = new THREE.Box3().setFromObject(trajectory)
            fitCameraToBox(box)
          }
          break
        case 'f':
        case 'F':
          e.preventDefault()
          if (useViewerStore.getState().isFlyoverPlaying) {
            stopFlyover(setup)
          } else {
            startFlyover(setup)
          }
          break
        case '1':
          useViewerStore.getState().setColorMode('altitude')
          break
        case '2':
          useViewerStore.getState().setColorMode('speed')
          break
        case '3':
          useViewerStore.getState().setColorMode('heartRate')
          break
        case '4':
          useViewerStore.getState().setColorMode('cadence')
          break
        case '5':
          useViewerStore.getState().setColorMode('gradient')
          break
        case 'ArrowUp':
          e.preventDefault()
          useViewerStore.getState().setAltitudeScale(
            Math.min(10, useViewerStore.getState().settings.altitudeScale + 1),
          )
          break
        case 'ArrowDown':
          e.preventDefault()
          useViewerStore.getState().setAltitudeScale(
            Math.max(1, useViewerStore.getState().settings.altitudeScale - 1),
          )
          break
      }
    },
    [getSetup, track, fitCameraToBox, startFlyover, stopFlyover],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ touchAction: 'none' }}
    />
  )
}
