import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * KHUNG XEM ẢNH PHÓNG TO
 * ------------------------------------------------------------------
 * Dùng chung cho trang khách xem (ShopPage) và Thư viện mẫu bên trong
 * phần mềm. Bấm vào một tấm là mở to ra giữa màn hình, bấm mũi tên hoặc
 * gõ phím ← → để xem tấm kế tiếp, Esc để đóng.
 */

export interface AnhXem {
  khoa: string
  ten: string
  moTa?: string | null
  /** Ảnh bản to. Null nghĩa là chưa tải được (ví dụ mất mạng). */
  urlTo: string | null
  urlNho?: string | null
  /** Chữ nhỏ dưới ảnh khi xem to, ví dụ "Vest / Blazer". */
  nhan?: string
  /** Nhãn nhỏ ở góc ô trong lưới, ví dụ "Ảnh mẫu". */
  the?: string
}

interface Props {
  ds: AnhXem[]
  /** Vị trí ảnh đang mở. null là đang đóng. */
  viTri: number | null
  dat: (v: number | null) => void
}

export function HopXemAnh({ ds, viTri, dat }: Props) {
  const dong = useCallback(() => dat(null), [dat])

  const nhay = useCallback(
    (buoc: number) => {
      if (viTri === null || ds.length === 0) return
      dat((viTri + buoc + ds.length) % ds.length)
    },
    [viTri, ds.length, dat],
  )

  // Phím tắt: Esc đóng, mũi tên trái/phải chuyển ảnh
  useEffect(() => {
    if (viTri === null) return
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
      else if (e.key === 'ArrowLeft') nhay(-1)
      else if (e.key === 'ArrowRight') nhay(1)
    }
    document.addEventListener('keydown', xuLy)
    return () => document.removeEventListener('keydown', xuLy)
  }, [viTri, dong, nhay])

  // Khoá cuộn trang nền khi đang xem ảnh
  useEffect(() => {
    if (viTri === null) return
    const cu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = cu
    }
  }, [viTri])

  if (viTri === null || !ds[viTri]) return null
  const a = ds[viTri]

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Đóng ảnh"
        onClick={dong}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={a.ten}
        className="hieu-ung relative flex max-h-full w-full max-w-4xl flex-col"
      >
        <div className="flex items-start justify-between gap-3 pb-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{a.ten}</p>
            {a.moTa && <p className="mt-0.5 line-clamp-2 text-sm text-slate-300">{a.moTa}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              {viTri + 1} / {ds.length}
            </span>
            <button
              type="button"
              onClick={dong}
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {a.urlTo ? (
            <img
              src={a.urlTo}
              alt={a.ten}
              className="max-h-[72dvh] w-auto max-w-full rounded-xl bg-slate-900 object-contain shadow-2xl"
            />
          ) : (
            <p className="rounded-xl bg-slate-800 px-6 py-10 text-sm text-slate-300">
              Không tải được ảnh này.
            </p>
          )}

          {ds.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => nhay(-1)}
                aria-label="Ảnh trước"
                className="absolute left-1 flex size-10 items-center justify-center rounded-full bg-slate-900/70 text-white transition-colors hover:bg-slate-900 sm:-left-14"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => nhay(1)}
                aria-label="Ảnh sau"
                className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-slate-900/70 text-white transition-colors hover:bg-slate-900 sm:-right-14"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>

        {a.nhan && <p className="pt-3 text-center text-xs text-slate-400">{a.nhan}</p>}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/*  Lưới ảnh bấm vào xem to                                            */
/* ------------------------------------------------------------------ */

export function LuoiAnh({
  ds,
  mo,
  className = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
}: {
  ds: AnhXem[]
  mo: (v: number) => void
  className?: string
}) {
  return (
    <div className={className}>
      {ds.map((a, i) => (
        <button
          key={a.khoa}
          type="button"
          onClick={() => mo(i)}
          className="group relative aspect-3/4 overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-300/70 transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {a.urlNho || a.urlTo ? (
            <img
              src={a.urlNho ?? a.urlTo ?? ''}
              alt={a.ten}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : null}
          {a.the && (
            <span className="absolute top-2 left-2 rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {a.the}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-3 pb-2.5 pt-8 text-left">
            <span className="block truncate text-xs font-semibold text-white">{a.ten}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
