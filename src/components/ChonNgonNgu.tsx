import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Globe, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'
import type { MaNgonNgu } from '@/i18n/ngonNgu'

/**
 * NÚT ĐỔI NGÔN NGỮ
 * ------------------------------------------------------------------
 * Tên mỗi thứ tiếng được viết bằng CHÍNH thứ tiếng đó (中文, ไทย,
 * ភាសាខ្មែរ…) chứ không phải dịch sang tiếng Việt. Người Thái tìm chữ
 * "ไทย" chứ không tìm chữ "Tiếng Thái".
 *
 * kieu = "toi"  : đặt trên nền tối (thanh đầu trang khách)
 * kieu = "sang" : đặt trên nền sáng (trong phần mềm quản lý)
 */
export function ChonNgonNgu({
  kieu = 'sang',
  className,
}: {
  kieu?: 'toi' | 'sang'
  className?: string
}) {
  const { ma, danhSach, doiNgonNgu, t } = useT()
  const [mo, setMo] = useState(false)
  const vung = useRef<HTMLDivElement>(null)

  const dangDung = danhSach.find((n) => n.ma === ma) ?? danhSach[0]

  useEffect(() => {
    if (!mo) return
    const xuLy = (e: MouseEvent) => {
      if (vung.current && !vung.current.contains(e.target as Node)) setMo(false)
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMo(false)
    }
    document.addEventListener('mousedown', xuLy)
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('mousedown', xuLy)
      document.removeEventListener('keydown', phim)
    }
  }, [mo])

  const chon = (m: MaNgonNgu) => {
    doiNgonNgu(m)
    setMo(false)
  }

  return (
    <div className={cn('relative', className)} ref={vung}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={mo}
        aria-label={t('ngonNgu.doi')}
        title={t('ngonNgu.doi')}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors',
          kieu === 'toi'
            ? 'text-brand-100/80 ring-1 ring-white/15 hover:bg-white/10 hover:text-white'
            : 'text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <Globe className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">{dangDung.ten}</span>
        <span className="sm:hidden">{dangDung.ma.toUpperCase()}</span>
      </button>

      {mo && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl bg-paper py-1.5 shadow-lg ring-1 ring-slate-200"
        >
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t('ngonNgu.nhan')}
          </p>
          {danhSach.map((n) => (
            <button
              key={n.ma}
              type="button"
              role="menuitem"
              onClick={() => chon(n.ma)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                n.ma === ma
                  ? 'bg-brand-50 font-semibold text-brand-800'
                  : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <span className="text-base leading-none">{n.co}</span>
              <span className="min-w-0 flex-1 truncate">{n.ten}</span>
              {n.ma === ma && <Check className="size-4 shrink-0 text-brand-700" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Hiện một câu dịch có phần NHẤN MẠNH, đánh dấu bằng dấu sao:
 *     "Quần áo vừa in *từng số đo* của bạn"
 *
 * Làm vậy để người dịch được tự do đảo trật tự từ. Tiếng Thái, tiếng Ấn
 * và tiếng Khmer đặt chữ không theo thứ tự tiếng Việt, nên không thể cắt
 * câu thành ba mẩu rời rồi ghép lại được.
 */
export function ChuNhanManh({ cau, lopNhan }: { cau: string; lopNhan: string }) {
  const manh = cau.split('*')
  return (
    <>
      {manh.map((phan, i): ReactNode =>
        // Phần nằm GIỮA hai dấu sao luôn ở vị trí lẻ
        i % 2 === 1 ? (
          <span key={i} className={lopNhan}>
            {phan}
          </span>
        ) : (
          <span key={i}>{phan}</span>
        ),
      )}
    </>
  )
}

/**
 * DẢI GỢI Ý ĐỔI NGÔN NGỮ
 * ------------------------------------------------------------------
 * Hiện ra khi tra địa chỉ mạng thấy người xem CÓ LẼ ở một nước nói thứ
 * tiếng khác. Chỉ HỎI, không tự đổi.
 *
 * Lý do không tự đổi: địa chỉ mạng cho biết cái mạng ở đâu, không cho
 * biết người đó đọc được tiếng gì. Khách Pháp sang Việt Nam du lịch mà
 * bị ép đọc tiếng Việt thì coi như mất khách.
 *
 * Tên thứ tiếng được viết bằng chính chữ của nó, nên người đọc được
 * tiếng đó nhận ra ngay dù phần còn lại họ không hiểu.
 */
export function GoiYNgonNgu() {
  const { goiY, boGoiY, doiNgonNgu, danhSach, t } = useT()
  if (!goiY) return null

  const n = danhSach.find((x) => x.ma === goiY)
  if (!n) return null

  return (
    <div className="border-b border-white/10 bg-brand-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
        <Globe className="size-4 shrink-0 text-gold-400" />
        <p className="min-w-0 flex-1 text-sm text-brand-100">
          {t('ngonNgu.goiY', { ten: n.ten })}
        </p>
        <button
          type="button"
          onClick={() => doiNgonNgu(n.ma)}
          className="shrink-0 rounded-full bg-gold-400 px-3.5 py-1 text-xs font-semibold text-brand-950 transition-colors hover:bg-gold-300"
        >
          {n.co} {t('ngonNgu.doiNgay')}
        </button>
        <button
          type="button"
          onClick={boGoiY}
          aria-label={t('ngonNgu.khongCamOn')}
          title={t('ngonNgu.khongCamOn')}
          className="shrink-0 rounded-lg p-1 text-brand-200/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
