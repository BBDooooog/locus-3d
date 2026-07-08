import { useState, useEffect, useRef } from 'react'
import {
  Mountain,
  Palette,
  RotateCw,
  Play,
  Pause,
  Camera,
  Maximize2,
} from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'
import type { ColorMode } from '../types/track'

const ALTITUDE_PRESETS = [1, 2, 3, 5, 10]

const COLOR_MODE_LABELS: { mode: ColorMode; label: string }[] = [
  { mode: 'altitude', label: '海拔' },
  { mode: 'speed', label: '速度' },
  { mode: 'heartRate', label: '心率' },
  { mode: 'cadence', label: '步频' },
  { mode: 'gradient', label: '坡度' },
]

export default function Toolbar() {
  const settings = useViewerStore((s) => s.settings)
  const isFlyoverPlaying = useViewerStore((s) => s.isFlyoverPlaying)
  const setAltitudeScale = useViewerStore((s) => s.setAltitudeScale)
  const setColorMode = useViewerStore((s) => s.setColorMode)
  const setAutoRotate = useViewerStore((s) => s.setAutoRotate)
  const setFlyoverPlaying = useViewerStore((s) => s.setFlyoverPlaying)

  const [visible, setVisible] = useState(true)
  const [showColorMenu, setShowColorMenu] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  // Auto-hide after 3s of inactivity
  const resetHideTimer = () => {
    setVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setVisible(false), 3000)
  }

  useEffect(() => {
    resetHideTimer()
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
  }

  const handleResetCamera = () => {
    // Dispatch 'r' key to trigger camera reset in SceneCanvas
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))
  }

  const currentColorLabel =
    COLOR_MODE_LABELS.find((c) => c.mode === settings.colorMode)?.label || '海拔'

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      onMouseMove={resetHideTimer}
      onMouseEnter={() => {
        setVisible(true)
        clearTimeout(hideTimer.current)
      }}
      onMouseLeave={resetHideTimer}
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

        {/* Color Mode */}
        <div className="relative">
          <button
            onClick={() => setShowColorMenu(!showColorMenu)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/60 hover:text-white/90 rounded-lg hover:bg-white/5 transition-all"
          >
            <Palette size={14} />
            <span>{currentColorLabel}</span>
          </button>
          {showColorMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowColorMenu(false)}
              />
              <div className="absolute bottom-full mb-2 left-0 z-20 bg-[#1e1e3a] border border-white/10 rounded-xl py-1 shadow-xl min-w-[100px]">
                {COLOR_MODE_LABELS.map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setColorMode(mode)
                      setShowColorMenu(false)
                    }}
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
  )
}
