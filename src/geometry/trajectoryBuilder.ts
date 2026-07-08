import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import type { Track, ColorMode } from '../types/track'
import { wgs84ToENU } from '../transform'
import { buildColors } from './colorBuilder'

export interface TrajectoryLine {
  line: Line2
  dispose: () => void
}

/**
 * Build a Line2 trajectory from a Track.
 * Returns the Line2 object ready to be added to a scene.
 */
export function buildTrajectory(
  track: Track,
  colorMode: ColorMode,
  altitudeScale: number,
  lineWidth: number = 2,
): TrajectoryLine {
  const positions = wgs84ToENU(track.points, altitudeScale)
  const colors = buildColors(track, colorMode)

  const geometry = new LineGeometry()
  geometry.setPositions(positions)
  geometry.setColors(colors)

  const material = new LineMaterial({
    color: 0xffffff,
    linewidth: lineWidth,
    worldUnits: false, // pixel-width lines
    vertexColors: true,
    dashed: false,
    alphaToCoverage: true,
    transparent: true,
    depthWrite: true,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  })

  const line = new Line2(geometry, material)
  line.computeLineDistances()

  return {
    line,
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}

/**
 * Update trajectory Y positions for altitude scale changes.
 * Modifies the existing geometry in-place for performance.
 */
export function updateAltitudeScale(
  track: Track,
  line: Line2,
  altitudeScale: number,
): void {
  const positions = wgs84ToENU(track.points, altitudeScale)
  const geometry = line.geometry as LineGeometry
  geometry.setPositions(positions)
}

/**
 * Update trajectory colors for color mode changes.
 */
export function updateColors(
  track: Track,
  line: Line2,
  colorMode: ColorMode,
): void {
  const colors = buildColors(track, colorMode)
  const geometry = line.geometry as LineGeometry
  geometry.setColors(colors)
}

/**
 * Update material resolution (must be called on window resize).
 */
export function updateLineResolution(line: Line2, width: number, height: number): void {
  const material = line.material as LineMaterial
  material.resolution.set(width, height)
}
