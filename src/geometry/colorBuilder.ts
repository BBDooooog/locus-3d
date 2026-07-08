import type { Track, ColorMode } from '../types/track'
import { buildColorBuffer } from '../utils/colorScale'

/**
 * Build a Float32Array of RGB vertex colors based on the selected ColorMode.
 * Returns an array suitable for use as a BufferGeometry color attribute.
 */
export function buildColors(track: Track, mode: ColorMode): Float32Array {
  const { points } = track
  if (points.length === 0) return new Float32Array(0)

  switch (mode) {
    case 'single':
      return buildSingleColor(points.length, [0.39, 0.58, 0.93]) // Dodger blue

    case 'altitude':
      return buildColorBuffer(points.map((p) => p.altitude))

    case 'speed':
      return buildColorBuffer(
        points.map((p) => p.speed ?? 0),
      )

    case 'heartRate':
      return buildColorBuffer(
        points.map((p) => p.heartRate ?? 0),
      )

    case 'cadence':
      return buildColorBuffer(
        points.map((p) => p.cadence ?? 0),
      )

    case 'gradient': {
      // Compute gradient (elevation change per meter) between consecutive points
      const gradients: number[] = [0]
      for (let i = 1; i < points.length; i++) {
        const dAlt = points[i].altitude - points[i - 1].altitude
        const dLat = points[i].lat - points[i - 1].lat
        const dLng = points[i].lng - points[i - 1].lng
        const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111320 // approx meters per degree
        gradients.push(dist > 0 ? dAlt / dist : 0)
      }
      return buildColorBuffer(gradients)
    }

    default:
      return buildColorBuffer(points.map((p) => p.altitude))
  }
}

function buildSingleColor(count: number, rgb: [number, number, number]): Float32Array {
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const idx = i * 3
    colors[idx] = rgb[0]
    colors[idx + 1] = rgb[1]
    colors[idx + 2] = rgb[2]
  }
  return colors
}
