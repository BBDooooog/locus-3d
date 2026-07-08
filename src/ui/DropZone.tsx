import { useCallback, useRef, useState } from 'react'
import { Upload, FileWarning } from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'
import { parseGPX } from '../parser/gpxParser'

export default function DropZone() {
  const { setState, setTrack, setError } = useViewerStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        setError('请拖入 .gpx 格式的轨迹文件')
        return
      }

      setIsParsing(true)
      setState('loading')

      try {
        // Small delay so the loading state renders before parsing
        await new Promise((r) => setTimeout(r, 100))
        const track = await parseGPX(file)
        if (track.points.length === 0) {
          setError('文件中没有找到轨迹点数据')
          return
        }
        setTrack(track, file.name.replace(/\.gpx$/i, ''))
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件解析失败，请检查文件格式')
      } finally {
        setIsParsing(false)
      }
    },
    [setState, setTrack, setError],
  )

  // Use drag counter to handle nested drag events reliably
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (!isParsing) setIsDragOver(true)
  }, [isParsing])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile],
  )

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Icon ring */}
        <div
          className={`
            relative flex items-center justify-center w-28 h-28 rounded-full
            transition-all duration-500 ease-out
            ${isDragOver
              ? 'bg-indigo-500/20 scale-110 shadow-[0_0_60px_rgba(99,102,241,0.3)]'
              : 'bg-white/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
            }
          `}
        >
          <div
            className={`
              absolute inset-0 rounded-full border-2 border-dashed
              transition-all duration-500
              ${isDragOver ? 'border-indigo-400/60 animate-spin-slow' : 'border-white/10'}
            `}
            style={{ animationDuration: '20s' }}
          />
          <Upload
            size={36}
            className={`
              transition-all duration-300
              ${isDragOver ? 'text-indigo-300 scale-110' : 'text-white/50'}
            `}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-light tracking-wide text-white/80">
            拖入 GPX 轨迹文件
          </h2>
          <p className="text-sm text-white/30">
            或点击此处选择文件
          </p>
        </div>

        {/* Click button */}
        <button
          onClick={handleClick}
          className={`
            px-6 py-2.5 rounded-full text-sm font-medium
            border transition-all duration-300
            ${isDragOver
              ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-200'
              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 hover:border-white/20'
            }
          `}
        >
          选择文件
        </button>

        {/* Format hint */}
        <p className="text-xs text-white/20 flex items-center gap-1.5">
          <FileWarning size={12} />
          仅支持 .gpx 格式
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
