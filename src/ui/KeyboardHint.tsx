import { useState, useEffect } from 'react'
import { Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { key: 'Space', action: '切换自动旋转' },
  { key: 'R', action: '重置视角' },
  { key: 'F', action: '飞行模式' },
  { key: '1-5', action: '切换颜色模式' },
  { key: '↑ ↓', action: '调整海拔倍率' },
]

export default function KeyboardHint() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 transition-all duration-700">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
        <Keyboard size={12} className="text-white/30" />
        {SHORTCUTS.map(({ key, action }) => (
          <span key={key} className="text-[10px] text-white/40 whitespace-nowrap">
            <kbd className="px-1 py-0.5 rounded text-[9px] bg-white/10 text-white/50 font-mono">
              {key}
            </kbd>
            {' '}
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}
