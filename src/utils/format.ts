/** Format distance in meters to a human-readable string */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(2)} km`
}

/** Format duration in seconds to a human-readable string */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--'

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}h ${m}m ${s}s`
  }
  if (m > 0) {
    return `${m}m ${s}s`
  }
  return `${s}s`
}

/** Format elevation in meters */
export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`
}

/** Format speed in m/s to a human-readable string */
export function formatSpeed(mps: number): string {
  if (mps <= 0) return '--'
  // Convert to min/km (pace) for low speeds, km/h for higher
  const kmh = mps * 3.6
  return `${kmh.toFixed(1)} km/h`
}
