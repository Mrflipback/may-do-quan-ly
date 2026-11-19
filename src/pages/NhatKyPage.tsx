import { useMemo, useState } from 'react'
import {
  Banknote,
  ChevronDown,
  Download,
  Eraser,
  LogIn,
  Pencil,
  ScrollText,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import {
  BANG_LIEN_QUAN_TIEN,
  COT_LA_TIEN,
  MAU_HANH_DONG,
  NHAN_BANG_NHAT_KY,
  NHAN_COT,
  NHAN_HANH_DONG,
  NHAN_VAI_TRO,
} from '@/lib/constants'
import { chuCaiDau, cn, dinhDangSo, dinhDangTien } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { NhatKyDangNhap } from '@/components/NhatKyDangNhap'
import { useCaiDat, useDanhSachNguoiDung } from '@/data/heThong'
import {
  GIAI_THICH_HOAT_DONG,
  NHAN_DAU_HIEU_HOAT_DONG,
  docKhungGio,
  soiHoatDong,
  type DauHieuHoatDong,
} from '@/lib/dauHieuLa'
import {
  SO_DONG_MOI_TRANG,
  donNhatKyCu,
  taiNhatKyCsv,
  useNhatKy,
  useTongKetNhatKy,
  type BoLocNhatKy,
} from '@/data/nhatKy'
import type { NhatKy, VaiTro } from '@/types'

/* ------------------------------------------------------------------ */
/*  Tiện ích nhỏ                                                       */
/* ------------------------------------------------------------------ */

function ngayISO(lui = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - lui)
  return ngayDiaPhuong(d)
}

