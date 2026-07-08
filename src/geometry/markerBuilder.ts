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
export function buildMarkers(track: Track, altitudeScale: number = 3, trajectoryScale: number = 1): Markers {
  const allPositions = wgs84ToENU(track.points, altitudeScale, trajectoryScale)

  // Determine marker radius based on actual bounding box size
  let radius = 1 // default
  if (track.points.length >= 2) {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < allPositions.length; i += 3) {
      const x = allPositions[i]
      const y = allPositions[i + 1]
      const z = allPositions[i + 2]
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
    }
    const diag = Math.sqrt(
      (maxX - minX) ** 2 + (maxY - minY) ** 2 + (maxZ - minZ) ** 2,
    )
    radius = Math.max(diag * 0.005, 0.5) // 0.5% of bounding-box diagonal
  }

  const sphereGeom = new THREE.SphereGeometry(radius, 12, 12)

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

  const endGeom = new THREE.SphereGeometry(radius, 12, 12)
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
