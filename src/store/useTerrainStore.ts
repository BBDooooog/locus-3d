import { create } from 'zustand'
import type { TerrainData, TerrainSettings, TerrainFileInfo, TerrainState } from '../terrain/TerrainTypes'

interface TerrainStore {
  // State
  state: TerrainState
  terrainData: TerrainData | null
  file: File | null
  fileInfo: TerrainFileInfo | null
  settings: TerrainSettings
  errorMessage: string

  // Actions
  setFile: (file: File) => void
  setLoading: () => void
  setLoaded: (data: TerrainData, fileInfo: TerrainFileInfo) => void
  setError: (message: string) => void
  updateSettings: (partial: Partial<TerrainSettings>) => void
  clearTerrain: () => void
}

const defaultSettings: TerrainSettings = {
  scaleXY: 1,
  scaleHeight: 0.2,
}

export const useTerrainStore = create<TerrainStore>((set) => ({
  state: 'idle',
  terrainData: null,
  file: null,
  fileInfo: null,
  settings: { ...defaultSettings },
  errorMessage: '',

  setFile: (file) =>
    set({
      state: 'selected',
      file,
      fileInfo: { name: file.name, size: file.size },
      errorMessage: '',
    }),

  setLoading: () => set({ state: 'loading', errorMessage: '' }),

  setLoaded: (data, fileInfo) =>
    set({
      state: 'loaded',
      terrainData: data,
      fileInfo,
      errorMessage: '',
    }),

  setError: (message) => set({ state: 'error', errorMessage: message }),

  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  clearTerrain: () =>
    set({
      state: 'idle',
      terrainData: null,
      file: null,
      fileInfo: null,
      errorMessage: '',
    }),
}))
