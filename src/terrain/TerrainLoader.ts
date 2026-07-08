import { parseGeoTIFF } from './TerrainParser'
import { buildTerrainMesh } from './TerrainMeshBuilder'
import { TerrainManager } from './TerrainManager'
import type { TerrainData } from './TerrainTypes'
import type { TerrainSettings } from './TerrainTypes'

/**
 * High-level orchestrator: file → parse → mesh → scene.
 * Returns the parsed TerrainData so the caller can store it in state.
 */
export async function loadTerrainFromFile(
  file: File,
  manager: TerrainManager,
  settings: TerrainSettings,
): Promise<TerrainData> {
  // Validate file extension
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext !== 'tif' && ext !== 'tiff') {
    throw new Error('不支持的文件格式，请选择 .tif 或 .tiff 文件')
  }

  // Parse GeoTIFF
  const data = await parseGeoTIFF(file)

  if (data.width === 0 || data.height === 0) {
    throw new Error('DEM 文件尺寸无效')
  }

  // Build mesh and add to scene
  manager.load(data, settings)

  return data
}