function gioPhut(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Ngày theo giờ địa phương, dạng yyyy-mm-dd.
 *
 * KHÔNG được dùng toISOString() ở đây. Hàm đó trả về ngày theo giờ quốc
 * tế, mà Việt Nam sớm hơn 7 tiếng — nên từ nửa đêm tới 7 giờ sáng, mọi
 * việc sẽ bị xếp nhầm sang hôm trước.
 */
function ngayDiaPhuong(d: Date): string {
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

function ngayDaiDong(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const chu = d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return ngayDiaPhuong(d) === ngayDiaPhuong(new Date()) ? `Hôm nay · ${chu}` : chu
}

/** Hiện một giá trị trong phần chi tiết cho người thường đọc được. */
function doiSangChu(cot: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '(trống)'
  if (typeof v === 'boolean') return v ? 'Có' : 'Không'
  if (COT_LA_TIEN.includes(cot) && !Number.isNaN(Number(v))) return dinhDangTien(Number(v))
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/* ------------------------------------------------------------------ */
/*  Một dòng nhật ký                                                   */
/* ------------------------------------------------------------------ */

function DongNhatKy({ d, dauHieu = [] }: { d: NhatKy; dauHieu?: DauHieuHoatDong[] }) {
  const [mo, setMo] = useState(false)

  const truoc = d.tien_truoc === null ? null : Number(d.tien_truoc)
  const sau = d.tien_sau === null ? null : Number(d.tien_sau)
  const lech = truoc !== null && sau !== null ? sau - truoc : null

  const cacCot = Object.entries(d.thay_doi ?? {})
  const laSua = d.hanh_dong === 'sua'

  return (
    <li data-dong="viec" className="px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="w-11 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-slate-400">
          {gioPhut(d.thoi_diem)}
        </span>

        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800"
          title={d.ten_nguoi}
        >
          {chuCaiDau(d.ten_nguoi)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-slate-900">{d.ten_nguoi}</span>
            <Badge className={MAU_HANH_DONG[d.hanh_dong]}>{NHAN_HANH_DONG[d.hanh_dong]}</Badge>
            {dauHieu.map((x) => (
              <Badge
                key={x}
                className="bg-rose-50 text-rose-700 ring-rose-600/20"
                title={GIAI_THICH_HOAT_DONG[x]}
              >
                {NHAN_DAU_HIEU_HOAT_DONG[x]}
              </Badge>
            ))}
            <span className="text-xs text-slate-400">
              {NHAN_BANG_NHAT_KY[d.bang] ?? d.bang}
            </span>
          </div>

          <p className="mt-0.5 text-sm text-slate-700">
            {d.mo_ta}
            {d.nhan && <span className="text-slate-500"> — {d.nhan}</span>}
          </p>

          {/* Tiền: hiện thật rõ, vì đây là thứ cần soi nhất */}
          {(truoc !== null || sau !== null) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
              {d.hanh_dong === 'xoa' && truoc !== null && (
                <span className="font-semibold text-rose-700">
                  − {dinhDangTien(truoc)} bị xoá khỏi sổ
                </span>
              )}
              {d.hanh_dong === 'them' && sau !== null && sau > 0 && (
                <span className="font-semibold text-emerald-700">+ {dinhDangTien(sau)}</span>
              )}
              {laSua && truoc !== null && sau !== null && (
                <>
                  <span className="text-slate-500 line-through">{dinhDangTien(truoc)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-900">{dinhDangTien(sau)}</span>
                  {lech !== null && lech !== 0 && (
                    <span
                      className={cn(
                        'font-semibold',
                        lech > 0 ? 'text-emerald-700' : 'text-rose-700',
                      )}
                    >
                      ({lech > 0 ? '+' : '−'}
                      {dinhDangTien(Math.abs(lech))})
                    </span>
                  )}
                </>
              )}
            </p>
          )}

          {cacCot.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setMo((v) => !v)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
              >
                <ChevronDown className={cn('size-3.5 transition-transform', mo && 'rotate-180')} />
                {mo ? 'Thu lại' : laSua ? `Xem ${cacCot.length} chỗ đã sửa` : 'Xem chi tiết'}
              </button>

              {mo && (
                <dl className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-xs ring-1 ring-slate-200">
                  {cacCot.map(([cot, gt]) => {
                    const doi = gt as { truoc?: unknown; sau?: unknown } | null
                    const laCapDoi =
                      doi !== null &&
                      typeof doi === 'object' &&
                      ('truoc' in doi || 'sau' in doi) &&
                      laSua
                    return (
                      <div key={cot} className="flex flex-wrap gap-x-2">
                        <dt className="w-32 shrink-0 text-slate-500">{NHAN_COT[cot] ?? cot}</dt>
                        <dd className="min-w-0 flex-1 text-slate-800">
                          {laCapDoi ? (
                            <>
                              <span className="text-slate-500 line-through">
                                {doiSangChu(cot, doi.truoc)}
                              </span>
                              <span className="mx-1.5 text-slate-400">→</span>
                              <span className="font-medium">{doiSangChu(cot, doi.sau)}</span>
                            </>
                          ) : (
                            doiSangChu(cot, gt)
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/*  Trang Nhật ký                                                      */
/* ------------------------------------------------------------------ */

export function NhatKyPage() {
  const tb = useThongBao()
  const { laQuanTri } = useAuth()
  const nhanSu = useDanhSachNguoiDung()

  const [loc, setLoc] = useState<BoLocNhatKy>({
    tuNgay: ngayISO(29),
    denNgay: ngayISO(0),
    nguoiId: '',
    hanhDong: 'tat_ca',
    bang: '',
    chiTien: false,
  })
  /* Hai thẻ: việc làm trên dữ liệu, và chuyện ra vào phần mềm.
     Thẻ đăng nhập chỉ Quản trị viên thấy — giờ giấc và IP của từng
     người là chuyện riêng tư, không để Quản lý xem. */
  const [the, setThe] = useState<'hoat_dong' | 'dang_nhap'>('hoat_dong')
  const [trang, setTrang] = useState(0)
  const [dangTaiFile, setDangTaiFile] = useState(false)
  const [hoiDon, setHoiDon] = useState(false)
  const [giuNgay, setGiuNgay] = useState('90')
  const [chiDangNgo, setChiDangNgo] = useState(false)

  const { data: caiDat } = useCaiDat()
  const khungGio = useMemo(() => docKhungGio(caiDat), [caiDat])

  const doiLoc = <K extends keyof BoLocNhatKy>(khoa: K, v: BoLocNhatKy[K]) => {
    setLoc((c) => ({ ...c, [khoa]: v }))
    setTrang(0)
  }

  const nhatKy = useNhatKy(loc, trang)
  const tongKet = useTongKetNhatKy(loc)

  const soTrang = Math.max(1, Math.ceil((nhatKy.data?.tong ?? 0) / SO_DONG_MOI_TRANG))

  /** Gom theo ngày để đọc như một cuốn sổ. */
  /**
   * Soi cả trang một lượt để tìm việc đáng nhìn kỹ.
   *
   * Phải soi TRÊN CẢ DANH SÁCH chứ không từng dòng: dấu hiệu "xoá nhiều
   * thứ liên tiếp" chỉ thấy được khi nhìn cả chuỗi.
   *
   * Chỉ soi trong TRANG ĐANG XEM. Một chuỗi xoá vắt qua hai trang thì
   * có thể không nhận ra — đổi lại không phải tải thêm gì.
   */
  const dauHieu = useMemo(
    () => soiHoatDong(nhatKy.data?.ds ?? [], khungGio),
    [nhatKy.data, khungGio],
  )

  const soDangNgo = dauHieu.size

  const theoNgay = useMemo(() => {
    const nhom = new Map<string, { d: NhatKy; dau: DauHieuHoatDong[] }[]>()
    ;(nhatKy.data?.ds ?? []).forEach((d, i) => {
      const dau = dauHieu.get(i) ?? []
      if (chiDangNgo && dau.length === 0) return
      // Gom theo ngày ở MÚI GIỜ CỦA TIỆM, không phải giờ quốc tế
      const ngay = ngayDiaPhuong(new Date(d.thoi_diem))
      const cu = nhom.get(ngay) ?? []
      cu.push({ d, dau })
      nhom.set(ngay, cu)
    })
    return [...nhom.entries()]
  }, [nhatKy.data, dauHieu, chiDangNgo])

  const taiFile = async () => {
    setDangTaiFile(true)
    try {
      const n = await taiNhatKyCsv(loc)
      tb.thanhCong(`Đã tải ${dinhDangSo(n)} dòng nhật ký ra file CSV.`)
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setDangTaiFile(false)
    }
  }

  const don = async () => {
    try {
      const n = await donNhatKyCu(Number(giuNgay))
      tb.thanhCong(`Đã dọn ${dinhDangSo(n)} dòng nhật ký cũ.`)
      await nhatKy.refetch()
      await tongKet.refetch()
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setHoiDon(false)
    }
  }

  const tk = tongKet.data

  return (
    <div>
      <PageHeader
        tieuDe="Nhật ký"
        moTa={
          the === 'hoat_dong'
            ? 'Ai đã làm gì, lúc nào, số tiền bao nhiêu — ghi tự động, không ai sửa được'
            : 'Ai vào phần mềm, lúc nào, từ địa chỉ nào — do máy chủ tự ghi'
        }
        hanhDong={
          the === 'hoat_dong' ? (
            <Button
              kieu="phu"
              iconTrai={<Download className="size-4" />}
              onClick={() => void taiFile()}
              dangTai={dangTaiFile}
            >
              Tải ra Excel
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------ Hai thẻ ------------------------------ */}
      {laQuanTri && (
        <div
          role="tablist"
          aria-label="Loại nhật ký"
          className="mb-5 inline-flex rounded-xl bg-slate-100 p-1"
        >
          {(
            [
              { ma: 'hoat_dong', nhan: 'Hoạt động', Hinh: ScrollText },
              { ma: 'dang_nhap', nhan: 'Đăng nhập', Hinh: LogIn },
            ] as const
          ).map(({ ma, nhan, Hinh }) => (
            <button
              key={ma}
              type="button"
              role="tab"
              data-the={ma}
              aria-selected={the === ma}
              onClick={() => setThe(ma)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                the === ma
                  ? 'bg-paper text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <Hinh className="size-4" />
              {nhan}
            </button>
          ))}
        </div>
      )}

      {the === 'dang_nhap' && laQuanTri && <NhatKyDangNhap />}

      {the === 'hoat_dong' && (
        <>

      {/* ----------------------------- Bộ lọc ----------------------------- */}
      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            nhan="Từ ngày"
            type="date"
            value={loc.tuNgay}
            onChange={(e) => doiLoc('tuNgay', e.target.value)}
          />
          <Input
            nhan="Đến ngày"
            type="date"
            value={loc.denNgay}
            onChange={(e) => doiLoc('denNgay', e.target.value)}
          />
          <Select
            nhan="Người làm"
            value={loc.nguoiId}
            onChange={(e) => doiLoc('nguoiId', e.target.value)}
          >
            <option value="">Tất cả mọi người</option>
            {(nhanSu.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.ho_ten}
              </option>
            ))}
          </Select>
          <Select
            nhan="Loại việc"
            value={loc.hanhDong}
            onChange={(e) => doiLoc('hanhDong', e.target.value as BoLocNhatKy['hanhDong'])}
          >
            <option value="tat_ca">Tất cả</option>
            <option value="them">Thêm mới</option>
            <option value="sua">Sửa</option>
            <option value="xoa">Xoá</option>
          </Select>
          <Select nhan="Mục" value={loc.bang} onChange={(e) => doiLoc('bang', e.target.value)}>
            <option value="">Tất cả các mục</option>
            {Object.entries(NHAN_BANG_NHAT_KY).map(([ma, ten]) => (
              <option key={ma} value={ma}>
                {ten}
              </option>
            ))}
          </Select>

          <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2 lg:col-span-5">
            <input
              type="checkbox"
              checked={loc.chiTien}
              onChange={(e) => doiLoc('chiTien', e.target.checked)}
              className="size-4 accent-brand-700"
            />
            <span className="text-sm text-slate-700">
              Chỉ xem việc có dính tới <b>tiền và số lượng</b>
              <span className="text-slate-500">
                {' '}
                ({BANG_LIEN_QUAN_TIEN.map((b) => NHAN_BANG_NHAT_KY[b]).join(', ')})
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2 lg:col-span-5">
            <input
              type="checkbox"
              checked={chiDangNgo}
              onChange={(e) => setChiDangNgo(e.target.checked)}
              data-loc="chi-dang-ngo"
              className="size-4 accent-rose-600"
            />
            <span className="text-sm text-slate-700">
              Chỉ xem <b>việc đáng nhìn kỹ</b>
              {soDangNgo > 0 && (
                <span className="ml-1.5 font-semibold text-rose-700">({soDangNgo})</span>
              )}
              <span className="text-slate-500"> — trong trang đang xem</span>
            </span>
          </label>
        </CardBody>
      </Card>

      {/* ----------------------------- Tổng kết ----------------------------- */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          nhan="Tiền khách trả đã ghi"
          giaTri={tk ? dinhDangTien(tk.tienThu) : '…'}
          icon={<Banknote className="size-5" />}
          mauIcon="bg-emerald-50 text-emerald-700"
          chuThich="Các khoản thu được thêm trong kỳ"
        />
        <StatCard
          nhan="Tiền bị xoá khỏi sổ"
          giaTri={tk ? dinhDangTien(tk.tienXoa) : '…'}
          icon={<Trash2 className="size-5" />}
          mauIcon={
            tk && tk.tienXoa > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
          }
          chuThich="Khoản thu đã ghi rồi lại bị xoá"
        />
        <StatCard
          nhan="Số lần sửa tiền"
          giaTri={tk ? dinhDangSo(tk.soLanSuaTien) : '…'}
          icon={<Pencil className="size-5" />}
          mauIcon="bg-amber-50 text-amber-700"
          chuThich="Sửa lại khoản khách đã trả"
        />
        <StatCard
          nhan="Việc đáng nhìn kỹ"
          giaTri={dinhDangSo(soDangNgo)}
          icon={<TriangleAlert className="size-5" />}
          mauIcon={soDangNgo > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}
          chuThich={`Trong trang đang xem · ${dinhDangSo(tk?.soLanSuaSoLuong ?? 0)} lần sửa số lượng`}
        />
      </div>

      {tk?.chiTinhMotPhan && (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
          Kỳ này nhiều việc quá nên bốn con số trên chỉ tính trên 3.000 dòng gần nhất. Thu hẹp
          khoảng ngày lại để có con số đúng tuyệt đối.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_20rem]">
        {/* ----------------------------- Danh sách ----------------------------- */}
        <Card>
          <CardHeader
            tieuDe="Dòng thời gian"
            moTa={
              nhatKy.data
                ? `${dinhDangSo(nhatKy.data.tong)} việc trong khoảng đã chọn`
                : 'Đang tải…'
            }
          />
          {nhatKy.isLoading ? (
            <DangTaiBang soDong={6} />
          ) : nhatKy.isError ? (
            <BaoLoi loi={nhatKy.error} thuLai={() => void nhatKy.refetch()} />
          ) : theoNgay.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="size-6" />}
              tieuDe="Chưa có việc nào trong khoảng này"
              moTa="Nhật ký chỉ ghi từ lúc bạn chạy file supabase/08_nhat_ky.sql trở đi. Thử nới rộng khoảng ngày, hoặc bỏ bớt bộ lọc."
            />
          ) : (
            <>
              {theoNgay.map(([ngay, ds]) => (
                <div key={ngay}>
                  <p className="sticky top-16 z-10 border-y border-slate-200/80 bg-slate-50/95 px-4 py-2 text-xs font-semibold text-slate-600 backdrop-blur sm:px-5">
                    {ngayDaiDong(ds[0].d.thoi_diem)} · {ds.length} việc
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {ds.map((x) => (
                      <DongNhatKy key={x.d.id} d={x.d} dauHieu={x.dau} />
                    ))}
                  </ul>
                </div>
              ))}

              {soTrang > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
                  <Button
                    kieu="phu"
                    co="nho"
                    disabled={trang === 0}
                    onClick={() => setTrang((t) => Math.max(0, t - 1))}
                  >
                    Trang trước
                  </Button>
                  <span className="text-xs text-slate-500">
                    Trang {trang + 1} / {soTrang}
                  </span>
                  <Button
                    kieu="phu"
                    co="nho"
                    disabled={trang + 1 >= soTrang}
                    onClick={() => setTrang((t) => t + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ----------------------------- Theo từng người ----------------------------- */}
        <div className="space-y-5">
          <Card>
            <CardHeader tieuDe="Theo từng người" moTa="Trong khoảng ngày đang xem" />
            {tongKet.isLoading ? (
              <DangTaiBang soDong={3} />
            ) : !tk || tk.theoNguoi.length === 0 ? (
              <CardBody>
                <p className="text-sm text-slate-500">Chưa có việc nào.</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-slate-100">
                {tk.theoNguoi.map((n) => (
                  <li key={n.nguoiId ?? n.tenNguoi} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                      {chuCaiDau(n.tenNguoi)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{n.tenNguoi}</p>
                      <p className="text-xs text-slate-500">
                        {dinhDangSo(n.soViec)} việc
                        {n.soLanXoa > 0 && ` · ${dinhDangSo(n.soLanXoa)} lần xoá`}
                      </p>
                      {n.tienDaXoa > 0 && (
                        <p className="text-xs font-semibold text-rose-700">
                          − {dinhDangTien(n.tienDaXoa)} xoá khỏi sổ
                        </p>
                      )}
                    </div>
                    {n.vaiTro && NHAN_VAI_TRO[n.vaiTro as VaiTro] && (
                      <Badge>{NHAN_VAI_TRO[n.vaiTro as VaiTro]}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader tieuDe="Nhật ký ghi thế nào" />
            <CardBody className="space-y-2.5 text-sm text-slate-600">
              <p className="flex gap-2.5">
                <Users className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <span>
                  Nhật ký được ghi ở <b>tầng cơ sở dữ liệu</b>, không phải trong phần mềm. Mọi
                  đường đi tới dữ liệu đều bị ghi lại.
                </span>
              </p>
              <p className="flex gap-2.5">
                <ScrollText className="mt-0.5 size-4 shrink-0 text-brand-600" />
                <span>
                  <b>Không ai sửa hay xoá được từng dòng</b>, kể cả Quản trị viên. Chỉ Quản trị viên
                  và Quản lý mới xem được trang này.
                </span>
              </p>
              <p className="flex gap-2.5">
                <Eraser className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <span>
                  Chỉ dọn được nhật ký <b>cũ</b> theo ngày, và chính việc dọn cũng bị ghi lại một
                  dòng.
                </span>
              </p>
            </CardBody>
          </Card>

          {laQuanTri && (
            <Card>
              <CardHeader tieuDe="Dọn nhật ký cũ" moTa="Cho nhẹ cơ sở dữ liệu" />
              <CardBody className="space-y-3">
                <Select
                  nhan="Giữ lại nhật ký trong"
                  value={giuNgay}
                  onChange={(e) => setGiuNgay(e.target.value)}
                >
                  <option value="90">90 ngày gần nhất</option>
                  <option value="180">180 ngày gần nhất</option>
                  <option value="365">1 năm gần nhất</option>
                  <option value="730">2 năm gần nhất</option>
                </Select>
                <p className="text-xs text-slate-500">
                  Nên tải nhật ký ra file Excel trước khi dọn. Phần mềm không cho giữ dưới 30 ngày.
                </p>
                <Button
                  kieu="phu"
                  iconTrai={<Eraser className="size-4" />}
                  onClick={() => setHoiDon(true)}
                >
                  Dọn nhật ký cũ hơn
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
        </>
      )}

      <HopThoaiXacNhan
        moRa={hoiDon}
        tieuDe="Dọn nhật ký cũ?"
        noiDung={`Mọi dòng nhật ký cũ hơn ${giuNgay} ngày sẽ bị xoá vĩnh viễn. Việc dọn này cũng được ghi lại một dòng trong nhật ký.`}
        nhanDongY="Dọn nhật ký"
        dongY={() => void don()}
        huy={() => setHoiDon(false)}
      />
    </div>
  )
}
