import { AlertTriangle, X } from 'lucide-react'
import { useViewerStore } from '../store/useViewerStore'

export default function ErrorToast() {
  const errorMessage = useViewerStore((s) => s.errorMessage)
  const reset = useViewerStore((s) => s.reset)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] z-50">
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium text-white/80">解析失败</h3>
          <p className="text-sm text-white/40">{errorMessage}</p>
        </div>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-full text-sm font-medium bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
        >
          重新选择
        </button>
      </div>
    </div>
  )
}
