import { Loader2 } from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'

export default function LoadingOverlay() {
  const fileName = useViewerStore((s) => s.fileName)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="text-indigo-400 animate-spin" />
        <p className="text-white/60 text-sm">正在解析轨迹...</p>
        {fileName && (
          <p className="text-white/30 text-xs">{fileName}</p>
        )}
      </div>
    </div>
  )
}
