/** Geographic bounding box from GeoTIFF metadata */
export interface BoundingBox {
  /** min longitude (west) */
  minLng: number
  /** min latitude (south) */
  minLat: number
  /** max longitude (east) */
  maxLng: number
  /** max latitude (north) */
  maxLat: number
}

/** Parsed DEM elevation data */
export interface TerrainData {
  /** pixel width (columns) */
  width: number
  /** pixel height (rows) */
  height: number
  /** elevation values in meters, row-major, length = width * height */
  elevations: Float32Array
  /** minimum elevation value (meters) */
  minElevation: number
  /** maximum elevation value (meters) */
  maxElevation: number
  /** geographic extent from GeoTIFF metadata (if available) */
  bbox?: BoundingBox
}

/** Terrain display settings */
export interface TerrainSettings {
  /** horizontal scaling factor (default 1) */
  scaleXY: number
  /** vertical elevation exaggeration (default 0.2) */
  scaleHeight: number
}

/** Terrain file metadata for UI display */
export interface TerrainFileInfo {
  name: string
  size: number
}

/** Terrain loading state machine */
export type TerrainState = 'idle' | 'selected' | 'loading' | 'loaded' | 'error'
