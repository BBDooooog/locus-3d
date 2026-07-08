import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface SceneSetup {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  ambientLight: THREE.AmbientLight
  directionalLight: THREE.DirectionalLight
}

export function useScene(containerRef: React.RefObject<HTMLDivElement | null>) {
  const setupRef = useRef<SceneSetup | null>(null)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // --- Scene ---
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a2e')
    // Fog pushed far back so the reference plane remains visible
    scene.fog = new THREE.Fog('#1a1a2e', 5000, 100000)

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100000,
    )
    camera.position.set(100, 80, 150)

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1
    controls.maxDistance = 50000
    controls.target.set(0, 0, 0)
    controls.autoRotate = false
    controls.autoRotateSpeed = 2
    controls.update()

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight('#8899bb', 1.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
    directionalLight.position.set(1, 1, 0.5)
    scene.add(directionalLight)

    setupRef.current = {
      scene,
      camera,
      renderer,
      controls,
      ambientLight,
      directionalLight,
    }

    // --- Render Loop ---
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // --- Resize Handler ---
    function handleResize() {
      if (!container || !setupRef.current) return
      const { camera: cam, renderer: r } = setupRef.current
      cam.aspect = container.clientWidth / container.clientHeight
      cam.updateProjectionMatrix()
      r.setSize(container.clientWidth, container.clientHeight)
      // Also update line material resolution
      scene.traverse((obj) => {
        if (obj.type === 'Line2') {
          const mat = (obj as THREE.Line).material as { resolution?: THREE.Vector2 }
          if (mat.resolution) {
            mat.resolution.set(container.clientWidth, container.clientHeight)
          }
        }
      })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      controls.dispose()
    }
  }, [containerRef])

  const fitCameraToBox = useCallback((box: THREE.Box3) => {
    const setup = setupRef.current
    if (!setup) return

    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const radius = size.length() * 0.6

    // Animate camera to fit bounding box
    const targetPos = new THREE.Vector3(
      center.x + radius * 0.7,
      center.y + radius * 0.6,
      center.z + radius * 0.7,
    )

    const startPos = setup.camera.position.clone()
    const startTarget = setup.controls.target.clone()
    const startTime = performance.now()
    const duration = 1500 // ms

    function animateFit(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1.0)
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3)

      setup!.camera.position.lerpVectors(startPos, targetPos, ease)
      setup!.controls.target.lerpVectors(startTarget, center, ease)
      setup!.controls.update()

      if (t < 1) {
        requestAnimationFrame(animateFit)
      }
    }
    requestAnimationFrame(animateFit)
  }, [])

  const getSetup = useCallback(() => setupRef.current, [])

  const getBoundingBoxCenter = useCallback(() => {
    const setup = setupRef.current
    if (!setup) return new THREE.Vector3()
    return setup.controls.target.clone()
  }, [])

  return {
    getSetup,
    fitCameraToBox,
    getBoundingBoxCenter,
  }
}
