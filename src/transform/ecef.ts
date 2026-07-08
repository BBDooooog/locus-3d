/**
 * Convert ECEF (Earth-Centered Earth-Fixed) coordinates to
 * ENU (East-North-Up) local tangent plane coordinates.
 *
 * The reference point is the origin of the local ENU frame.
 */

export interface ECEFPoint {
  x: number
  y: number
  z: number
}

export interface ENUPoint {
  east: number
  north: number
  up: number
}

/** Convert a single ECEF point to ENU relative to a reference point */
export function ecefToENU(
  point: ECEFPoint,
  ref: ECEFPoint,
  refLat: number,
  refLng: number,
): ENUPoint {
  const phi = (refLat * Math.PI) / 180
  const lambda = (refLng * Math.PI) / 180

  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)

  const dx = point.x - ref.x
  const dy = point.y - ref.y
  const dz = point.z - ref.z

  // Rotation matrix from ECEF to ENU
  const east = -sinLambda * dx + cosLambda * dy
  const north = -sinPhi * cosLambda * dx - sinPhi * sinLambda * dy + cosPhi * dz
  const up = cosPhi * cosLambda * dx + cosPhi * sinLambda * dy + sinPhi * dz

  return { east, north, up }
}

/** Batch convert an array of ECEF points to ENU */
export function batchEcefToENU(
  points: ECEFPoint[],
  refLat: number,
  refLng: number,
): ENUPoint[] {
  // Use the first point as reference
  const ref = points[0]

  const phi = (refLat * Math.PI) / 180
  const lambda = (refLng * Math.PI) / 180

  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)

  return points.map((point) => {
    const dx = point.x - ref.x
    const dy = point.y - ref.y
    const dz = point.z - ref.z

    const east = -sinLambda * dx + cosLambda * dy
    const north =
      -sinPhi * cosLambda * dx - sinPhi * sinLambda * dy + cosPhi * dz
    const up =
      cosPhi * cosLambda * dx + cosPhi * sinLambda * dy + sinPhi * dz

    return { east, north, up }
  })
}
