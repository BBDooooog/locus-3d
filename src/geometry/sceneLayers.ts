import * as THREE from 'three'

/**
 * Build a large semi-transparent reference plane at the given Y height.
 * This serves as the visual ground reference for the trajectory.
 */
export function buildReferencePlane(minY: number, size: number): THREE.Group {
  const group = new THREE.Group()

  // Main plane — subtle grey, low opacity
  const planeGeom = new THREE.PlaneGeometry(size, size)
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x2a2a3a,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const plane = new THREE.Mesh(planeGeom, planeMat)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = minY
  plane.renderOrder = 1
  group.add(plane)

  // Subtle grid overlay on the plane
  const gridSize = size
  const gridDivs = Math.floor(size / 10) // grid cell = 10 units
  const gridHelper = new THREE.GridHelper(gridSize, gridDivs, '#ffffff10', '#ffffff06')
  gridHelper.position.y = minY + 0.05 // slightly above plane to avoid z-fighting
  gridHelper.renderOrder = 2
  group.add(gridHelper)

  return group
}

/**
 * Build vertical projection lines from each trajectory point down to the reference plane.
 * Uses LineSegments for efficient rendering — each point becomes one vertical segment.
 */
export function buildProjectionLines(
  enuPositions: Float32Array,
  refPlaneY: number,
): THREE.LineSegments {
  const pointCount = enuPositions.length / 3

  // Each segment has 2 vertices: (top) and (projected to plane)
  const vertices = new Float32Array(pointCount * 2 * 3)

  for (let i = 0; i < pointCount; i++) {
    const srcIdx = i * 3
    const dstIdx = i * 6 // 2 vertices per segment

    const x = enuPositions[srcIdx]
    const y = enuPositions[srcIdx + 1]
    const z = enuPositions[srcIdx + 2]

    // Top vertex
    vertices[dstIdx] = x
    vertices[dstIdx + 1] = y
    vertices[dstIdx + 2] = z

    // Bottom vertex (on reference plane)
    vertices[dstIdx + 3] = x
    vertices[dstIdx + 4] = refPlaneY
    vertices[dstIdx + 5] = z
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0x8899bb,
    transparent: true,
    opacity: 0.12,
    depthWrite: true,
    depthTest: true,
  })

  const lines = new THREE.LineSegments(geometry, material)
  lines.renderOrder = 0
  return lines
}

/**
 * Build the ground projection — a flat "shadow" of the trajectory on the reference plane.
 * Uses Line2 for variable-width rendering (thin, subtle line).
 */
export function buildGroundProjection(
  enuPositions: Float32Array,
  refPlaneY: number,
): THREE.Line {
  const pointCount = enuPositions.length / 3

  // Build flat positions on the reference plane
  const flatPositions = new Float32Array(pointCount * 3)
  for (let i = 0; i < pointCount; i++) {
    const srcIdx = i * 3
    flatPositions[srcIdx] = enuPositions[srcIdx]       // X (east)
    flatPositions[srcIdx + 1] = refPlaneY                // Y (on plane)
    flatPositions[srcIdx + 2] = enuPositions[srcIdx + 2] // Z (north)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(flatPositions, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0x667799,
    transparent: true,
    opacity: 0.5,
    depthTest: true,
    depthWrite: true,
  })

  const line = new THREE.Line(geometry, material)
  line.renderOrder = 0
  return line
}

/** Dispose all resources in a scene layers group */
export function disposeLayers(
  layers: {
    refPlane?: THREE.Group | null
    projectionLines?: THREE.LineSegments | null
    groundProjection?: THREE.Line | null
  },
) {
  if (layers.refPlane) {
    layers.refPlane.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
      if (child instanceof THREE.GridHelper) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    })
  }
  if (layers.projectionLines) {
    layers.projectionLines.geometry.dispose()
    ;(layers.projectionLines.material as THREE.Material).dispose()
  }
  if (layers.groundProjection) {
    layers.groundProjection.geometry.dispose()
    ;(layers.groundProjection.material as THREE.Material).dispose()
  }
}
