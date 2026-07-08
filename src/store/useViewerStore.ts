import { create } from 'zustand'
import type { Track, ColorMode, ViewerState, ViewerSettings, ReferencePlaneMode, LayerVisibility } from '../types/track'

interface ViewerStore {
  // App state
  state: ViewerState
  errorMessage: string

  // Track data
  track: Track | null
  fileName: string | null

  // Settings
  settings: ViewerSettings

  // Flyover
  isFlyoverPlaying: boolean
  flyoverSpeed: number

  // UI visibility
  toolbarVisible: boolean

  // Actions
  setState: (state: ViewerState) => void
  setError: (message: string) => void
  setTrack: (track: Track, fileName: string) => void
  setAltitudeScale: (scale: number) => void
  setTrajectoryScale: (scale: number) => void
  setColorMode: (mode: ColorMode) => void
  setAutoRotate: (on: boolean) => void
  setAutoRotateSpeed: (speed: number) => void
  setFlyoverPlaying: (playing: boolean) => void
  setFlyoverSpeed: (speed: number) => void
  setReferencePlaneMode: (mode: ReferencePlaneMode) => void
  toggleLayer: (layer: keyof LayerVisibility) => void
  showToolbar: () => void
  hideToolbar: () => void
  reset: () => void
}

const defaultLayerVisibility: LayerVisibility = {
  referencePlane: false,
  projectionLines: true,
  groundProjection: true,
  compass: true,
  markers: true,
}

const defaultSettings: ViewerSettings = {
  altitudeScale: 10,
  trajectoryScale: 0.2,
  colorMode: 'altitude',
  autoRotate: true,
  autoRotateSpeed: 2,
  referencePlaneMode: 'minAltitude',
  layers: { ...defaultLayerVisibility },
}

export const useViewerStore = create<ViewerStore>((set) => ({
  state: 'empty',
  errorMessage: '',
  track: null,
  fileName: null,
  settings: { ...defaultSettings },
  isFlyoverPlaying: false,
  flyoverSpeed: 1,
  toolbarVisible: false,

  setState: (state) => set({ state }),
  setError: (message) => set({ state: 'error', errorMessage: message }),
  setTrack: (track, fileName) =>
    set({ track, fileName, state: 'loaded', errorMessage: '' }),
  setAltitudeScale: (scale) =>
    set((s) => ({ settings: { ...s.settings, altitudeScale: scale } })),
  setTrajectoryScale: (scale) =>
    set((s) => ({ settings: { ...s.settings, trajectoryScale: scale } })),
  setColorMode: (mode) =>
    set((s) => ({ settings: { ...s.settings, colorMode: mode } })),
  setAutoRotate: (on) =>
    set((s) => ({ settings: { ...s.settings, autoRotate: on } })),
  setAutoRotateSpeed: (speed) =>
    set((s) => ({ settings: { ...s.settings, autoRotateSpeed: speed } })),
  setFlyoverPlaying: (playing) => set({ isFlyoverPlaying: playing }),
  setFlyoverSpeed: (speed) => set({ flyoverSpeed: speed }),
  setReferencePlaneMode: (mode) =>
    set((s) => ({ settings: { ...s.settings, referencePlaneMode: mode } })),
  toggleLayer: (layer) =>
    set((s) => ({
      settings: {
        ...s.settings,
        layers: {
          ...s.settings.layers,
          [layer]: !s.settings.layers[layer],
        },
      },
    })),
  showToolbar: () => set({ toolbarVisible: true }),
  hideToolbar: () => set({ toolbarVisible: false }),
  reset: () =>
    set({
      state: 'empty',
      errorMessage: '',
      track: null,
      fileName: null,
      settings: { ...defaultSettings },
      isFlyoverPlaying: false,
      flyoverSpeed: 1,
      toolbarVisible: false,
    }),
}))
