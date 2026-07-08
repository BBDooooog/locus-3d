import { useCallback, useRef, useState } from 'react'
import { useViewerStore } from './store/useViewerStore'
import { parseGPX } from './parser/gpxParser'
import DropZone from './ui/DropZone'
import LoadingOverlay from './ui/LoadingOverlay'
import ErrorToast from './ui/ErrorToast'
import SceneCanvas from './viewer/SceneCanvas'
import Toolbar from './ui/Toolbar'
import TrackInfoCard from './ui/TrackInfoCard'
import ColorLegend from './ui/ColorLegend'
import KeyboardHint from './ui/KeyboardHint'

export default function App() {
  const state = useViewerStore((s) => s.state)
  const setState = useViewerStore((s) => s.setState)
  const setTrack = useViewerStore((s) => s.setTrack)
  const setError = useViewerStore((s) => s.setError)
  const [dragOver, setDragOver] = useState(false)

  const handleFileDrop = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        setError('请拖入 .gpx 格式的轨迹文件')
        return
      }
      setState('loading')
      try {
        await new Promise((r) => setTimeout(r, 100))
        const track = await parseGPX(file)
        if (track.points.length === 0) {
          setError('文件中没有找到轨迹点数据')
          return
        }
        setTrack(track, file.name.replace(/\.gpx$/i, ''))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '文件解析失败，请检查文件格式',
        )
      }
    },
    [setState, setTrack, setError],
  )

  // Global drag-and-drop handlers (for loaded state — empty state has its own DropZone)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Only show overlay in loaded state
      if (state === 'loaded') {
        setDragOver(true)
      }
    },
    [state],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0 && state === 'loaded') {
        handleFileDrop(files[0])
      }
    },
    [state, handleFileDrop],
  )

  return (
    <div
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Empty State */}
      {state === 'empty' && <DropZone />}

      {/* Loading State */}
      {state === 'loading' && <LoadingOverlay />}

      {/* Error State */}
      {state === 'error' && <ErrorToast />}

      {/* Loaded State — 3D viewer + overlays */}
      {state === 'loaded' && (
        <>
          <SceneCanvas />
          <TrackInfoCard />
          <ColorLegend />
          <Toolbar />
          <KeyboardHint />

          {/* Drop overlay for swapping files */}
          {dragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm transition-all">
              <div className="px-8 py-6 rounded-2xl bg-white/10 border-2 border-dashed border-indigo-300/40 shadow-2xl">
                <p className="text-white/80 text-lg font-light">
                  释放以加载新轨迹
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
