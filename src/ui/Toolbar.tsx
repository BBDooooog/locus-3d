import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Mountain,
  Palette,
  RotateCw,
  Play,
  Pause,
  Camera,
  Maximize2,
  Layers,
  Eye,
  ZoomIn,
} from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'
import type { ColorMode, ReferencePlaneMode, LayerVisibility } from '../types/track'

const ALTITUDE_PRESETS = [1, 2, 3, 5, 10]
const SCALE_PRESETS = [0.2, 0.35, 0.5, 0.7, 1.0]
const HIDE_DELAY = 3000

const COLOR_MODE_LABELS: { mode: ColorMode; label: string }[] = [
  { mode: 'altitude', label: '海拔' },
  { mode: 'speed', label: '速度' },
  { mode: 'heartRate', label: '心率' },
  { mode: 'cadence', label: '步频' },
  { mode: 'gradient', label: '坡度' },
]

const LAYER_ITEMS: { key: keyof LayerVisibility; label: string }[] = [
  { key: 'referencePlane', label: '参考平面' },
  { key: 'projectionLines', label: '投影线' },
  { key: 'groundProjection', label: '地面投影' },
  { key: 'compass', label: '方向标' },
  { key: 'markers', label: '起终点' },
]

export default function Toolbar() {
  const settings = useViewerStore((s) => s.settings)
  const isFlyoverPlaying = useViewerStore((s) => s.isFlyoverPlaying)
  const toolbarVisible = useViewerStore((s) => s.toolbarVisible)
  const setAltitudeScale = useViewerStore((s) => s.setAltitudeScale)
  const setTrajectoryScale = useViewerStore((s) => s.setTrajectoryScale)
  const setColorMode = useViewerStore((s) => s.setColorMode)
  const setAutoRotate = useViewerStore((s) => s.setAutoRotate)
  const setFlyoverPlaying = useViewerStore((s) => s.setFlyoverPlaying)
  const setReferencePlaneMode = useViewerStore((s) => s.setReferencePlaneMode)
  const toggleLayer = useViewerStore((s) => s.toggleLayer)
  const showToolbar = useViewerStore((s) => s.showToolbar)
  const hideToolbar = useViewerStore((s) => s.hideToolbar)

  const [showColorMenu, setShowColorMenuInner] = useState(false)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  // Initial reveal on track load, then auto-hide after HIDE_DELAY
  const hasShownInitially = useRef(false)
  useEffect(() => {
    if (!hasShownInitially.current) {
      hasShownInitially.current = true
      showToolbar()
      const t = setTimeout(() => hideToolbar(), HIDE_DELAY)
      return () => clearTimeout(t)
    }
  }, [showToolbar, hideToolbar])

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => hideToolbar(), HIDE_DELAY)
  }, [hideToolbar])

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current)
    showToolbar()
  }, [showToolbar])

  useEffect(() => {
    return () => clearTimeout(hideTimer.current)
  }, [])

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `locus-${Date.now()}.png`
    link.href = dataUrl
    link.click()
    scheduleHide()
  }

  const handleResetCamera = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
    scheduleHide()
  }

  const currentColorLabel =
    COLOR_MODE_LABELS.find((c) => c.mode === settings.colorMode)?.label || '海拔'

  return (
    <>
      {/* Hover trigger zone */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 h-12"
        onMouseEnter={cancelHide}
      />

      {/* Toolbar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-400 ${
          toolbarVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        onClick={() => {
          clearTimeout(hideTimer.current)
          hideTimer.current = setTimeout(() => hideToolbar(), HIDE_DELAY)
        }}
      >
        <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30">
          {/* Altitude Scale */}
          <div className="flex items-center gap-1 px-1">
            <Mountain size={14} className="text-white/40" />
            {ALTITUDE_PRESETS.map((scale) => (
              <button
                key={scale}
                onClick={() => setAltitudeScale(scale)}
                className={`px-2 py-1 text-xs rounded-lg transition-all duration-200 ${
                  settings.altitudeScale === scale
                    ? 'bg-indigo-500/30 text-indigo-200'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Trajectory Scale (zoom) */}
          <div className="flex items-center gap-1 px-1">
            <ZoomIn size={14} className="text-white/40" />
            {SCALE_PRESETS.map((scale) => (
              <button
                key={scale}
                onClick={() => setTrajectoryScale(scale)}
                className={`px-2 py-1 text-xs rounded-lg transition-all duration-200 ${
                  settings.trajectoryScale === scale
                    ? 'bg-indigo-500/30 text-indigo-200'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Color Mode */}
          <div className="relative">
            <button
              onClick={() => setShowColorMenuInner(!showColorMenu)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/60 hover:text-white/90 rounded-lg hover:bg-white/5 transition-all"
            >
              <Palette size={14} />
              <span>{currentColorLabel}</span>
            </button>
            {showColorMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowColorMenuInner(false)} />
                <div className="absolute bottom-full mb-2 left-0 z-20 bg-[#1e1e3a] border border-white/10 rounded-xl py-1 shadow-xl min-w-[100px]">
                  {COLOR_MODE_LABELS.map(({ mode, label }) => (
                    <button
                      key={mode}
                      onClick={() => { setColorMode(mode); setShowColorMenuInner(false) }}
                      className={`block w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        settings.colorMode === mode
                          ? 'text-indigo-300 bg-indigo-500/10'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Auto Rotate */}
          <button
            onClick={() => setAutoRotate(!settings.autoRotate)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-all ${
              settings.autoRotate
                ? 'bg-indigo-500/20 text-indigo-200'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <RotateCw
              size={14}
              className={settings.autoRotate ? 'animate-spin' : ''}
              style={{ animationDuration: '4s' }}
            />
            <span>旋转</span>
          </button>

          <div className="w-px h-5 bg-white/10" />

          {/* Flyover */}
          <button
            onClick={() => setFlyoverPlaying(!isFlyoverPlaying)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-all ${
              isFlyoverPlaying
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {isFlyoverPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>飞行</span>
          </button>

          <div className="w-px h-5 bg-white/10" />

          {/* Reference Plane */}
          <button
            onClick={() =>
              setReferencePlaneMode(
                settings.referencePlaneMode === 'minAltitude' ? 'seaLevel' : 'minAltitude',
              )
            }
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-all ${
              settings.referencePlaneMode === 'seaLevel'
                ? 'bg-indigo-500/20 text-indigo-200'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Layers size={14} />
            <span>{settings.referencePlaneMode === 'minAltitude' ? '最低点' : '海平面'}</span>
          </button>

          <div className="w-px h-5 bg-white/10" />

          {/* Layer visibility */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg transition-all ${
                showLayerMenu
                  ? 'bg-white/10 text-white/80'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Eye size={14} />
              <span>图层</span>
            </button>
            {showLayerMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLayerMenu(false)} />
                <div className="absolute bottom-full mb-2 right-0 z-20 bg-[#1e1e3a] border border-white/10 rounded-xl py-1.5 px-2 shadow-xl min-w-[130px]">
                  {LAYER_ITEMS.map(({ key, label }) => {
                    const checked = settings.layers[key]
                    const disabled = key === 'referencePlane' // trajectory always visible conceptually, but we still let user toggle others
                    return (
                      <button
                        key={key}
                        onClick={() => toggleLayer(key)}
                        className="flex items-center gap-2 w-full px-2 py-1 text-xs transition-colors hover:bg-white/5 rounded"
                      >
                        <span
                          className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                            checked
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-white/20'
                          }`}
                        >
                          {checked && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <span className={checked ? 'text-white/80' : 'text-white/30'}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
          >
            <Maximize2 size={14} />
            <span>重置</span>
          </button>

          {/* Screenshot */}
          <button
            onClick={handleScreenshot}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
          >
            <Camera size={14} />
            <span>截图</span>
          </button>
        </div>
      </div>
    </>
  )
}
