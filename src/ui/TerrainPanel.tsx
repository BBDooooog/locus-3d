import { useCallback, useRef, useState } from 'react'
import { Mountain, Upload, FileWarning, Loader2, CheckCircle } from 'lucide-react'
import { useTerrainStore } from '../store/useTerrainStore'

/** Format file size in bytes to human-readable string */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type PanelVariant = 'full' | 'floating'

interface TerrainPanelProps {
  variant: PanelVariant
}

export default function TerrainPanel({ variant }: TerrainPanelProps) {
  const terrainState = useTerrainStore((s) => s.state)
  const fileInfo = useTerrainStore((s) => s.fileInfo)
  const errorMessage = useTerrainStore((s) => s.errorMessage)
  const setFile = useTerrainStore((s) => s.setFile)
  const setLoading = useTerrainStore((s) => s.setLoading)
  const setError = useTerrainStore((s) => s.setError)
  const clearTerrain = useTerrainStore((s) => s.clearTerrain)
  const terrainData = useTerrainStore((s) => s.terrainData)

  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  // Select file and immediately start loading (no separate "Load" button)
  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase().split('.').pop()
      if (ext !== 'tif' && ext !== 'tiff') {
        setError('请选择 .tif 或 .tiff 格式的 DEM 文件')
        return
      }
      setFile(file)
      setLoading()
    },
    [setFile, setLoading, setError],
  )

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

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

  const handleRemove = () => {
    clearTerrain()
  }

  // --- Full Panel (empty state) ---
  if (variant === 'full') {
    return (
      <div
        className="h-full flex items-center justify-center bg-[#1a1a2e]"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="relative z-10 flex flex-col items-center gap-5 max-w-[320px]">
          {/* Card title */}
          <div className="flex items-center gap-2">
            <Mountain size={20} className="text-white/40" />
            <h3 className="text-lg font-light tracking-wide text-white/70">
              Terrain (DEM)
            </h3>
          </div>

          {/* Drop area */}
          <div
            className={`
              w-full flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed
              transition-all duration-300 cursor-pointer
              ${isDragOver
                ? 'border-indigo-400/60 bg-indigo-500/10'
                : terrainState === 'loading'
                  ? 'border-indigo-400/30 bg-indigo-500/5'
                  : terrainState === 'error'
                    ? 'border-red-400/30 bg-red-500/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }
            `}
            onClick={terrainState !== 'loading' ? handleClick : undefined}
          >
            {terrainState === 'loading' ? (
              <>
                <Loader2 size={28} className="text-indigo-400 animate-spin" />
                <p className="text-sm text-indigo-300/80 text-center">
                  正在加载地形...
                </p>
                {fileInfo && (
                  <p className="text-xs text-white/30 truncate max-w-[200px]">
                    {fileInfo.name}
                  </p>
                )}
              </>
            ) : terrainState === 'loaded' && fileInfo ? (
              <>
                <CheckCircle size={28} className="text-emerald-400" />
                <p className="text-sm text-white/60 text-center truncate max-w-[200px]">
                  {fileInfo.name}
                </p>
                <p className="text-xs text-white/30">{formatFileSize(fileInfo.size)}</p>
              </>
            ) : (
              <>
                <Upload
                  size={28}
                  className={`transition-colors ${isDragOver ? 'text-indigo-300' : 'text-white/30'}`}
                />
                <p className="text-sm text-white/40 text-center">
                  选择 GeoTIFF 文件
                </p>
                <p className="text-xs text-white/20">未选择 DEM</p>
              </>
            )}
          </div>

          {/* Error */}
          {terrainState === 'error' && errorMessage && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
              <FileWarning size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={handleClick}
            disabled={terrainState === 'loading'}
            className={`
              px-5 py-2 rounded-full text-sm font-medium border transition-all
              ${terrainState === 'loading'
                ? 'border-white/5 bg-white/5 text-white/20 cursor-not-allowed'
                : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
              }
            `}
          >
            {terrainState === 'loaded' ? '更换文件' : '选择文件'}
          </button>

          {/* Format hint */}
          <p className="text-xs text-white/20 flex items-center gap-1.5">
            <FileWarning size={12} />
            支持 .tif / .tiff
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".tif,.tiff"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    )
  }

  // --- Floating Card (loaded/terrain-only mode) ---
  // Position is handled by parent (stacked in right column)
  return (
    <div>
      <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl max-w-[220px]">
        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2">
          <Mountain size={14} className="text-white/50" />
          <h3 className="text-sm font-medium text-white/70">Terrain (DEM)</h3>
        </div>

        {terrainState === 'loaded' && terrainData && fileInfo ? (
          <>
            {/* File info */}
            <p className="text-xs text-white/50 truncate">{fileInfo.name}</p>
            <p className="text-[10px] text-white/30 mb-2">{formatFileSize(fileInfo.size)}</p>

            {/* Elevation range */}
            <div className="flex items-center justify-between text-[10px] text-white/40 mb-2">
              <span>海拔范围</span>
              <span>
                {Math.round(terrainData.minElevation)} – {Math.round(terrainData.maxElevation)} m
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleClick}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/10 transition-all"
              >
                更换
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-red-300 hover:bg-red-500/10 border border-white/10 transition-all"
              >
                移除
              </button>
            </div>
          </>
        ) : terrainState === 'loading' ? (
          <div className="flex items-center gap-2 text-indigo-400 py-2">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">加载中...</span>
          </div>
        ) : terrainState === 'error' ? (
          <div className="py-1">
            <p className="text-xs text-red-400 mb-2">{errorMessage}</p>
            <button
              onClick={handleClick}
              className="w-full px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/10 transition-all"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="py-1">
            <p className="text-xs text-white/30 mb-2">未加载地形</p>
            <button
              onClick={handleClick}
              className="w-full px-2 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/10 transition-all"
            >
              选择文件
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".tif,.tiff"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
