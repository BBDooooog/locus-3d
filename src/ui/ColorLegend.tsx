import { useMemo } from 'react'
import { useViewerStore } from '../store/useViewerStore'
import { valueRange } from '../utils/colorScale'

const MODE_LABELS: Record<string, string> = {
  altitude: '海拔 (m)',
  speed: '速度 (m/s)',
  heartRate: '心率 (bpm)',
  cadence: '步频 (spm)',
  gradient: '坡度',
}

const MODE_UNITS: Record<string, (v: number) => string> = {
  altitude: (v) => `${Math.round(v)}`,
  speed: (v) => v.toFixed(1),
  heartRate: (v) => `${Math.round(v)}`,
  cadence: (v) => `${Math.round(v)}`,
  gradient: (v) => `${(v * 100).toFixed(0)}%`,
}

export default function ColorLegend() {
  const track = useViewerStore((s) => s.track)
  const colorMode = useViewerStore((s) => s.settings.colorMode)

  const range = useMemo(() => {
    if (!track || colorMode === 'single') return null

    let values: number[]
    switch (colorMode) {
      case 'altitude':
        values = track.points.map((p) => p.altitude)
        break
      case 'speed':
        values = track.points.map((p) => p.speed ?? 0)
        break
      case 'heartRate':
        values = track.points.map((p) => p.heartRate ?? 0)
        break
      case 'cadence':
        values = track.points.map((p) => p.cadence ?? 0)
        break
      case 'gradient':
        values = [0]
        for (let i = 1; i < track.points.length; i++) {
          const dAlt = track.points[i].altitude - track.points[i - 1].altitude
          const dLat = track.points[i].lat - track.points[i - 1].lat
          const dLng = track.points[i].lng - track.points[i - 1].lng
          const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111320
          values.push(dist > 0 ? dAlt / dist : 0)
        }
        break
      default:
        return null
    }
    return valueRange(values)
  }, [track, colorMode])

  if (!range || range.min === range.max) return null

  const label = MODE_LABELS[colorMode] || colorMode
  const fmt = MODE_UNITS[colorMode] || ((v: number) => `${v}`)
  const isGradient = colorMode === 'gradient'

  return (
    <div>
      <div className="px-3 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
        <span className="text-[10px] text-white/40 block mb-1.5">{label}</span>
        {/* Minimal gradient bar */}
        <div
          className="w-24 h-2 rounded-sm"
          style={{
            background: 'linear-gradient(to right, #30123b, #28bbec, #a2fc3c, #fb8022, #7a0403)',
          }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-white/25 tabular-nums">
            {fmt(isGradient ? range.min ?? 0 : range.min)}
          </span>
          <span className="text-[9px] text-white/25 tabular-nums">
            {fmt(isGradient ? range.max ?? 0 : range.max)}
          </span>
        </div>
      </div>
    </div>
  )
}
