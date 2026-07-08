import * as THREE from 'three'

/**
 * Create a MeshStandardMaterial for the terrain.
 * Phase 1: simple gray with flat shading (no textures).
 */
export function createTerrainMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x888888,
    flatShading: true,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
    transparent: false,
    wireframe: false,
  })
}

/**
 * Update an existing terrain material (placeholder for future textures).
 */
export function updateTerrainMaterial(
  material: THREE.MeshStandardMaterial,
  _data?: unknown,
): void {
  // Phase 1: no dynamic updates needed
  // Future: apply textures, vertex colors from slope, etc.
  void material
  void _data
}
