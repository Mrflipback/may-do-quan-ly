import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'

interface ModalProps {
  moRa: boolean
  dong: () => void
  tieuDe: string
  moTa?: string
  children: ReactNode
  chanTrang?: ReactNode
  coLon?: 'nho' | 'vua' | 'lon' | 'rongHet'
}

const CO: Record<NonNullable<ModalProps['coLon']>, string> = {
  nho: 'max-w-md',
  vua: 'max-w-xl',
  lon: 'max-w-3xl',
  rongHet: 'max-w-5xl',
}

export function Modal({
  moRa,
  dong,
  tieuDe,
  moTa,
  children,
  chanTrang,
  coLon = 'vua',
}: ModalProps) {
  const { t: dich } = useT()
  // Bấm phím Esc để đóng
  useEffect(() => {
    if (!moRa) return
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    document.addEventListener('keydown', xuLy)
    return () => document.removeEventListener('keydown', xuLy)
  }, [moRa, dong])

  // Khóa cuộn trang nền khi hộp thoại đang mở
  useEffect(() => {
    if (!moRa) return
    const cu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = cu
    }
  }, [moRa])

  if (!moRa) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Lớp nền mờ */}
      <button
        type="button"
        aria-label={dich('chung.dongHopThoai')}
        onClick={dong}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={tieuDe}
        className={cn(
          'hieu-ung relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-paper shadow-2xl sm:rounded-2xl',
          CO[coLon],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{tieuDe}</h2>
            {moTa && <p className="mt-0.5 text-sm text-slate-500">{moTa}</p>}
          </div>
          <button
            type="button"
            onClick={dong}
            aria-label={dich('chung.dong')}
            className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="scrollbar-slim flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {chanTrang && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:rounded-b-2xl">
            {chanTrang}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
