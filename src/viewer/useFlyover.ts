import { useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import type { Track } from '../types/track'
import { wgs84ToENU } from '../transform'
import { useViewerStore } from '../store/useViewerStore'
import type { SceneSetup } from './useScene'

export function useFlyover() {
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null)
  const tRef = useRef(0)
  const animRef = useRef<number>(0)
  const speed = useViewerStore((s) => s.flyoverSpeed)
  const isPlaying = useViewerStore((s) => s.isFlyoverPlaying)
  const setPlaying = useViewerStore((s) => s.setFlyoverPlaying)

  const buildCurve = useCallback((track: Track, altitudeScale: number) => {
    const positions = wgs84ToENU(track.points, altitudeScale)
    const points: THREE.Vector3[] = []
    for (let i = 0; i < positions.length; i += 3) {
      points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]))
    }
    curveRef.current = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
  }, [])

  const startFlyover = useCallback(
    (setup: SceneSetup) => {
      if (!curveRef.current) return

      const { camera, controls } = setup
      controls.enabled = false
      setPlaying(true)
      tRef.current = 0

      function animate() {
        if (!curveRef.current) return

        tRef.current += 0.0003 * speed
        if (tRef.current >= 1) {
          tRef.current = 0
          setPlaying(false)
          controls.enabled = true
          return
        }

        const pt = curveRef.current.getPointAt(tRef.current)
        const lookAt = curveRef.current.getPointAt(Math.min(tRef.current + 0.005, 1))

        camera.position.copy(pt)
        camera.lookAt(lookAt)

        animRef.current = requestAnimationFrame(animate)
      }
      animate()
    },
    [speed, setPlaying],
  )

  const pauseFlyover = useCallback((setup: SceneSetup) => {
    cancelAnimationFrame(animRef.current)
    setPlaying(false)
    setup.controls.enabled = true
  }, [setPlaying])

  const stopFlyover = useCallback((setup: SceneSetup) => {
    cancelAnimationFrame(animRef.current)
    tRef.current = 0
    setPlaying(false)
    setup.controls.enabled = true
  }, [setPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return {
    buildCurve,
    startFlyover,
    pauseFlyover,
    stopFlyover,
  }
}
