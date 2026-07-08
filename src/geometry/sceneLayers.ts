import * as THREE from 'three'

export interface PlaneBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/**
 * Compute the XZ bounding box of ENU positions, with 10% margin.
 */
export function computeXZBounds(enuPositions: Float32Array): PlaneBounds {
  let minX = Infinity,
    maxX = -Infinity
  let minZ = Infinity,
    maxZ = -Infinity

  for (let i = 0; i < enuPositions.length; i += 3) {
    const x = enuPositions[i]
    const z = enuPositions[i + 2]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }

  // Add 10% margin
  const marginX = (maxX - minX) * 0.1 || 10
  const marginZ = (maxZ - minZ) * 0.1 || 10

  return {
    minX: minX - marginX,
    maxX: maxX + marginX,
    minZ: minZ - marginZ,
    maxZ: maxZ + marginZ,
  }
}

/**
 * Build reference plane — just a GridHelper at the reference Y height.
 * No separate plane mesh to avoid z-fighting.
 * Size matches the trajectory XZ bounds + 10%.
 */
export function buildReferencePlane(
  refPlaneY: number,
  bounds: PlaneBounds,
): THREE.GridHelper {
  const sizeX = bounds.maxX - bounds.minX
  const sizeZ = bounds.maxZ - bounds.minZ
  const size = Math.max(sizeX, sizeZ)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerZ = (bounds.minZ + bounds.maxZ) / 2

  // Grid cell size roughly 5% of the plane size, min 10 divisions
  const divisions = Math.max(Math.round(size / 20), 10)

  const grid = new THREE.GridHelper(size, divisions, '#ffffff12', '#ffffff06')
  grid.position.set(centerX, refPlaneY, centerZ)
  grid.renderOrder = 1

  return grid
}

/**
 * Build vertical projection lines from each trajectory point down to the reference plane.
 * Uses LineSegments — each point → one vertical segment.
 */
export function buildProjectionLines(
  enuPositions: Float32Array,
  refPlaneY: number,
): THREE.LineSegments {
  const pointCount = enuPositions.length / 3

  // Each segment: 2 vertices (top, bottom on plane)
  const vertices = new Float32Array(pointCount * 2 * 3)

  for (let i = 0; i < pointCount; i++) {
    const srcIdx = i * 3
    const dstIdx = i * 6

    const x = enuPositions[srcIdx]
    const y = enuPositions[srcIdx + 1]
    const z = enuPositions[srcIdx + 2]

    // Top (trajectory point)
    vertices[dstIdx] = x
    vertices[dstIdx + 1] = y
    vertices[dstIdx + 2] = z

    // Bottom (on reference plane)
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
    depthTest: true,
    depthWrite: true,
  })

  const lines = new THREE.LineSegments(geometry, material)
  lines.renderOrder = 0
  return lines
}

/**
 * Build the ground projection — a flat "shadow" of the trajectory on the reference plane.
 * Offset slightly above the grid to prevent z-fighting.
 */
export function buildGroundProjection(
  enuPositions: Float32Array,
  refPlaneY: number,
): THREE.Line {
  const pointCount = enuPositions.length / 3

  const flatPositions = new Float32Array(pointCount * 3)
  const planeY = refPlaneY + 0.1 // slight offset above grid

  for (let i = 0; i < pointCount; i++) {
    const srcIdx = i * 3
    flatPositions[srcIdx] = enuPositions[srcIdx]
    flatPositions[srcIdx + 1] = planeY
    flatPositions[srcIdx + 2] = enuPositions[srcIdx + 2]
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(flatPositions, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0x667799,
    transparent: true,
    opacity: 0.45,
    depthTest: true,
    depthWrite: true,
  })

  const line = new THREE.Line(geometry, material)
  line.renderOrder = 0
  return line
}

/**
 * Build compass direction labels (N / S / E / W) as canvas-based sprites.
 * Placed at the center of the reference plane, spanning ~20% of plane size.
 * ENU mapping: East → +X, North → +Z.
 */
export function buildCompassLabels(
  bounds: PlaneBounds,
  refPlaneY: number,
): THREE.Group {
  const group = new THREE.Group()
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerZ = (bounds.minZ + bounds.maxZ) / 2
  const planeW = bounds.maxX - bounds.minX
  const planeH = bounds.maxZ - bounds.minZ
  const planeSize = Math.max(planeW, planeH)

  // Offset from center = 10% of plane (so compass spans ~20%)
  const offset = planeSize * 0.1
  // Each sprite size = 6% of plane
  const spriteSize = planeSize * 0.06

  const directions = [
    { label: 'N', x: centerX, z: centerZ + offset },
    { label: 'S', x: centerX, z: centerZ - offset },
    { label: 'E', x: centerX + offset, z: centerZ },
    { label: 'W', x: centerX - offset, z: centerZ },
  ]

  for (const { label, x, z } of directions) {
    const sprite = makeTextSprite(label)
    sprite.position.set(x, refPlaneY + 0.3, z)
    sprite.scale.set(spriteSize, spriteSize, 1)
    group.add(sprite)
  }

  return group
}

/** Create a single text sprite using a canvas */
function makeTextSprite(text: string): THREE.Sprite {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, size / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.2,
    depthTest: true,
    depthWrite: false,
  })

  const sprite = new THREE.Sprite(material)
  sprite.renderOrder = 3
  return sprite
}

/** Dispose all scene layer objects */
export function disposeLayers(layers: {
  refPlane?: THREE.GridHelper | null
  projectionLines?: THREE.LineSegments | null
  groundProjection?: THREE.Line | null
  compass?: THREE.Group | null
}) {
  if (layers.refPlane) {
    layers.refPlane.geometry.dispose()
    ;(layers.refPlane.material as THREE.Material).dispose()
  }
  if (layers.projectionLines) {
    layers.projectionLines.geometry.dispose()
    ;(layers.projectionLines.material as THREE.Material).dispose()
  }
  if (layers.groundProjection) {
    layers.groundProjection.geometry.dispose()
    ;(layers.groundProjection.material as THREE.Material).dispose()
  }
  if (layers.compass) {
    layers.compass.traverse((child) => {
      if (child instanceof THREE.Sprite) {
        const mat = child.material as THREE.SpriteMaterial
        mat.map?.dispose()
        mat.dispose()
      }
    })
  }
}
