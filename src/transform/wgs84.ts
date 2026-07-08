// WGS84 ellipsoid constants
const WGS84_A = 6378137.0 // semi-major axis (meters)
const WGS84_F = 1 / 298.257223563 // flattening
const WGS84_E2 = WGS84_F * (2 - WGS84_F) // first eccentricity squared

/** Convert WGS84 (lat, lng, altitude) to ECEF (X, Y, Z) */
export function wgs84ToECEF(
  lat: number,
  lng: number,
  altitude: number,
): { x: number; y: number; z: number } {
  const phi = (lat * Math.PI) / 180 // latitude in radians
  const lambda = (lng * Math.PI) / 180 // longitude in radians
  const h = altitude

  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)

  // Prime vertical radius of curvature
  const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi * sinPhi)

  const x = (N + h) * cosPhi * cosLambda
  const y = (N + h) * cosPhi * sinLambda
  const z = (N * (1 - WGS84_E2) + h) * sinPhi

  return { x, y, z }
}

/** Get the WGS84 ellipsoid parameters for reference */
export function getWGS84Params() {
  return { a: WGS84_A, f: WGS84_F, e2: WGS84_E2 }
}
