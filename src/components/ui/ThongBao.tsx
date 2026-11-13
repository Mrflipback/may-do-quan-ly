import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Info, TriangleExclamationPoint, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoaiThongBao = 'thanh_cong' | 'loi' | 'tin'

interface ThongBao {
  id: number
  loai: LoaiThongBao
  noiDung: string
}

interface ContextThongBao {
  thanhCong: (noiDung: string) => void
  loi: (noiDung: string) => void
  tin: (noiDung: string) => void
}

const Ctx = createContext<ContextThongBao | null>(null)

/** Dùng trong mọi màn hình: const tb = useThongBao(); tb.thanhCong('Đã lưu') */
export function useThongBao(): ContextThongBao {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useThongBao phải nằm trong <NhaCungCapThongBao>')
  return ctx
}

const KIEU: Record<LoaiThongBao, { lop: string; icon: ReactNode }> = {
  thanh_cong: {
    lop: 'bg-emerald-600 text-white',
    icon: <CircleCheck className="size-5 shrink-0" />,
  },
  loi: {
    lop: 'bg-rose-600 text-white',
    icon: <TriangleExclamationPoint className="size-5 shrink-0" />,
  },
  tin: {
    lop: 'bg-slate-800 text-white',
    icon: <Info className="size-5 shrink-0" />,
  },
}

export function NhaCungCapThongBao({ children }: { children: ReactNode }) {
  const [danhSach, setDanhSach] = useState<ThongBao[]>([])
  const demRef = useRef(0)

  const them = useCallback((loai: LoaiThongBao, noiDung: string) => {
    demRef.current += 1
    const id = demRef.current
    setDanhSach((cu) => [...cu, { id, loai, noiDung }])
    // Lỗi để lâu hơn cho người dùng kịp đọc
    const thoiGian = loai === 'loi' ? 7000 : 3500
    window.setTimeout(() => {
      setDanhSach((cu) => cu.filter((t) => t.id !== id))
    }, thoiGian)
  }, [])

  const gia_tri = useMemo<ContextThongBao>(
    () => ({
      thanhCong: (n: string) => them('thanh_cong', n),
      loi: (n: string) => them('loi', n),
      tin: (n: string) => them('tin', n),
    }),
    [them],
  )

  const dong = (id: number) => setDanhSach((cu) => cu.filter((t) => t.id !== id))

  return (
    <Ctx.Provider value={gia_tri}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        >
          {danhSach.map((t) => (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 shadow-lg',
                'hieu-ung',
                KIEU[t.loai].lop,
              )}
            >
              {KIEU[t.loai].icon}
              <p className="flex-1 text-sm leading-snug font-medium">{t.noiDung}</p>
              <button
                type="button"
                onClick={() => dong(t.id)}
                aria-label="Đóng thông báo"
                className="-mt-0.5 -mr-1 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Hộp thoại hỏi lại trước khi xóa                                     */
/* ------------------------------------------------------------------ */

interface XacNhanProps {
  moRa: boolean
  tieuDe: string
  noiDung: string
  nhanDongY?: string
  dangXuLy?: boolean
  dongY: () => void
  huy: () => void
}

export function HopThoaiXacNhan({
  moRa,
  tieuDe,
  noiDung,
  nhanDongY = 'Xóa',
  dangXuLy = false,
  dongY,
  huy,
}: XacNhanProps) {
  useEffect(() => {
    if (!moRa) return
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dangXuLy) huy()
    }
    document.addEventListener('keydown', xuLy)
    return () => document.removeEventListener('keydown', xuLy)
  }, [moRa, huy, dangXuLy])

  if (!moRa) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={tieuDe}
        className="hieu-ung relative w-full max-w-md rounded-2xl bg-paper p-6 shadow-2xl"
      >
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <TriangleExclamationPoint className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{tieuDe}</h2>
            <p className="mt-1.5 text-sm text-slate-600">{noiDung}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={huy}
            disabled={dangXuLy}
            className="h-10 rounded-lg bg-paper px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={dongY}
            disabled={dangXuLy}
            className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {dangXuLy ? 'Đang xử lý…' : nhanDongY}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
