import * as THREE from 'three'
import { createTerrainMaterial } from './TerrainMaterial'
import type { TerrainData, TerrainSettings } from './TerrainTypes'

/**
 * Build a Three.js Mesh from DEM elevation data.
 *
 * Uses PlaneGeometry with vertex Y positions displaced by elevation values.
 * The plane is rotated to lie flat (XZ plane, Y up).
 */
export function buildTerrainMesh(
  data: TerrainData,
  settings: TerrainSettings,
): THREE.Mesh {
  const terrainWidth = data.width * settings.scaleXY
  const terrainDepth = data.height * settings.scaleXY

  // PlaneGeometry is in XY plane by default; rotate to XZ (Y up)
  const geometry = new THREE.PlaneGeometry(
    terrainWidth,
    terrainDepth,
    data.width - 1,
    data.height - 1,
  )
  geometry.rotateX(-Math.PI / 2)

  // Displace vertices by elevation
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const elev = data.elevations[i] ?? 0
    positions.setY(i, (elev - data.minElevation) * settings.scaleHeight)
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()

  const material = createTerrainMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'terrain-mesh'
  mesh.receiveShadow = true
  mesh.castShadow = true
  mesh.frustumCulled = true

  return mesh
}
