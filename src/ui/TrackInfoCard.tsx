import { useMemo } from 'react'
import { Route, ArrowUp, Clock, Gauge } from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'
import { computeTrackStats } from '../utils/trackStats'
import { formatDistance, formatElevation, formatDuration, formatSpeed } from '../utils/format'

export default function TrackInfoCard() {
  const track = useViewerStore((s) => s.track)
  const fileName = useViewerStore((s) => s.fileName)

  const stats = useMemo(() => {
    if (!track) return null
    return computeTrackStats(track)
  }, [track])

  if (!stats) return null

  const items = [
    { icon: Route, label: '距离', value: formatDistance(stats.totalDistance) },
    { icon: ArrowUp, label: '累计爬升', value: formatElevation(stats.totalElevationGain) },
    { icon: Clock, label: '时长', value: formatDuration(stats.duration) },
    { icon: Gauge, label: '均速', value: formatSpeed(stats.avgSpeed) },
  ]

  return (
    <div className="fixed top-4 left-4 z-30">
      <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
        {/* File name */}
        {fileName && (
          <h3 className="text-sm font-medium text-white/80 mb-2 truncate max-w-[200px]">
            {fileName}
          </h3>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={12} className="text-white/30 shrink-0" />
              <span className="text-[10px] text-white/30">{label}</span>
              <span className="text-xs text-white/70 ml-auto tabular-nums">{value}</span>
            </div>
          ))}
        </div>

        {/* Point count */}
        <div className="mt-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-white/20">
            {stats.pointCount.toLocaleString()} 个轨迹点
          </span>
        </div>
      </div>
    </div>
  )
}
