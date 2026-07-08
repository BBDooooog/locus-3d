import * as THREE from 'three'
import { buildTerrainMesh } from './TerrainMeshBuilder'
import type { TerrainData, TerrainSettings } from './TerrainTypes'

/**
 * Manages the terrain Group in the Three.js scene.
 *
 * All terrain objects live under `terrainGroup`.
 * Removing terrain only clears this group — track objects are untouched.
 *
 * Scene structure:
 *   Scene
 *   ├── (existing track objects: Line2, markers, layers)
 *   └── terrainGroup  ← managed by this class
 */
export class TerrainManager {
  private group: THREE.Group
  private mesh: THREE.Mesh | null = null
  private _scene: THREE.Scene | null = null

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'terrain-group'
  }

  /** Attach the terrain group to a scene (call once). */
  attachToScene(scene: THREE.Scene): void {
    if (this._scene) return
    this._scene = scene
    scene.add(this.group)
  }

  /**
   * Load new terrain data: build mesh, clear old terrain, add to group.
   */
  load(data: TerrainData, settings: TerrainSettings): void {
    this.clear()

    const mesh = buildTerrainMesh(data, settings)
    this.group.add(mesh)
    this.mesh = mesh
  }

  /**
   * Rebuild the terrain mesh with new settings (for dynamic updates).
   */
  updateSettings(data: TerrainData, settings: TerrainSettings): void {
    if (!this.mesh) return
    this.load(data, settings)
  }

  /** Get the terrain bounding box (for camera fitting). */
  getBoundingBox(): THREE.Box3 | null {
    if (!this.mesh) return null
    return new THREE.Box3().setFromObject(this.group)
  }

  /** Get the terrain group (for scene queries). */
  getGroup(): THREE.Group {
    return this.group
  }

  /** Remove terrain mesh from the group (keeps group in scene). */
  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0]
      this.group.remove(child)
      this.disposeObject(child)
    }
    this.mesh = null
  }

  /** Fully dispose terrain and remove group from scene. */
  dispose(): void {
    this.clear()
    if (this._scene) {
      this._scene.remove(this.group)
      this._scene = null
    }
  }

  private disposeObject(obj: THREE.Object3D): void {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose()
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose())
      } else {
        obj.material?.dispose()
      }
    }
    // Traverse children if any
    obj.traverse((child) => {
      if (child === obj) return
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material?.dispose()
        }
      }
    })
  }
}
