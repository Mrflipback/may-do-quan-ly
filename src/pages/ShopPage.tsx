import { Link } from 'react-router-dom'
import {
  Briefcase,
  CalendarClock,
  Clock,
  Crown,
  MapPin,
  Package,
  Phone,
  Scissors,
  Shirt,
  Sparkles,
  Wind,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChonNgonNgu, ChuNhanManh, GoiYNgonNgu } from '@/components/ChonNgonNgu'
import { ThuVienAnhMau } from '@/components/ThuVienAnhMau'
import { LoDan } from '@/components/LoDan'
import { TIEM_MAC_DINH, useThongTinTiemCongKhai } from '@/data/thongTinTiem'
import { useChanPhimTatCongKhai } from '@/lib/chanDevTools'
import { useT } from '@/i18n'
import { useNhan } from '@/i18n/nhan'
import type { LoaiTrangPhuc } from '@/types'

/**
 * TRANG GIỚI THIỆU CHO KHÁCH XEM
 * ==================================================================
 * Đây là trang ai cũng mở được, không cần đăng nhập. Nội dung gồm:
 * giới thiệu tiệm, những mặt hàng tiệm nhận may, bảng giá tham khảo,
 * và địa chỉ cùng số điện thoại để khách liên hệ.
 *
 * Tiệm KHÔNG nhận đơn qua trang này. Khách xem xong thì gọi điện hoặc
 * nhắn Zalo, rồi chủ tiệm tự thêm đơn trong phần mềm quản lý.
 *
 * Nội dung hiện ra ở đây (tên tiệm, giới thiệu, giờ mở cửa, bảng giá)
 * do chủ tiệm tự điền trong mục Cài đặt, không viết cứng trong mã.
 */

/* Danh sách mặt hàng. Chỉ giữ MÃ loại — tên và mô tả lấy từ bản dịch
   theo thứ tiếng người xem đang dùng. Mỗi loại một hình vẽ riêng cho
   dễ phân biệt, vì trang này không còn ảnh chụp nữa. */
const SAN_PHAM: { loai: LoaiTrangPhuc; Hinh: typeof Shirt }[] = [
  { loai: 'ao_dai', Hinh: Crown },
  { loai: 'vest', Hinh: Briefcase },
  { loai: 'ao_so_mi', Hinh: Shirt },
  { loai: 'quan_tay', Hinh: Wind },
  { loai: 'vay', Hinh: Sparkles },
  { loai: 'khac', Hinh: Package },
]

/** Nhãn nhỏ đặt trên đầu mỗi mục, màu vàng đồng */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">
      <span className="h-px w-7 bg-gold-500/60" />
      {children}
    </p>
  )
}

function soDienThoaiGon(sdt: string): string {
  return sdt.replace(/[^0-9+]/g, '')
}

