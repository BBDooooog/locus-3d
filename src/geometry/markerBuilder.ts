import * as THREE from 'three'
import type { Track } from '../types/track'
import { wgs84ToENU } from '../transform'

export interface Markers {
  start: THREE.Mesh
  end: THREE.Mesh
  dispose: () => void
}

/**
 * Create start (green) and end (red) sphere markers.
 * Sizes are set relative to the trajectory extent.
 */
export function buildMarkers(track: Track, altitudeScale: number = 3): Markers {
  const allPositions = wgs84ToENU(track.points, altitudeScale)

  // Determine marker radius as a fraction of the bounding-box diagonal
  let radius = 5 // default
  if (track.points.length >= 2) {
    let maxDim = 0
    for (let i = 0; i < allPositions.length; i += 3) {
      const x = allPositions[i]
      const y = allPositions[i + 1]
      const z = allPositions[i + 2]
      const mag = Math.sqrt(x * x + y * y + z * z)
      if (mag > maxDim) maxDim = mag
    }
    radius = Math.max(maxDim * 0.015, 1) // 1.5% of max extent, minimum 1 unit
  }

  const sphereGeom = new THREE.SphereGeometry(radius, 16, 16)

  const startMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x166534,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.1,
  })

  const endMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.1,
  })

  const start = new THREE.Mesh(sphereGeom, startMat)
  start.position.set(
    allPositions[0],
    allPositions[1],
    allPositions[2],
  )

  const endGeom = new THREE.SphereGeometry(radius, 16, 16)
  const lastIdx = (track.points.length - 1) * 3
  const end = new THREE.Mesh(endGeom, endMat)
  end.position.set(
    allPositions[lastIdx],
    allPositions[lastIdx + 1],
    allPositions[lastIdx + 2],
  )

  return {
    start,
    end,
    dispose: () => {
      sphereGeom.dispose()
      endGeom.dispose()
      startMat.dispose()
      endMat.dispose()
    },
  }
}
