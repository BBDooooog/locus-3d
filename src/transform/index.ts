import type { TrackPoint } from '../types/track'
import { wgs84ToECEF } from './wgs84'
import { batchEcefToENU, type ENUPoint } from './ecef'

export type { ENUPoint }

/**
 * Convert an array of TrackPoints from WGS84 (lat/lng/alt) to
 * local ENU coordinates suitable for Three.js rendering.
 *
 * The first point becomes the ENU origin.
 *
 * Mapping to Three.js:
 *   East  → -X (negated so East appears on the right from default camera)
 *   Up    → Y (with altitudeScale applied)
 *   North → Z
 */
export function wgs84ToENU(
  points: TrackPoint[],
  altitudeScale: number = 1,
): Float32Array {
  if (points.length === 0) return new Float32Array(0)

  // Step 1: WGS84 → ECEF for all points
  const ecefPoints = points.map((p) => wgs84ToECEF(p.lat, p.lng, p.altitude))

  // Step 2: ECEF → ENU (batch), using first point's lat/lng as reference
  const refLat = points[0].lat
  const refLng = points[0].lng
  const enuPoints = batchEcefToENU(ecefPoints, refLat, refLng)

  // Step 3: Pack into Float32Array [East, Up, North] → [X, Y, Z]
  const positions = new Float32Array(points.length * 3)
  for (let i = 0; i < enuPoints.length; i++) {
    const idx = i * 3
    positions[idx] = -enuPoints[i].east // Three.js X (negated so East→right)
    positions[idx + 1] = enuPoints[i].up * altitudeScale // Three.js Y
    positions[idx + 2] = enuPoints[i].north // Three.js Z
  }

  return positions
}