export function ShopPage() {
  useChanPhimTatCongKhai()
  const { t: dich } = useT()
  const { NHAN_LOAI_TRANG_PHUC } = useNhan()
  const tiem = useThongTinTiemCongKhai()

  const t = tiem.data ?? TIEM_MAC_DINH
  const sdt = t.dienThoai.trim()

  return (
    <main className="min-h-dvh bg-slate-100">
      {/* ----------------------------- Thanh đầu trang ----------------------------- */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-950 backdrop-blur-xl supports-[backdrop-filter]:bg-brand-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-brand-950 shadow-lg shadow-gold-500/20">
            <Scissors className="size-5" />
          </span>
          <div className="mr-auto min-w-0">
            <p className="truncate font-display text-base font-semibold tracking-wide text-white sm:text-lg">
              {t.ten}
            </p>
            <p className="truncate text-[11px] tracking-wide text-brand-200/80">{t.khauHieu}</p>
          </div>

          <nav className="mr-2 hidden items-center gap-7 text-sm font-medium text-brand-100/80 lg:flex">
            <a href="#san-pham" className="transition-colors hover:text-white">
              {dich('shop.menuSanPham')}
            </a>
            <a href="#mau-da-may" className="transition-colors hover:text-white">
              {dich('shop.menuMau')}
            </a>
            <a href="#bang-gia" className="transition-colors hover:text-white">
              {dich('shop.menuBangGia')}
            </a>
            <a href="#lien-he" className="transition-colors hover:text-white">
              {dich('shop.menuLienHe')}
            </a>
          </nav>

          <ChonNgonNgu kieu="toi" className="mr-1" />

          {sdt && (
            <a href={`tel:${soDienThoaiGon(sdt)}`}>
              <Button kieu="vang" co="nho" className="rounded-full px-4">
                {dich('shop.nutGoi')}
              </Button>
            </a>
          )}
          <Link
            to="/dang-nhap"
            className="hidden text-xs font-medium text-brand-200/70 transition-colors hover:text-white sm:block"
          >
            {dich('shop.chuTiem')}
          </Link>
        </div>
      </header>

      <GoiYNgonNgu />

      {/* ----------------------------- Mở đầu ----------------------------- */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="van-luoi absolute inset-0" />
          <div className="absolute -top-56 right-[-12%] size-[42rem] rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-18%] size-[34rem] rounded-full bg-brand-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
          <LoDan>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300 ring-1 ring-white/10">
              <Scissors className="size-3" />
              {dich('shop.nhan')}
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              <ChuNhanManh cau={dich('shop.tieuDe')} lopNhan="text-gold-400" />
            </h1>
            <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-brand-100/85 sm:text-lg">
              {t.gioiThieu || dich('shop.moTa')}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#bang-gia">
                <Button kieu="vang" co="lon" className="rounded-full px-7 shadow-lg shadow-gold-500/25">
                  {dich('shop.menuBangGia')}
                </Button>
              </a>
              <a href="#lien-he">
                <Button
                  co="lon"
                  className="rounded-full border border-white/20 bg-white/5 px-7 text-white hover:bg-white/10"
                >
                  {dich('shop.menuLienHe')}
                </Button>
              </a>
            </div>
          </LoDan>

          <LoDan tre={180}>
            <dl className="mx-auto mt-16 grid max-w-2xl gap-8 border-t border-white/10 pt-9 sm:grid-cols-3 sm:gap-6">
              {[
                [dich('shop.so1'), dich('shop.so1Phu')],
                [dich('shop.so2'), dich('shop.so2Phu')],
                [dich('shop.so3'), dich('shop.so3Phu')],
              ].map(([to, nho]) => (
                <div key={to}>
                  <dt className="font-display text-2xl font-semibold text-gold-400 sm:text-3xl">
                    {to}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-brand-200/80">{nho}</dd>
                </div>
              ))}
            </dl>
          </LoDan>
        </div>
      </section>

      {/* ----------------------------- Mặt hàng nhận may ----------------------------- */}
      <section id="san-pham" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <LoDan>
          <Kicker>{dich('shop.spKicker')}</Kicker>
          <h2 className="mt-4 max-w-2xl text-balance font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            {dich('shop.spTieuDe')}
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">{dich('shop.spMoTa')}</p>
        </LoDan>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAN_PHAM.map(({ loai, Hinh }, i) => (
            <LoDan key={loai} tre={i * 70} className="flex">
              <article className="flex w-full flex-col rounded-2xl bg-paper p-6 shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50 hover:ring-slate-300">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Hinh className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                  {NHAN_LOAI_TRANG_PHUC[loai]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {dich(`shop.spMoTa_${loai}`)}
                </p>
              </article>
            </LoDan>
          ))}
        </div>
      </section>

      {/* ----------------------------- Mẫu đã may ----------------------------- */}
      <section id="mau-da-may" className="border-t border-slate-200/80 bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <LoDan>
            <Kicker>{dich('shop.mauKicker')}</Kicker>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              {dich('shop.mauTieuDe')}
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">{dich('shop.mauMoTa')}</p>
          </LoDan>
          <ThuVienAnhMau />
        </div>
      </section>

      {/* ----------------------------- Bảng giá ----------------------------- */}
      <section id="bang-gia" className="border-y border-slate-200/80 bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <LoDan>
            <Kicker>{dich('shop.giaKicker')}</Kicker>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              {dich('shop.giaTieuDe')}
            </h2>
          </LoDan>

          <LoDan tre={100}>
            <div className="mt-10 overflow-hidden rounded-2xl bg-paper shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/80">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {dich('shop.giaCot1')}
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {dich('shop.giaCot2')}
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {dich('shop.giaCot3')}
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {dich('shop.giaCot4')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {t.bangGia.map((d, i) => (
                      <tr
                        key={`${d.trang_phuc}-${i}`}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">{d.trang_phuc}</td>
                        <td className="px-5 py-4 text-slate-600">{d.cong_may}</td>
                        <td className="px-5 py-4 text-right font-display text-base font-semibold tabular-nums text-brand-700">
                          {d.gia_tu}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-slate-500">
                          {d.thoi_gian}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {t.ghiChuGia && (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-500">{t.ghiChuGia}</p>
            )}
          </LoDan>
        </div>
      </section>

      {/* ----------------------------- Liên hệ ----------------------------- */}
      <footer id="lien-he" className="border-t border-white/10 bg-brand-950 text-brand-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-3 sm:px-6">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Phone className="size-4 text-gold-400" /> {dich('shop.lhDienThoai')}
            </h3>
            {sdt ? (
              <p className="mt-2 select-all text-lg font-bold tabular-nums text-white">{sdt}</p>
            ) : (
              <p className="mt-2 text-sm">{dich('shop.lhChuaSdt')}</p>
            )}
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <MapPin className="size-4 text-gold-400" /> {dich('shop.lhDiaChi')}
            </h3>
            <p className="mt-2 text-sm">{t.diaChi || dich('shop.lhChuaDiaChi')}</p>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Clock className="size-4 text-gold-400" /> {dich('shop.lhGioMoCua')}
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm">
              {t.gioMoCua || dich('shop.lhChuaGio')}
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5 text-xs text-brand-200/70 sm:px-6">
            <CalendarClock className="size-4 text-gold-400" />
            <span>{dich('shop.lhCuoi', { ten: t.ten })}</span>
            <Link to="/dang-nhap" className="ml-auto font-medium hover:text-white">
              {dich('shop.chuTiem')}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
