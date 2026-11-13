import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock,
  MapPin,
  Phone,
  Ruler,
  Scissors,
  Shirt,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HopXemAnh, LuoiAnh, type AnhXem } from '@/components/XemAnh'
import { LoDan } from '@/components/LoDan'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { TIEM_MAC_DINH, useGuiDonOnline, useThongTinTiemCongKhai } from '@/data/datMayOnline'
import { NHAN_LOAI_TRANG_PHUC, TAT_CA_CHI_SO } from '@/lib/constants'
import { ANH_CO_SAN, ANH_NOI_BAT, NHAN_NGUON, anhNho, anhTo } from '@/data/anhCoSan'
import type { DonOnline, LoaiTrangPhuc, NhanHang } from '@/types'

/* Số đo hỏi khách theo đúng loại trang phục họ chọn. Mã trùng với TAT_CA_CHI_SO
   nên khi tiệm tạo đơn thì số đo vào thẳng hồ sơ số đo, không phải gõ lại. */
const SO_DO_THEO_LOAI: Record<LoaiTrangPhuc, string[]> = {
  ao_so_mi: ['vong_co', 'rong_vai', 'vong_nguc', 'vong_eo', 'dai_ao', 'dai_tay'],
  vest: ['vong_co', 'rong_vai', 'vong_nguc', 'vong_eo', 'vong_mong', 'dai_ao', 'dai_tay'],
  ao_dai: ['vong_co', 'rong_vai', 'vong_nguc', 'vong_eo', 'vong_mong', 'dai_ao', 'dai_tay', 'ha_nguc'],
  quan_tay: ['vong_eo', 'vong_mong', 'vong_dui', 'vong_goi', 'vong_ong', 'dai_quan', 'day_quan'],
  vay: ['vong_nguc', 'vong_eo', 'vong_mong', 'dai_ao', 'rong_vai', 'ha_nguc'],
  khac: ['chieu_cao', 'can_nang', 'vong_nguc', 'vong_eo', 'vong_mong'],
}

const SAN_PHAM: { loai: LoaiTrangPhuc; ten: string; moTa: string }[] = [
  { loai: 'ao_dai', ten: 'Áo dài', moTa: 'Áo dài truyền thống và cách tân, cổ tròn hoặc cổ thuyền, tà dài theo dáng người.' },
  { loai: 'vest', ten: 'Vest / Blazer', moTa: 'Vest nam nữ một hoặc hai hàng khuy, bẻ ve theo yêu cầu, có lớp lót và dựng định hình.' },
  { loai: 'ao_so_mi', ten: 'Sơ mi', moTa: 'Sơ mi công sở tay dài hoặc tay ngắn, cổ đức, cổ tàu, chít eo hoặc dáng suông.' },
  { loai: 'quan_tay', ten: 'Quần âu', moTa: 'Quần ống côn, ống đứng hoặc ống loe, có ly hoặc không ly, lên lai theo chiều cao giày.' },
  { loai: 'vay', ten: 'Váy / Đầm', moTa: 'Đầm dự tiệc, đầm công sở, chân váy bút chì hoặc xòe, may theo ảnh mẫu bạn gửi.' },
  { loai: 'khac', ten: 'Đồng phục & sửa đồ', moTa: 'Đồng phục công ty, nhà hàng, lớp học. Nhận cả sửa đồ: lên lai, bóp eo, thay khoá.' },
]

const QUY_TRINH = [
  { ten: 'Điền phiếu đặt', moTa: 'Khai tên, số điện thoại, loại trang phục và ngày cần lấy ngay trên trang này. Không cần tài khoản.' },
  { ten: 'Tiệm gọi xác nhận', moTa: 'Phiếu về thẳng phần mềm của tiệm. Tiệm gọi lại trong ngày để chốt mẫu và báo giá.' },
  { ten: 'Lấy số đo, chọn vải', moTa: 'Bạn tới tiệm đo trực tiếp, hoặc gửi số đo sẵn có. Chốt vải, kiểu dáng và tiền cọc.' },
  { ten: 'Thử mẫu rồi nhận', moTa: 'Thử một lần để chỉnh form, sau đó hoàn thiện. Nhận tại tiệm hoặc giao tận nơi.' },
]

