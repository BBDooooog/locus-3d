import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useViewerStore } from '../store/useViewerStore'
import { useTerrainStore } from '../store/useTerrainStore'
import { useScene } from './useScene'
import { useTrajectory } from './useTrajectory'
import { useFlyover } from './useFlyover'
import { TerrainManager } from '../terrain/TerrainManager'
import { loadTerrainFromFile } from '../terrain/TerrainLoader'

export default function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { getSetup, fitCameraToBox } = useScene(containerRef)
  const {
    loadTrack,
    changeAltitudeScale,
    changeColorMode,
    changeReferencePlane,
    changeTrajectoryScale,
    applyLayerVisibility,
  } = useTrajectory()
  const { buildCurve, startFlyover, pauseFlyover, stopFlyover } = useFlyover()

  const terrainManagerRef = useRef<TerrainManager | null>(null)

  const track = useViewerStore((s) => s.track)
  const settings = useViewerStore((s) => s.settings)
  const isFlyoverPlaying = useViewerStore((s) => s.isFlyoverPlaying)

  // Terrain store subscriptions
  const terrainState = useTerrainStore((s) => s.state)
  const terrainFile = useTerrainStore((s) => s.file)
  const terrainSettings = useTerrainStore((s) => s.settings)
  const terrainSetLoaded = useTerrainStore((s) => s.setLoaded)
  const terrainSetError = useTerrainStore((s) => s.setError)
  const isTerrainLoaded = useTerrainStore((s) => s.state === 'loaded')

  /** Get or create the TerrainManager (lazy init, scene must be ready) */
  function getOrCreateManager(): TerrainManager | null {
    if (terrainManagerRef.current) return terrainManagerRef.current
    const setup = getSetup()
    if (!setup) return null

    const manager = new TerrainManager()
    manager.attachToScene(setup.scene)
    terrainManagerRef.current = manager
    return manager
  }

  // Handle terrain loading trigger (state === 'loading')
  useEffect(() => {
    if (terrainState !== 'loading' || !terrainFile) return

    const manager = getOrCreateManager()
    if (!manager) return

    let cancelled = false

    loadTerrainFromFile(terrainFile, manager, terrainSettings)
      .then((data) => {
        if (cancelled) return
        terrainSetLoaded(data, {
          name: terrainFile.name,
          size: terrainFile.size,
        })
      })
      .catch((err) => {
        if (cancelled) return
        terrainSetError(err instanceof Error ? err.message : '地形加载失败')
      })

    return () => {
      cancelled = true
    }
  }, [terrainState, terrainFile, terrainSettings, terrainSetLoaded, terrainSetError])

  // Fit camera to terrain on first load
  const prevTerrainLoaded = useRef(false)
  useEffect(() => {
    if (!isTerrainLoaded) {
      prevTerrainLoaded.current = false
      return
    }
    if (prevTerrainLoaded.current) return
    prevTerrainLoaded.current = true

    const manager = terrainManagerRef.current
    if (!manager) return

    const box = manager.getBoundingBox()
    if (box) {
      fitCameraToBox(box)
    }
  }, [isTerrainLoaded, fitCameraToBox])

  // Handle terrain removal & cleanup on unmount
  useEffect(() => {
    if (terrainState === 'idle') {
      terrainManagerRef.current?.clear()
    }
  }, [terrainState])

  // Dispose TerrainManager on unmount
  useEffect(() => {
    return () => {
      terrainManagerRef.current?.dispose()
      terrainManagerRef.current = null
    }
  }, [])

  // Load track when it changes
  useEffect(() => {
    const setup = getSetup()
    if (!setup || !track) return

    const box = loadTrack(
      setup,
      track,
      settings.colorMode,
      settings.altitudeScale,
      settings.referencePlaneMode,
      settings.trajectoryScale,
    )
    buildCurve(track, settings.altitudeScale)

    if (box) {
      fitCameraToBox(box)
    }

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

  // Sync altitude scale (only affects trajectory + projection lines)
  useEffect(() => {
    if (!track) return
    changeAltitudeScale(track, settings.altitudeScale, settings.trajectoryScale, settings.layers)
    buildCurve(track, settings.altitudeScale)
  }, [settings.altitudeScale, track, settings.trajectoryScale, settings.layers, changeAltitudeScale, buildCurve])

  // Sync color mode
  useEffect(() => {
    if (!track) return
    changeColorMode(track, settings.colorMode)
  }, [settings.colorMode, track, changeColorMode])

  // Sync reference plane mode
  useEffect(() => {
    if (!track) return
    changeReferencePlane(track, settings.altitudeScale, settings.referencePlaneMode, settings.trajectoryScale, settings.layers)
  }, [settings.referencePlaneMode, track, settings.altitudeScale, settings.trajectoryScale, settings.layers, changeReferencePlane])

  // Sync trajectory scale (uniform scaling for everything)
  useEffect(() => {
    if (!track) return
    changeTrajectoryScale(track, settings.altitudeScale, settings.referencePlaneMode, settings.trajectoryScale, settings.layers)
  }, [settings.trajectoryScale, track, settings.altitudeScale, settings.referencePlaneMode, settings.layers, changeTrajectoryScale])

  // Sync layer visibility
  useEffect(() => {
    applyLayerVisibility(settings.layers)
  }, [settings.layers, applyLayerVisibility])

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
          // Re-fit camera to full scene (trajectory + terrain)
          const box = new THREE.Box3()
          const trajectory = setup.scene.children.find(
            (c) => c.type === 'Line2',
          ) as THREE.Object3D | undefined
          if (trajectory) {
            box.expandByObject(trajectory)
          }
          // Expand to include reference plane
          const refPlaneGroup = setup.scene.children.find(
            (c) => c instanceof THREE.Group && c.children.length >= 2,
          )
          if (refPlaneGroup) box.expandByObject(refPlaneGroup)
          // Expand to include terrain
          if (terrainManagerRef.current) {
            const terrainBox = terrainManagerRef.current.getBoundingBox()
            if (terrainBox) {
              box.expandByObject(terrainManagerRef.current.getGroup())
            }
          }
          if (!box.isEmpty()) {
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
