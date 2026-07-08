import { create } from 'zustand'
import type { Track, ColorMode, ViewerState, ViewerSettings } from '../types/track'

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

  // Actions
  setState: (state: ViewerState) => void
  setError: (message: string) => void
  setTrack: (track: Track, fileName: string) => void
  setAltitudeScale: (scale: number) => void
  setColorMode: (mode: ColorMode) => void
  setAutoRotate: (on: boolean) => void
  setAutoRotateSpeed: (speed: number) => void
  setFlyoverPlaying: (playing: boolean) => void
  setFlyoverSpeed: (speed: number) => void
  reset: () => void
}

const defaultSettings: ViewerSettings = {
  altitudeScale: 3,
  colorMode: 'altitude',
  autoRotate: true,
  autoRotateSpeed: 2,
  showGrid: true,
  showAxis: true,
}

export const useViewerStore = create<ViewerStore>((set) => ({
  state: 'empty',
  errorMessage: '',
  track: null,
  fileName: null,
  settings: { ...defaultSettings },
  isFlyoverPlaying: false,
  flyoverSpeed: 1,

  setState: (state) => set({ state }),
  setError: (message) => set({ state: 'error', errorMessage: message }),
  setTrack: (track, fileName) =>
    set({ track, fileName, state: 'loaded', errorMessage: '' }),
  setAltitudeScale: (scale) =>
    set((s) => ({ settings: { ...s.settings, altitudeScale: scale } })),
  setColorMode: (mode) =>
    set((s) => ({ settings: { ...s.settings, colorMode: mode } })),
  setAutoRotate: (on) =>
    set((s) => ({ settings: { ...s.settings, autoRotate: on } })),
  setAutoRotateSpeed: (speed) =>
    set((s) => ({ settings: { ...s.settings, autoRotateSpeed: speed } })),
  setFlyoverPlaying: (playing) => set({ isFlyoverPlaying: playing }),
  setFlyoverSpeed: (speed) => set({ flyoverSpeed: speed }),
  reset: () =>
    set({
      state: 'empty',
      errorMessage: '',
      track: null,
      fileName: null,
      settings: { ...defaultSettings },
      isFlyoverPlaying: false,
      flyoverSpeed: 1,
    }),
}))
