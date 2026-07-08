export interface TrackPoint {
  lat: number
  lng: number
  altitude: number
  timestamp: number
  speed?: number
  heartRate?: number
  cadence?: number
}

export interface Track {
  points: TrackPoint[]
  name?: string
}

export type ColorMode = 'single' | 'altitude' | 'speed' | 'heartRate' | 'cadence' | 'gradient'

export type ViewerState = 'empty' | 'loading' | 'error' | 'loaded'

export type ReferencePlaneMode = 'minAltitude' | 'seaLevel'

export interface ViewerSettings {
  altitudeScale: number
  colorMode: ColorMode
  autoRotate: boolean
  autoRotateSpeed: number
  referencePlaneMode: ReferencePlaneMode
}
