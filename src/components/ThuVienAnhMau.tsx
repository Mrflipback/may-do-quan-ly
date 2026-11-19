import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ANH_MAU_GIOI_THIEU, duongDanAnh, duongDanAnhNho } from '@/data/anhMau'
import { useT } from '@/i18n'

/*
 * Thư viện ảnh mẫu trên trang giới thiệu cho khách xem.
 *
 * Ô lưới dùng ảnh nhỏ 440px cho nhẹ; bấm vào mới tải ảnh to 900px.
 * Tất cả ảnh trong lưới đều loading="lazy" nên khách mở trang không
 * phải tải hết 21 tấm cùng lúc.
 */

export function ThuVienAnhMau() {
  const { t: dich } = useT()
  const [maDangXem, setMaDangXem] = useState<string | null>(null)

  const anhDangXem = ANH_MAU_GIOI_THIEU.find((a) => a.ma === maDangXem) ?? null

  // Mở ảnh to thì khoá cuộn nền và cho phím Esc đóng lại.
  useEffect(() => {
    if (!anhDangXem) return

    const xuLyPhim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaDangXem(null)
    }
    document.addEventListener('keydown', xuLyPhim)

    const cuonCu = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', xuLyPhim)
      document.body.style.overflow = cuonCu
    }
  }, [anhDangXem])

  if (ANH_MAU_GIOI_THIEU.length === 0) return null

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {ANH_MAU_GIOI_THIEU.map((a) => (
          <button
            key={a.ma}
            type="button"
            onClick={() => setMaDangXem(a.ma)}
            aria-label={`${dich('shop.mauXemTo')}: ${a.ten}`}
            className="group relative block overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200 transition hover:ring-2 hover:ring-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <img
              src={duongDanAnhNho(a.ma)}
              alt={a.moTa}
              width={a.rong}
              height={a.cao}
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-left text-[11px] font-medium leading-snug text-white sm:text-xs">
              {a.ten}
            </span>
          </button>
        ))}
      </div>

      {anhDangXem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={anhDangXem.ten}
          onClick={() => setMaDangXem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            type="button"
            onClick={() => setMaDangXem(null)}
            aria-label={dich('shop.mauDong')}
            autoFocus
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
          >
            <X className="size-5" />
          </button>

          {/* Bấm vào chính tấm ảnh thì đừng đóng — chỉ bấm ra nền mới đóng. */}
          <figure
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full max-w-3xl flex-col items-center gap-3"
          >
            <img
              src={duongDanAnh(anhDangXem.ma)}
              alt={anhDangXem.moTa}
              width={anhDangXem.rong}
              height={anhDangXem.cao}
              decoding="async"
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            <figcaption className="max-w-xl text-center text-sm text-white/90">
              <span className="block font-semibold">{anhDangXem.ten}</span>
              <span className="mt-0.5 block text-xs text-white/70">{anhDangXem.moTa}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  )
}
