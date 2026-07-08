import { fromBlob } from 'geotiff'
import type { TerrainData, BoundingBox } from './TerrainTypes'

/**
 * Parse a GeoTIFF file and extract elevation data.
 *
 * Handles:
 * - Float32, Float64, Int16, Uint16, Int32, Uint32 pixel types
 * - Single-band DEM files
 * - Multi-band files (reads first band only)
 * - GeoTIFF with bounding box metadata
 * - NoData detection via GDAL_NODATA tag
 * - Non-georeferenced TIFF (graceful degradation, no bbox)
 */
export async function parseGeoTIFF(file: File): Promise<TerrainData> {
  if (file.size === 0) {
    throw new Error('DEM 文件为空')
  }

  let tiff: Awaited<ReturnType<typeof fromBlob>>
  try {
    tiff = await fromBlob(file)
  } catch {
    throw new Error('无法解析 GeoTIFF 文件，请确认文件格式正确')
  }

  const image = await tiff.getImage()
  const width = image.getWidth()
  const height = image.getHeight()

  if (width === 0 || height === 0) {
    throw new Error('DEM 文件尺寸无效')
  }

  // Read raster data (first band only)
  const rasters = await image.readRasters()
  if (!rasters || rasters.length === 0) {
    throw new Error('DEM 文件中没有找到数据波段')
  }

  const rawBand = rasters[0]

  // Check for multi-band RGB (not a DEM)
  const samplesPerPixel = image.getSamplesPerPixel?.()
  if (samplesPerPixel && samplesPerPixel >= 3) {
    const sampleFormat = image.getSampleFormat?.()
    const formatArr: (number | undefined)[] = Array.isArray(sampleFormat)
      ? sampleFormat
      : sampleFormat !== undefined
        ? [sampleFormat]
        : []
    if (formatArr.length > 0 && formatArr[0] === 1) {
      // Unsigned integer with 3 bands — probably RGB, warn but proceed with band 0
      console.warn(
        'TerrainParser: 检测到多波段图像（可能是 RGB），仅使用第一波段作为高程数据',
      )
    }
  }

  // Convert to Float32Array
  let elevations: Float32Array
  if (rawBand instanceof Float32Array) {
    elevations = rawBand
  } else if (rawBand instanceof Float64Array) {
    elevations = new Float32Array(rawBand)
  } else if (rawBand instanceof Uint8Array) {
    elevations = new Float32Array(rawBand)
  } else if (rawBand instanceof Int16Array) {
    elevations = new Float32Array(rawBand)
  } else if (rawBand instanceof Uint16Array) {
    elevations = new Float32Array(rawBand)
  } else if (rawBand instanceof Int32Array) {
    elevations = new Float32Array(rawBand)
  } else if (rawBand instanceof Uint32Array) {
    elevations = new Float32Array(rawBand)
  } else if (Array.isArray(rawBand)) {
    elevations = new Float32Array(rawBand as number[])
  } else {
    throw new Error(`不支持的 DEM 数据类型: ${typeof rawBand}`)
  }

  // Handle NoData values
  const noDataValue = getNoDataValue(image)
  if (noDataValue !== null) {
    let nodataCount = 0
    for (let i = 0; i < elevations.length; i++) {
      if (elevations[i] === noDataValue || !isFinite(elevations[i])) {
        elevations[i] = 0
        nodataCount++
      }
    }
    if (nodataCount > 0) {
      console.warn(
        `TerrainParser: ${nodataCount} 个 NoData 像素已替换为 0 (${((nodataCount / elevations.length) * 100).toFixed(1)}%)`,
      )
    }
  } else {
    // Clean NaN/Infinity even without explicit NoData
    let badCount = 0
    for (let i = 0; i < elevations.length; i++) {
      if (!isFinite(elevations[i])) {
        elevations[i] = 0
        badCount++
      }
    }
    if (badCount > 0) {
      console.warn(`TerrainParser: ${badCount} 个无效值已替换为 0`)
    }
  }

  // Compute min/max
  let minElevation = Infinity
  let maxElevation = -Infinity
  for (let i = 0; i < elevations.length; i++) {
    const v = elevations[i]
    if (v < minElevation) minElevation = v
    if (v > maxElevation) maxElevation = v
  }
  if (!isFinite(minElevation)) minElevation = 0
  if (!isFinite(maxElevation)) maxElevation = 0

  // Extract bounding box if available
  let bbox: BoundingBox | undefined
  try {
    const geoTiffBBox = image.getBoundingBox()
    if (geoTiffBBox) {
      bbox = {
        minLng: geoTiffBBox[0],
        minLat: geoTiffBBox[1],
        maxLng: geoTiffBBox[2],
        maxLat: geoTiffBBox[3],
      }
    }
  } catch {
    // Non-georeferenced TIFF — gracefully continue without bbox
    console.warn('TerrainParser: 无法读取地理参考信息，地形将无地理包围盒')
  }

  return {
    width,
    height,
    elevations,
    minElevation,
    maxElevation,
    bbox,
  }
}

/**
 * Extract GDAL_NODATA value from GeoTIFF metadata if present.
 */
function getNoDataValue(image: {
  getGDALNoData?: () => number | null | string
}): number | null {
  try {
    const nodata = image.getGDALNoData?.()
    if (nodata === null || nodata === undefined) return null
    const num = Number(nodata)
    return isFinite(num) ? num : null
  } catch {
    return null
  }
}