/* Ảnh thật của tiệm. Danh sách nằm ở src/data/anhCoSan.ts — muốn thêm
   bớt ảnh trên trang này thì sửa cờ noiBat trong file đó. */
const DS_ANH: AnhXem[] = ANH_NOI_BAT.map((a) => ({
  khoa: a.ma,
  ten: a.ten,
  moTa: a.moTa,
  urlTo: anhTo(a.ma),
  urlNho: anhNho(a.ma),
  nhan: `${NHAN_LOAI_TRANG_PHUC[a.loai]} · ${NHAN_NGUON[a.nguon]}`,
  the: a.nguon === 'tham_khao' ? 'Ảnh mẫu' : undefined,
}))

const viTriAnh = (ma: string): number => DS_ANH.findIndex((x) => x.khoa === ma)

/* Ảnh bìa cho từng loại trang phục ở mục "Tiệm nhận may những gì".
   Loại nào chưa có ảnh thì hiện ô biểu tượng như cũ. */
const ANH_BIA: Partial<Record<LoaiTrangPhuc, string>> = {
  vest: 'vest-3-manh-xanh-xam',
  ao_so_mi: 'so-mi-may-do',
}

/* Ảnh ở đầu trang: một tấm lớn, hai tấm nhỏ, và một tấm chụp thật tại
   tiệm để lồi ra góc dưới — cho khách thấy cả đồ đẹp lẫn đồ thật. */
const ANH_DAU_TRANG = ['vest-3-manh-be', 'vest-3-manh-xam-tro', 'vest-3-manh-nau-socola']
const ANH_DAI_DUOI = [
  'vest-xanh-xam-tron-bo-2',
  'vest-xanh-xam-ca-vat',
  'vest-xanh-xam-tron-bo-3',
]

