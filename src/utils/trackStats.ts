import type { Track, TrackPoint } from '../types/track'

const EARTH_RADIUS_M = 6_371_000

export interface TrackStats {
  totalDistance: number // meters
  totalElevationGain: number // meters
  totalElevationLoss: number // meters
  maxAltitude: number
  minAltitude: number
  duration: number // seconds
  avgSpeed: number // m/s
  maxSpeed: number
  pointCount: number
}

/** Compute the Haversine distance between two lat/lng points (meters) */
function haversineDistance(a: TrackPoint, b: TrackPoint): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180

  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon

  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function computeTrackStats(track: Track): TrackStats {
  const { points } = track
  const stats: TrackStats = {
    totalDistance: 0,
    totalElevationGain: 0,
    totalElevationLoss: 0,
    maxAltitude: -Infinity,
    minAltitude: Infinity,
    duration: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    pointCount: points.length,
  }

  if (points.length === 0) {
    stats.maxAltitude = 0
    stats.minAltitude = 0
    return stats
  }

  let totalSpeed = 0
  let speedCount = 0

  for (let i = 0; i < points.length; i++) {
    const p = points[i]

    // Altitude
    if (p.altitude > stats.maxAltitude) stats.maxAltitude = p.altitude
    if (p.altitude < stats.minAltitude) stats.minAltitude = p.altitude

    // Distance, elevation gain/loss (between consecutive points)
    if (i > 0) {
      const prev = points[i - 1]
      stats.totalDistance += haversineDistance(prev, p)

      const dAlt = p.altitude - prev.altitude
      if (dAlt > 0) stats.totalElevationGain += dAlt
      else stats.totalElevationLoss += Math.abs(dAlt)
    }

    // Speed (prefer from data, else compute from distance/time)
    if (p.speed !== undefined && p.speed > 0) {
      totalSpeed += p.speed
      speedCount++
      if (p.speed > stats.maxSpeed) stats.maxSpeed = p.speed
    }
  }

  // Duration
  if (points.length >= 2) {
    stats.duration =
      (points[points.length - 1].timestamp - points[0].timestamp) / 1000
    if (stats.duration < 0) stats.duration = 0
  }

  // Average speed: prefer computed from distance/duration
  if (stats.duration > 0) {
    stats.avgSpeed = stats.totalDistance / stats.duration
  } else if (speedCount > 0) {
    stats.avgSpeed = totalSpeed / speedCount
  }

  // Handle edge case of single-point tracks
  if (stats.maxAltitude === -Infinity) stats.maxAltitude = 0
  if (stats.minAltitude === Infinity) stats.minAltitude = 0

  return stats
}
