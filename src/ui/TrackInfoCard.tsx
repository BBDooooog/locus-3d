import { useMemo, useRef, useState, useCallback } from 'react'
import { Route, ArrowUp, Clock, Gauge, Upload, Copy, Check } from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'
import { parseGPX } from '../parser/gpxParser'
import { computeTrackStats } from '../utils/trackStats'
import { formatDistance, formatElevation, formatDuration, formatSpeed } from '../utils/format'

/** Compute the lat/lng bounding box from track points */
function computeBounds(points: { lat: number; lng: number }[]) {
  let minLat = Infinity, maxLat = -Infinity
  let minLng = Infinity, maxLng = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  }
  const dy = maxLat - minLat
  const dx = maxLng - minLng
  return { minLat, maxLat, minLng, maxLng, dy, dx }
}

function fmtCoord(v: number): string {
  return v.toFixed(6)
}

export default function TrackInfoCard() {
  const track = useViewerStore((s) => s.track)
  const fileName = useViewerStore((s) => s.fileName)
  const reset = useViewerStore((s) => s.reset)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => {
    if (!track) return null
    return computeTrackStats(track)
  }, [track])

  const bounds = useMemo(() => {
    if (!track || track.points.length === 0) return null
    return computeBounds(track.points)
  }, [track])

  if (!stats) return null

  const items = [
    { icon: Route, label: '距离', value: formatDistance(stats.totalDistance) },
    { icon: ArrowUp, label: '累计爬升', value: formatElevation(stats.totalElevationGain) },
    { icon: Clock, label: '时长', value: formatDuration(stats.duration) },
    { icon: Gauge, label: '均速', value: formatSpeed(stats.avgSpeed) },
  ]

  const handleReplace = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.name.toLowerCase().endsWith('.gpx')) return

    const { setState, setTrack, setError } = useViewerStore.getState()
    setState('loading')
    try {
      await new Promise((r) => setTimeout(r, 100))
      const newTrack = await parseGPX(file)
      if (newTrack.points.length === 0) {
        setError('文件中没有找到轨迹点数据')
        return
      }
      setTrack(newTrack, file.name.replace(/\.gpx$/i, ''))
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败，请检查文件格式')
    }
  }

  const handleCopyBounds = useCallback(() => {
    if (!bounds) return

    // Expanded: 10% outward on each side
    const padX = bounds.dx * 0.1
    const padY = bounds.dy * 0.1
    const west = bounds.minLng - padX
    const east = bounds.maxLng + padX
    const south = bounds.minLat - padY
    const north = bounds.maxLat + padY

    const text = `${fmtCoord(west)},${fmtCoord(south)},${fmtCoord(east)},${fmtCoord(north)}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {
      // Fallback for non-HTTPS
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [bounds])

  return (
    <>
      <div className="fixed top-4 left-4 z-30">
        <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl max-w-[240px]">
          {/* Icon + Title */}
          <div className="flex items-center gap-1.5 mb-2">
            <Route size={14} className="text-white/50" />
            <h3 className="text-sm font-medium text-white/70">GPX 轨迹</h3>
          </div>

          {/* File name */}
          {fileName && (
            <p className="text-xs text-white/50 truncate mb-2">{fileName}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
            {items.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-1">
                <Icon size={11} className="text-white/30 shrink-0" />
                <span className="text-[10px] text-white/30">{label}</span>
                <span className="text-[10px] text-white/60 ml-auto tabular-nums">{value}</span>
              </div>
            ))}
          </div>

          {/* Point count */}
          <p className="text-[10px] text-white/25 mb-2">
            {stats.pointCount.toLocaleString()} 个轨迹点
          </p>

          {/* Bounding box */}
          {bounds && (
            <div className="mb-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30">经纬范围</span>
                <button
                  onClick={handleCopyBounds}
                  className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  title="复制外扩10%范围"
                >
                  {copied ? (
                    <Check size={11} className="text-emerald-400" />
                  ) : (
                    <Copy size={11} />
                  )}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="text-[10px] text-white/40 leading-relaxed space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-white/25">经度</span>
                  <span>{fmtCoord(bounds.minLng)} ~ {fmtCoord(bounds.maxLng)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/25">纬度</span>
                  <span>{fmtCoord(bounds.minLat)} ~ {fmtCoord(bounds.maxLat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/25">跨度</span>
                  <span>{fmtCoord(bounds.dx)}° × {fmtCoord(bounds.dy)}°</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleReplace}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/10 transition-all flex items-center justify-center gap-1"
            >
              <Upload size={11} />
              更换
            </button>
            <button
              onClick={reset}
              className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-all"
            >
              移除
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  )
}