/* Nhãn nhỏ đặt trên đầu mỗi mục, màu vàng đồng */
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
  const tiem = useThongTinTiemCongKhai()
  const gui = useGuiDonOnline()

  const [loai, setLoai] = useState<LoaiTrangPhuc>('ao_dai')
  const [form, setForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    mo_ta_trang_phuc: '',
    so_luong: '1',
    ngay_can_lay: '',
    nhan_hang: 'tai_tiem' as NhanHang,
    dia_chi: '',
    ghi_chu: '',
  })
  const [soDo, setSoDo] = useState<Record<string, string>>({})
  const [loi, setLoi] = useState('')
  const [phieu, setPhieu] = useState<DonOnline | null>(null)
  const [anhDangXem, setAnhDangXem] = useState<number | null>(null)

  const oSoDo = useMemo(
    () =>
      SO_DO_THEO_LOAI[loai]
        .map((ma) => TAT_CA_CHI_SO.find((c) => c.ma === ma))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [loai],
  )

  // Chua chay SQL, chua cau hinh hay mang chap chon deu roi ve ban mau,
  // de trang luon doc duoc thay vi hien bang trong.
  const t = tiem.data ?? TIEM_MAC_DINH
  const sdt = t.dienThoai

  async function guiPhieu(e: React.FormEvent) {
    e.preventDefault()
    const ten = form.ho_ten.trim()
    const so = form.so_dien_thoai.trim()

    if (!ten) return setLoi('Bạn điền giúp họ tên để tiệm gọi đúng người.')
    if (!so) return setLoi('Bạn điền số điện thoại hoặc Zalo để tiệm liên hệ lại.')
    if (soDienThoaiGon(so).length < 9) return setLoi('Số điện thoại chưa đủ chữ số, bạn kiểm tra lại giúp.')
    if (form.nhan_hang === 'giao_tan_noi' && !form.dia_chi.trim())
      return setLoi('Bạn chọn giao tận nơi thì điền giúp địa chỉ nhận hàng.')
    setLoi('')

    const soDoSach: Record<string, string> = {}
    for (const [ma, v] of Object.entries(soDo)) if (v.trim()) soDoSach[ma] = v.trim()

    try {
      const kq = await gui.mutateAsync({
        ho_ten: ten,
        so_dien_thoai: so,
        loai_trang_phuc: loai,
        mo_ta_trang_phuc: form.mo_ta_trang_phuc,
        so_luong: Math.max(1, Number(form.so_luong) || 1),
        ngay_can_lay: form.ngay_can_lay || null,
        nhan_hang: form.nhan_hang,
        dia_chi: form.dia_chi,
        so_do: soDoSach,
        ghi_chu: form.ghi_chu,
      })
      setPhieu(kq)
      window.scrollTo({ top: document.getElementById('ket-qua')?.offsetTop ?? 0, behavior: 'smooth' })
    } catch {
      setLoi(
        'Chưa gửi được phiếu, có thể mạng đang chập chờn. Bạn thử lại, hoặc gọi thẳng cho tiệm theo số ở cuối trang.',
      )
    }
  }

  /* --------------------------- Phiếu đã gửi --------------------------- */
  if (phieu) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-brand-950">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="van-luoi absolute inset-0" />
          <div className="absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-[1.6rem] bg-paper p-6 shadow-2xl shadow-black/30 ring-1 ring-white/10 sm:p-9">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Check className="size-7" />
            </span>
            <h1 className="mt-6 font-display text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Tiệm đã nhận được phiếu của bạn
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Phiếu đã vào thẳng phần mềm của tiệm, bạn không phải gửi thêm gì nữa. Tiệm sẽ gọi lại
              số <b className="text-slate-900">{phieu.so_dien_thoai}</b> để xác nhận mẫu và báo giá.
            </p>

            <dl className="mt-7 divide-y divide-slate-100 rounded-2xl bg-slate-50/70 px-4 text-sm ring-1 ring-slate-200/70">
              {[
                ['Mã phiếu', phieu.ma_phieu],
                ['Họ tên', phieu.ho_ten],
                ['Trang phục', `${NHAN_LOAI_TRANG_PHUC[phieu.loai_trang_phuc]}${phieu.mo_ta_trang_phuc ? ` — ${phieu.mo_ta_trang_phuc}` : ''}`],
                ['Số lượng', String(phieu.so_luong)],
                ['Ngày cần lấy', phieu.ngay_can_lay ? phieu.ngay_can_lay.split('-').reverse().join('/') : 'Chưa chọn'],
                ['Nhận hàng', phieu.nhan_hang === 'giao_tan_noi' ? `Giao tận nơi — ${phieu.dia_chi}` : 'Đến tiệm lấy'],
              ].map(([nhan, giaTri]) => (
                <div key={nhan} className="flex gap-4 py-3">
                  <dt className="w-32 shrink-0 text-slate-500">{nhan}</dt>
                  <dd className="min-w-0 font-semibold text-slate-900">{giaTri}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-sm leading-relaxed text-slate-600">
              Bạn ghi lại mã phiếu <b className="text-slate-900">{phieu.ma_phieu}</b> để tiện đối chiếu khi gọi.
              {sdt && (
                <>
                  {' '}
                  Số của tiệm: <b className="select-all text-slate-900">{sdt}</b>.
                </>
              )}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setPhieu(null)
                  setForm({
                    ho_ten: '',
                    so_dien_thoai: '',
                    mo_ta_trang_phuc: '',
                    so_luong: '1',
                    ngay_can_lay: '',
                    nhan_hang: 'tai_tiem',
                    dia_chi: '',
                    ghi_chu: '',
                  })
                  setSoDo({})
                }}
              >
                Đặt thêm một bộ nữa
              </Button>
              {sdt && (
                <a href={`https://zalo.me/${soDienThoaiGon(sdt)}`} target="_blank" rel="noopener noreferrer">
                  <Button kieu="phu">Nhắn Zalo gửi ảnh mẫu</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  /* ----------------------------- Trang chính ----------------------------- */
  return (
    <main className="min-h-dvh bg-slate-100">
      {/* Thanh đầu trang */}
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
              Sản phẩm
            </a>
            <a href="#anh-mau" className="transition-colors hover:text-white">
              Mẫu đã may
            </a>
            <a href="#bang-gia" className="transition-colors hover:text-white">
              Bảng giá
            </a>
            <a href="#lien-he" className="transition-colors hover:text-white">
              Liên hệ
            </a>
          </nav>

          <a href="#dat-may">
            <Button kieu="vang" co="nho" className="rounded-full px-4">
              Đặt may ngay
            </Button>
          </a>
          <Link
            to="/dang-nhap"
            className="hidden text-xs font-medium text-brand-200/70 transition-colors hover:text-white sm:block"
          >
            Chủ tiệm
          </Link>
        </div>
      </header>

      {/* Mở đầu */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        {/* Ánh sáng nền và vân lưới mờ, cho nền đỡ phẳng */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="van-luoi absolute inset-0" />
          <div className="absolute -top-56 right-[-12%] size-[42rem] rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-18%] size-[34rem] rounded-full bg-brand-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:gap-16">
          <LoDan>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300 ring-1 ring-white/10">
            <Scissors className="size-3" />
            Nhận may đo · Sửa chữa · Đặt online
          </p>
          <h1 className="mt-6 max-w-2xl text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Quần áo vừa in <span className="text-gold-400">từng số đo</span> của bạn
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-brand-100/85 sm:text-lg">
            {t.gioiThieu ||
              'Áo dài, vest, sơ mi, quần âu, váy đầm và đồng phục — cắt theo số đo riêng, thử mẫu trước khi hoàn thiện.'}{' '}
            Bạn điền phiếu đặt ngay trên trang này, tiệm gọi lại xác nhận trong ngày.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#dat-may">
              <Button kieu="vang" co="lon" className="rounded-full px-7 shadow-lg shadow-gold-500/25">
                Điền phiếu đặt may
              </Button>
            </a>
            <a href="#anh-mau">
              <Button
                co="lon"
                className="rounded-full border border-white/20 bg-white/5 px-7 text-white hover:bg-white/10"
                iconPhai={<ArrowRight className="size-4" />}
              >
                Xem mẫu đã may
              </Button>
            </a>
          </div>
          </LoDan>

          {/* Cụm ảnh đầu trang. Bấm vào tấm nào cũng phóng to ra được. */}
          <LoDan tre={120}>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="grid grid-cols-5 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setAnhDangXem(viTriAnh(ANH_DAU_TRANG[0]))}
                  aria-label="Xem ảnh lớn"
                  className="group relative col-span-3 aspect-3/4 overflow-hidden rounded-[1.4rem] bg-brand-900 shadow-2xl shadow-black/50 ring-1 ring-white/15 lg:-mt-6"
                >
                  <img
                    src={anhNho(ANH_DAU_TRANG[0])}
                    alt="Mẫu vest ba mảnh"
                    className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-slate-950/65 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                    Ảnh mẫu
                  </span>
                </button>

                <div className="col-span-2 grid gap-3 sm:gap-4">
                  {ANH_DAU_TRANG.slice(1).map((ma) => (
                    <button
                      key={ma}
                      type="button"
                      onClick={() => setAnhDangXem(viTriAnh(ma))}
                      aria-label="Xem ảnh lớn"
                      className="group relative aspect-square overflow-hidden rounded-[1.1rem] bg-brand-900 shadow-xl shadow-black/40 ring-1 ring-white/15"
                    >
                      <img
                        src={anhNho(ma)}
                        alt="Mẫu tiệm may"
                        className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-950/65 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                        Ảnh mẫu
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dải dẫn sang thư viện ảnh, kèm vài tấm chụp thật tại tiệm */}
              <a
                href="#anh-mau"
                className="group mt-4 flex items-center gap-3 rounded-2xl bg-white/5 px-3.5 py-3 ring-1 ring-white/10 transition-colors hover:bg-white/10 sm:mt-5"
              >
                <span className="flex shrink-0 -space-x-2.5">
                  {ANH_DAI_DUOI.map((ma) => (
                    <img
                      key={ma}
                      src={anhNho(ma)}
                      alt=""
                      aria-hidden
                      className="size-9 rounded-full object-cover ring-2 ring-brand-950"
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-semibold text-white">
                    {ANH_CO_SAN.length} mẫu trong thư viện
                  </span>
                  <span className="block text-xs text-brand-200/70">
                    Có ảnh chụp thật tại tiệm
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-gold-400 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </LoDan>
          </div>

          <LoDan tre={220}>
            <dl className="mt-16 grid gap-8 border-t border-white/10 pt-9 sm:grid-cols-3 sm:gap-6">
              {[
                ['7–10 ngày', 'Thời gian may thông thường'],
                ['1 lần thử', 'Chỉnh form trước khi hoàn thiện'],
                ['Miễn phí', 'Sửa lại trong 7 ngày sau khi nhận'],
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

      {/* Sản phẩm */}
      <section id="san-pham" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <LoDan>
          <Kicker>Trang phục</Kicker>
          <h2 className="mt-4 max-w-2xl text-balance font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Tiệm nhận may những gì
          </h2>
          <p className="mt-3 max-w-xl text-slate-600">
            Cắt theo số đo riêng, thử mẫu trước khi hoàn thiện. Bấm vào loại bạn cần là phiếu
            đặt tự điền sẵn giúp bạn.
          </p>
        </LoDan>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAN_PHAM.map((sp, i) => {
            const bia = ANH_BIA[sp.loai]
            return (
              <LoDan key={sp.ten} tre={i * 70} className="flex">
                <article className="group/the flex w-full flex-col overflow-hidden rounded-2xl bg-paper shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50 hover:ring-slate-300">
                  {bia ? (
                    <button
                      type="button"
                      onClick={() => setAnhDangXem(viTriAnh(bia))}
                      aria-label={`Xem ảnh ${sp.ten}`}
                      className="relative aspect-4/3 overflow-hidden bg-slate-100"
                    >
                      <img
                        src={anhNho(bia)}
                        alt={sp.ten}
                        loading="lazy"
                        className="size-full object-cover object-top transition-transform duration-500 group-hover/the:scale-105"
                      />
                    </button>
                  ) : (
                    <div className="relative flex aspect-4/3 flex-col items-center justify-center gap-2.5 overflow-hidden bg-brand-950">
                      <div
                        aria-hidden
                        className="van-luoi absolute inset-0 opacity-60"
                      />
                      <Shirt className="relative size-9 text-gold-400/70" />
                      <span className="relative text-[11px] font-medium uppercase tracking-[0.15em] text-brand-200/70">
                        {sp.ten}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-display text-lg font-semibold text-slate-900">{sp.ten}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{sp.moTa}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoai(sp.loai)
                        document.getElementById('dat-may')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-700 transition-colors hover:text-brand-900"
                    >
                      Đặt may {sp.ten.toLowerCase()}
                      <ArrowRight className="size-4 transition-transform group-hover/the:translate-x-1" />
                    </button>
                  </div>
                </article>
              </LoDan>
            )
          })}
        </div>
      </section>

      {/* Ảnh mẫu thật */}
      <section id="anh-mau" className="border-y border-slate-200/80 bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <LoDan>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <Kicker>Thư viện mẫu</Kicker>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                  Mẫu tiệm đã may
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">
                Bấm vào từng tấm để xem rõ đường may, ve áo và chất vải. Thích mẫu nào thì
                ghi tên mẫu vào ô “Kiểu dáng mong muốn” ở phiếu đặt may. Mỗi ảnh đều ghi rõ
                là ảnh chụp tại tiệm hay ảnh mẫu tham khảo.
              </p>
            </div>
          </LoDan>
          <LoDan tre={100} className="mt-10">
            <LuoiAnh
              ds={DS_ANH}
              mo={setAnhDangXem}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
            />
          </LoDan>
        </div>
      </section>

      {/* Bảng giá */}
      <section id="bang-gia" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <LoDan>
          <Kicker>Bảng giá</Kicker>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
            Giá tham khảo
          </h2>
        </LoDan>

        <LoDan tre={100}>
          <div className="mt-10 overflow-hidden rounded-2xl bg-paper shadow-sm shadow-slate-200/60 ring-1 ring-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Trang phục
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Công may
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Giá từ
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Thời gian
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
      </section>

      {/* Quy trình */}
      <section className="border-y border-slate-200/80 bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <LoDan>
            <Kicker>Cách đặt</Kicker>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Đặt may online bốn bước
            </h2>
          </LoDan>

          <ol className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {/* Đường nối bốn bước trên màn hình rộng */}
            <span
              aria-hidden
              className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent lg:block"
            />
            {QUY_TRINH.map((b, i) => (
              <LoDan key={b.ten} tre={i * 90}>
                <li className="relative">
                  <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-brand-950 font-display text-sm font-semibold text-gold-400 ring-4 ring-paper">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">
                    {b.ten}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.moTa}</p>
                </li>
              </LoDan>
            ))}
          </ol>
        </div>
      </section>

      {/* Phiếu đặt may */}
      <section id="dat-may" className="relative overflow-hidden bg-brand-950 py-20 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="van-luoi absolute inset-0" />
          <div className="absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gold-500/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <LoDan className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300 ring-1 ring-white/10">
              Phiếu đặt may
            </p>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Điền phiếu, tiệm gọi lại trong ngày
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-100/80">
              Điền những ô có dấu <span className="text-gold-400">*</span> là đủ để tiệm liên hệ.
              Phần số đo để trống cũng được — tiệm đo giúp bạn khi tới.
            </p>
          </LoDan>

          <LoDan tre={120}>
          <div className="mt-10 rounded-[1.6rem] bg-paper p-5 shadow-2xl shadow-black/30 ring-1 ring-white/10 sm:p-8">
          <form onSubmit={guiPhieu} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                nhan="Họ và tên"
                batBuoc
                id="ho_ten"
                autoComplete="name"
                placeholder="Nguyễn Thị Hoa"
                value={form.ho_ten}
                onChange={(e) => setForm((c) => ({ ...c, ho_ten: e.target.value }))}
              />
              <Input
                nhan="Số điện thoại / Zalo"
                batBuoc
                id="so_dien_thoai"
                inputMode="tel"
                autoComplete="tel"
                placeholder="09xx xxx xxx"
                value={form.so_dien_thoai}
                onChange={(e) => setForm((c) => ({ ...c, so_dien_thoai: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                nhan="Loại trang phục"
                batBuoc
                id="loai_trang_phuc"
                value={loai}
                onChange={(e) => setLoai(e.target.value as LoaiTrangPhuc)}
              >
                {(Object.keys(NHAN_LOAI_TRANG_PHUC) as LoaiTrangPhuc[]).map((k) => (
                  <option key={k} value={k}>
                    {NHAN_LOAI_TRANG_PHUC[k]}
                  </option>
                ))}
              </Select>
              <Input
                nhan="Số lượng"
                id="so_luong"
                type="number"
                min={1}
                value={form.so_luong}
                onChange={(e) => setForm((c) => ({ ...c, so_luong: e.target.value }))}
              />
              <Input
                nhan="Ngày cần lấy"
                id="ngay_can_lay"
                type="date"
                value={form.ngay_can_lay}
                onChange={(e) => setForm((c) => ({ ...c, ngay_can_lay: e.target.value }))}
              />
            </div>

            <Input
              nhan="Kiểu dáng mong muốn"
              id="mo_ta_trang_phuc"
              placeholder="VD: áo dài lụa tơ tằm đỏ đô, tay lỡ, cổ thuyền 3 phân"
              value={form.mo_ta_trang_phuc}
              onChange={(e) => setForm((c) => ({ ...c, mo_ta_trang_phuc: e.target.value }))}
            />

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-gold-600">
                <Ruler className="size-3.5" /> Số đo (nếu đã biết)
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {oSoDo.map((c) => (
                  <Input
                    key={c.ma}
                    nhan={`${c.ten} (${c.donVi})`}
                    id={`sd_${c.ma}`}
                    inputMode="decimal"
                    value={soDo[c.ma] ?? ''}
                    onChange={(e) => setSoDo((cu) => ({ ...cu, [c.ma]: e.target.value }))}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Không chắc thì bỏ trống, tiệm đo lại khi bạn đến. Số đo bạn khai sẽ vào thẳng hồ sơ số
                đo của tiệm.
              </p>
            </fieldset>

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-gold-600">
                Nhận hàng
              </legend>
              <div className="flex flex-wrap gap-5">
                {(
                  [
                    ['tai_tiem', 'Đến tiệm lấy'],
                    ['giao_tan_noi', 'Giao tận nơi'],
                  ] as [NhanHang, string][]
                ).map(([gt, nhan]) => (
                  <label key={gt} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="nhan_hang"
                      value={gt}
                      checked={form.nhan_hang === gt}
                      onChange={() => setForm((c) => ({ ...c, nhan_hang: gt }))}
                      className="size-4 accent-brand-700"
                    />
                    {nhan}
                  </label>
                ))}
              </div>
              {form.nhan_hang === 'giao_tan_noi' && (
                <Input
                  nhan="Địa chỉ nhận hàng"
                  batBuoc
                  id="dia_chi"
                  autoComplete="street-address"
                  placeholder="Số nhà, đường, phường, thành phố"
                  boxClassName="mt-4"
                  value={form.dia_chi}
                  onChange={(e) => setForm((c) => ({ ...c, dia_chi: e.target.value }))}
                />
              )}
            </fieldset>

            <Textarea
              nhan="Ghi chú thêm"
              id="ghi_chu"
              rows={3}
              placeholder="Loại vải, dịp mặc, yêu cầu riêng... Ảnh mẫu bạn gửi qua Zalo sau cũng được."
              value={form.ghi_chu}
              onChange={(e) => setForm((c) => ({ ...c, ghi_chu: e.target.value }))}
            />

            {loi && (
              <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
                {loi}
              </p>
            )}

            <div id="ket-qua" className="border-t border-slate-200 pt-5">
              <Button
                type="submit"
                co="lon"
                rongHet
                dangTai={gui.isPending}
                className="rounded-xl"
                iconPhai={!gui.isPending ? <ArrowRight className="size-4" /> : undefined}
              >
                {gui.isPending ? 'Đang gửi phiếu…' : 'Gửi phiếu cho tiệm'}
              </Button>
              <p className="mt-3 text-center text-xs text-slate-500">
                Phiếu đi thẳng vào phần mềm của tiệm. Không cần tài khoản, không cần mật khẩu.
              </p>
            </div>
          </form>
          </div>
          </LoDan>
        </div>
      </section>

      {/* Liên hệ */}
      <footer id="lien-he" className="border-t border-white/10 bg-brand-950 text-brand-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-3 sm:px-6">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Phone className="size-4 text-gold-400" /> Điện thoại &amp; Zalo
            </h3>
            {sdt ? (
              <p className="mt-2 select-all text-lg font-bold tabular-nums text-white">{sdt}</p>
            ) : (
              <p className="mt-2 text-sm">
                Chủ tiệm điền số trong mục <b className="text-white">Cài đặt</b> của phần mềm là số
                hiện ra ở đây.
              </p>
            )}
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <MapPin className="size-4 text-gold-400" /> Địa chỉ
            </h3>
            <p className="mt-2 text-sm">{t.diaChi || 'Chủ tiệm điền địa chỉ trong mục Cài đặt.'}</p>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-white">
              <Clock className="size-4 text-gold-400" /> Giờ mở cửa
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm">
              {t.gioMoCua || 'Chủ tiệm điền giờ mở cửa trong mục Cài đặt.'}
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5 text-xs text-brand-200/70 sm:px-6">
            <CalendarClock className="size-4 text-gold-400" />
            <span>{t.ten} — đặt may online, tiệm xác nhận trong ngày.</span>
            <Link to="/dang-nhap" className="ml-auto font-medium hover:text-white">
              Chủ tiệm đăng nhập
            </Link>
          </div>
        </div>
      </footer>

      <HopXemAnh ds={DS_ANH} viTri={anhDangXem} dat={setAnhDangXem} />
    </main>
  )
}
