import type { Track, TrackPoint } from '../types/track'

/**
 * Parse a GPX file and return a standardized Track object.
 * Uses the browser's built-in DOMParser for XML parsing.
 */
export async function parseGPX(file: File): Promise<Track> {
  const text = await file.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'application/xml')

  // Check for XML parse errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('文件不是有效的 XML 格式')
  }

  // Support both GPX 1.0 and 1.1 namespaces
  const ns = doc.documentElement.namespaceURI || ''
  const isGPX =
    doc.documentElement.tagName.toLowerCase().includes('gpx') ||
    ns.includes('gpx')

  if (!isGPX) {
    throw new Error('文件不是有效的 GPX 格式')
  }

  const trackPoints: TrackPoint[] = []

  // Extract track points from <trkpt> elements
  const trkpts = doc.querySelectorAll('trkpt')
  for (const trkpt of trkpts) {
    const lat = parseFloat(trkpt.getAttribute('lat') || '')
    const lon = parseFloat(trkpt.getAttribute('lon') || '')

    // Skip points with invalid coordinates
    if (isNaN(lat) || isNaN(lon)) continue

    const ele = trkpt.querySelector('ele')
    const time = trkpt.querySelector('time')
    const speed = trkpt.querySelector('speed')
    const hr = trkpt.querySelector('gpxtpx\\:hr, hr')
    const cad = trkpt.querySelector('gpxtpx\\:cad, cad')

    const point: TrackPoint = {
      lat,
      lng: lon,
      altitude: ele ? parseFloat(ele.textContent || '0') : 0,
      timestamp: time ? new Date(time.textContent || '').getTime() : 0,
    }

    if (speed) point.speed = parseFloat(speed.textContent || '0')
    if (hr) point.heartRate = parseFloat(hr.textContent || '0')
    if (cad) point.cadence = parseFloat(cad.textContent || '0')

    trackPoints.push(point)
  }

  return {
    points: trackPoints,
    name: file.name.replace(/\.gpx$/i, ''),
  }
}
