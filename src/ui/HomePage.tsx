import { useCallback, useRef, useState } from 'react'
import { Upload, Mountain, Loader2, CheckCircle, FileWarning, Route } from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'
import { useTerrainStore } from '../store/useTerrainStore'
import { parseGPX } from '../parser/gpxParser'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ------------------------------------------------------------------ */
/*  Shared animation ring icon                                        */
/* ------------------------------------------------------------------ */
function IconRing({
  icon: Icon,
  isDragOver,
  isLoading,
  isDone,
}: {
  icon: React.ElementType
  isDragOver: boolean
  isLoading: boolean
  isDone: boolean
}) {
  return (
    <div
      className={`
        relative flex items-center justify-center w-20 h-20 rounded-full
        transition-all duration-500 ease-out
        ${isDragOver
          ? 'bg-indigo-500/20 scale-110 shadow-[0_0_50px_rgba(99,102,241,0.25)]'
          : isLoading
            ? 'bg-indigo-500/10'
            : isDone
              ? 'bg-emerald-500/10'
              : 'bg-white/5'
        }
      `}
    >
      {/* Dashed border ring */}
      <div
        className={`
          absolute inset-0 rounded-full border-2 border-dashed
          transition-all duration-500
          ${isDragOver
            ? 'border-indigo-400/60 animate-spin-slow'
            : isLoading
              ? 'border-indigo-400/40 animate-spin-slow'
              : isDone
                ? 'border-emerald-400/40'
                : 'border-white/10'
          }
        `}
        style={{ animationDuration: '20s' }}
      />
      {/* Center glow */}
      {isDragOver && (
        <div className="absolute inset-2 rounded-full bg-indigo-500/10 blur-xl" />
      )}
      {/* Icon */}
      {isLoading ? (
        <Loader2 size={28} className="text-indigo-400 animate-spin z-10" />
      ) : isDone ? (
        <CheckCircle size={28} className="text-emerald-400 z-10" />
      ) : (
        <Icon
          size={28}
          className={`transition-all duration-300 z-10 ${
            isDragOver ? 'text-indigo-300 scale-110' : 'text-white/40'
          }`}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared drop-area card                                             */
/* ------------------------------------------------------------------ */
function DropCard({
  icon,
  title,
  accept,
  hint,
  isDragOver,
  isLoading,
  isDone,
  isError,
  errorMessage,
  fileName,
  fileSize,
  onDragEvents,
  onClick,
  onFileChange,
}: {
  icon: React.ElementType
  title: string
  accept: string
  hint: string
  isDragOver: boolean
  isLoading: boolean
  isDone: boolean
  isError: boolean
  errorMessage: string
  fileName: string | null
  fileSize: number | null
  onDragEvents: {
    onDragEnter: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
  }
  onClick: () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!isLoading) fileInputRef.current?.click()
    onClick()
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-5 px-6 w-full max-w-[420px]"
      {...onDragEvents}
    >
      {/* Animated icon ring */}
      <IconRing
        icon={icon}
        isDragOver={isDragOver}
        isLoading={isLoading}
        isDone={isDone}
      />

      {/* Title */}
      <h2 className="text-xl font-light tracking-wide text-white/70">{title}</h2>

      {/* Drop zone card */}
      <div
        className={`
          w-full max-w-[340px] flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed
          transition-all duration-300
          ${isLoading ? 'cursor-default' : 'cursor-pointer'}
          ${isDragOver
            ? 'border-indigo-400/60 bg-indigo-500/10 scale-[1.02]'
            : isError
              ? 'border-red-400/30 bg-red-500/5'
              : isDone
                ? 'border-emerald-400/30 bg-emerald-500/5'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }
        `}
        onClick={handleClick}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={20} className="text-indigo-400 animate-spin" />
            <p className="text-sm text-indigo-300/80">解析中...</p>
            {fileName && <p className="text-xs text-white/30 truncate max-w-[200px]">{fileName}</p>}
          </div>
        ) : isDone && fileName ? (
          <div className="flex flex-col items-center gap-1 py-2">
            <p className="text-sm text-white/60 truncate max-w-[240px]">{fileName}</p>
            {fileSize !== null && <p className="text-xs text-white/30">{formatFileSize(fileSize)}</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <Upload size={20} className="text-white/25" />
            <p className="text-sm text-white/35">拖拽或点击选择文件</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {isError && errorMessage && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 w-full max-w-[340px] animate-in fade-in">
          <FileWarning size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Browse button */}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          px-5 py-2 rounded-full text-sm font-medium border transition-all duration-300
          ${isLoading
            ? 'border-white/5 bg-white/5 text-white/20 cursor-not-allowed'
            : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 hover:border-white/20'
          }
        `}
      >
        {isDone ? '更换文件' : '选择文件'}
      </button>

      {/* Format hint */}
      <p className="text-xs text-white/20 flex items-center gap-1.5">
        <FileWarning size={11} />
        {hint}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  GPX panel — stateful                                              */
/* ------------------------------------------------------------------ */
function GpxPanel() {
  const { setState, setTrack, setError: setStoreError, state: viewerState } = useViewerStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const validateAndLoad = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        setErrorMessage('请选择 .gpx 格式的轨迹文件')
        return
      }
      setIsLoading(true)
      setErrorMessage('')
      setFileName(file.name)
      setState('loading')

      try {
        await new Promise((r) => setTimeout(r, 100))
        const track = await parseGPX(file)
        if (track.points.length === 0) {
          setErrorMessage('文件中没有找到轨迹点数据')
          setIsLoading(false)
          setState('error')
          return
        }
        setTrack(track, file.name.replace(/\.gpx$/i, ''))
        setIsDone(true)
        setIsLoading(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '文件解析失败，请检查文件格式'
        setErrorMessage(msg)
        setStoreError(msg)
        setIsLoading(false)
      }
    },
    [setState, setTrack, setStoreError],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragOver(false) }
  }, [])
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current = 0; setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) validateAndLoad(files[0])
  }, [validateAndLoad])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) validateAndLoad(files[0])
  }, [validateAndLoad])

  return (
    <DropCard
      icon={Route}
      title="导入 GPX 轨迹"
      accept=".gpx"
      hint="仅支持 .gpx 格式"
      isDragOver={isDragOver}
      isLoading={isLoading}
      isDone={viewerState === 'loaded'}
      isError={viewerState === 'error'}
      errorMessage={errorMessage}
      fileName={viewerState === 'loaded' ? fileName : null}
      fileSize={null}
      onDragEvents={{ onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop }}
      onClick={() => {}}
      onFileChange={handleChange}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  DEM panel — stateful                                              */
/* ------------------------------------------------------------------ */
function DemPanel() {
  const terrainState = useTerrainStore((s) => s.state)
  const fileInfo = useTerrainStore((s) => s.fileInfo)
  const errorMessage = useTerrainStore((s) => s.errorMessage)
  const terrainData = useTerrainStore((s) => s.terrainData)
  const setFile = useTerrainStore((s) => s.setFile)
  const setLoading = useTerrainStore((s) => s.setLoading)
  const setError = useTerrainStore((s) => s.setError)

  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase().split('.').pop()
      if (ext !== 'tif' && ext !== 'tiff') {
        setError('请选择 .tif 或 .tiff 格式的 DEM 文件')
        return
      }
      setFile(file)
      setLoading() // auto-load immediately
    },
    [setFile, setLoading, setError],
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragOver(false) }
  }, [])
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current = 0; setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFile(files[0])
  }, [handleFile])

  return (
    <DropCard
      icon={Mountain}
      title="Terrain (DEM)"
      accept=".tif,.tiff"
      hint="支持 .tif / .tiff 格式"
      isDragOver={isDragOver}
      isLoading={terrainState === 'loading'}
      isDone={terrainState === 'loaded'}
      isError={terrainState === 'error'}
      errorMessage={errorMessage}
      fileName={terrainState === 'loaded' && fileInfo ? fileInfo.name : null}
      fileSize={terrainState === 'loaded' && fileInfo ? fileInfo.size : null}
      onDragEvents={{ onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop }}
      onClick={() => {}}
      onFileChange={handleChange}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  HomePage                                                          */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  return (
    <div className="absolute inset-0 flex bg-[#1a1a2e]">
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left: GPX — 50% */}
      <div className="relative flex-1 flex items-center justify-center border-r border-white/[0.06]">
        <GpxPanel />
      </div>

      {/* Right: DEM — 50% */}
      <div className="relative flex-1 flex items-center justify-center">
        <DemPanel />
      </div>
    </div>
  )
}
