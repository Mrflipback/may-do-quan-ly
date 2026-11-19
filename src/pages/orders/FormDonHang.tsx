import { useEffect, useRef, useState } from 'react'
import { Plus, Trash } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { useDanhSachTho } from '@/data/thoMay'
import { useThongBao } from '@/components/ui/ThongBao'
import { NHAN_LOAI_TRANG_PHUC, NHAN_TRANG_THAI } from '@/lib/constants'
import { dinhDangTien, ngayCongThem, ngayHomNay } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useKhachHangRutGon } from '@/data/khachHang'
import { useDanhSachSoDo } from '@/data/soDo'
import { useDongSanPham, useLuuDonHang } from '@/data/donHang'
import type {
  DongSanPhamNhap,
  DonHangDayDu,
  DonHangNhap,
  LoaiTrangPhuc,
  TrangThaiDonHang,
} from '@/types'

const HOM_NAY = () => ngayHomNay()
const SAU_14_NGAY = () =>
  ngayCongThem(14)

const DONG_RONG = (): DongSanPhamNhap => ({
  ten_san_pham: '',
  loai: 'ao_so_mi',
  so_luong: 1,
  don_gia: 0,
  ghi_chu: null,
})

interface Props {
  moRa: boolean
  dong: () => void
  donDangSua: DonHangDayDu | null
  /** Chọn sẵn khách hàng khi tạo đơn từ trang khách hàng. */
  khachMacDinh?: string | null
}

export function FormDonHang({ moRa, dong, donDangSua, khachMacDinh }: Props) {
  const tb = useThongBao()
  const khachHang = useKhachHangRutGon()
  const luuDon = useLuuDonHang()

  const [khachId, setKhachId] = useState('')
  const [soDoId, setSoDoId] = useState<string>('')
  const [ngayNhan, setNgayNhan] = useState(HOM_NAY())
  const [ngayHenGiao, setNgayHenGiao] = useState(SAU_14_NGAY())
  const [trangThai, setTrangThai] = useState<TrangThaiDonHang>('moi')
  const [thoId, setThoId] = useState('')
  // Chỉ thợ đang làm việc mới hiện ra để chọn. Thợ đã nghỉ vẫn giữ
  // nguyên trên những đơn cũ, chỉ là không gán thêm đơn mới được.
  const dsTho = useDanhSachTho(false)
  const [giamGia, setGiamGia] = useState('0')
  const [ghiChu, setGhiChu] = useState('')
  const [dongSP, setDongSP] = useState<DongSanPhamNhap[]>([DONG_RONG()])

  const soDoCuaKhach = useDanhSachSoDo(khachId || null)
  const dongCu = useDongSanPham(donDangSua?.id ?? null)

  // Hai cờ này bảo đảm biểu mẫu chỉ được nạp MỘT LẦN mỗi lần mở.
  // Nếu không, dữ liệu nền làm mới sẽ xóa mất những gì đang gõ dở.
  const daNapRef = useRef(false)
  const daNapDongRef = useRef(false)

  useEffect(() => {
    if (!moRa) {
      daNapRef.current = false
      daNapDongRef.current = false
      return
    }
    if (daNapRef.current) return
    daNapRef.current = true

    if (donDangSua) {
      setKhachId(donDangSua.khach_hang_id)
      setSoDoId(donDangSua.ho_so_so_do_id ?? '')
      setNgayNhan(donDangSua.ngay_nhan)
      setNgayHenGiao(donDangSua.ngay_hen_giao)
      setTrangThai(donDangSua.trang_thai)
      setThoId(donDangSua.tho_may_id ?? '')
      setGiamGia(String(Number(donDangSua.giam_gia) || 0))
      setGhiChu(donDangSua.ghi_chu ?? '')
    } else {
      setKhachId(khachMacDinh ?? '')
      setSoDoId('')
      setNgayNhan(HOM_NAY())
      setNgayHenGiao(SAU_14_NGAY())
      setTrangThai('moi')
      setThoId('')
      setGiamGia('0')
      setGhiChu('')
      setDongSP([DONG_RONG()])
      daNapDongRef.current = true
    }
  }, [moRa, donDangSua, khachMacDinh])

  // Nạp dòng sản phẩm cũ khi sửa đơn, cũng chỉ một lần
  useEffect(() => {
    if (!moRa || !donDangSua || daNapDongRef.current) return
    if (!dongCu.data) return
    daNapDongRef.current = true

    setDongSP(
      dongCu.data.length > 0
        ? dongCu.data.map((d) => ({
            ten_san_pham: d.ten_san_pham,
            loai: d.loai,
            so_luong: Number(d.so_luong),
            don_gia: Number(d.don_gia),
            ghi_chu: d.ghi_chu,
          }))
        : [DONG_RONG()],
    )
  }, [moRa, donDangSua, dongCu.data])

  const doiDong = <K extends keyof DongSanPhamNhap>(
    i: number,
    khoa: K,
    giaTri: DongSanPhamNhap[K],
  ) => {
    setDongSP((cu) => cu.map((d, idx) => (idx === i ? { ...d, [khoa]: giaTri } : d)))
  }

  const tongHang = dongSP.reduce(
    (s, d) => s + (Number(d.so_luong) || 0) * (Number(d.don_gia) || 0),
    0,
  )
  const soGiamGia = Number(giamGia) || 0
  const thanhTien = Math.max(0, tongHang - soGiamGia)

  const luu = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!khachId) return tb.loi('Bạn chưa chọn khách hàng.')
    if (ngayHenGiao < ngayNhan) return tb.loi('Ngày hẹn giao không được sớm hơn ngày nhận đơn.')

    const dongSach = dongSP
      .map((d) => ({
        ...d,
        ten_san_pham: d.ten_san_pham.trim(),
        so_luong: Number(d.so_luong) || 0,
        don_gia: Number(d.don_gia) || 0,
        ghi_chu: d.ghi_chu?.trim() || null,
      }))
      .filter((d) => d.ten_san_pham.length > 0)

    if (dongSach.length === 0) return tb.loi('Đơn hàng phải có ít nhất một sản phẩm có tên.')

    for (const d of dongSach) {
      if (d.so_luong <= 0) return tb.loi(`Số lượng của "${d.ten_san_pham}" phải lớn hơn 0.`)
      if (d.don_gia < 0) return tb.loi(`Đơn giá của "${d.ten_san_pham}" không được âm.`)
    }

    if (soGiamGia < 0) return tb.loi('Giảm giá không được là số âm.')
    if (soGiamGia > tongHang) return tb.loi('Giảm giá không được lớn hơn tổng tiền hàng.')

    const don: DonHangNhap = {
      khach_hang_id: khachId,
      ho_so_so_do_id: soDoId || null,
      ngay_nhan: ngayNhan,
      ngay_hen_giao: ngayHenGiao,
      trang_thai: trangThai,
      giam_gia: soGiamGia,
      ghi_chu: ghiChu.trim() || null,
      tho_may_id: thoId || null,
    }

    try {
      await luuDon.mutateAsync({
        id: donDangSua?.id ?? null,
        don,
        dongSanPham: dongSach,
      })
      tb.thanhCong(donDangSua ? 'Đã lưu thay đổi đơn hàng.' : 'Đã tạo đơn hàng mới.')
      dong()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <Modal
      moRa={moRa}
      dong={dong}
      tieuDe={donDangSua ? `Sửa đơn ${donDangSua.ma_don}` : 'Tạo đơn hàng mới'}
      moTa="Một đơn có thể gồm nhiều sản phẩm"
      coLon="rongHet"
      chanTrang={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Thành tiền:{' '}
            <span className="text-base font-bold text-slate-900">{dinhDangTien(thanhTien)}</span>
          </p>
          <div className="flex gap-2">
            <Button kieu="phu" onClick={dong} disabled={luuDon.isPending}>
              Hủy
            </Button>
            <Button type="submit" form="form-don-hang" dangTai={luuDon.isPending}>
              {donDangSua ? 'Lưu thay đổi' : 'Tạo đơn hàng'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="form-don-hang" onSubmit={luu} className="space-y-6">
        {/* Thông tin chung */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            nhan="Khách hàng"
            batBuoc
            value={khachId}
            onChange={(e) => {
              setKhachId(e.target.value)
              setSoDoId('')
            }}
          >
            <option value="">— Chọn khách hàng —</option>
            {(khachHang.data ?? []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.ho_ten} — {k.so_dien_thoai}
              </option>
            ))}
          </Select>

          <Select
            nhan="Hồ sơ số đo"
            value={soDoId}
            onChange={(e) => setSoDoId(e.target.value)}
            goiY={
              (soDoCuaKhach.data?.length ?? 0) === 0 && khachId
                ? 'Khách này chưa có lần đo nào.'
                : undefined
            }
          >
            <option value="">— Không gắn hồ sơ đo —</option>
            {(soDoCuaKhach.data ?? []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.ten_ho_so} ({h.ngay_do})
              </option>
            ))}
          </Select>

          <Select
            nhan="Trạng thái"
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value as TrangThaiDonHang)}
          >
            {(Object.keys(NHAN_TRANG_THAI) as TrangThaiDonHang[]).map((t) => (
              <option key={t} value={t}>
                {NHAN_TRANG_THAI[t]}
              </option>
            ))}
          </Select>

          <Select
            nhan="Thợ may"
            value={thoId}
            onChange={(e) => setThoId(e.target.value)}
            goiY={
              (dsTho.data ?? []).length === 0
                ? 'Chưa có thợ nào. Thêm ở mục Thợ may trên thanh menu.'
                : 'Để trống cũng được, gán sau cũng được.'
            }
          >
            <option value="">— chưa phân công —</option>
            {(dsTho.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.ho_ten}
              </option>
            ))}
          </Select>

          <Input
            nhan="Ngày nhận đơn"
            batBuoc
            type="date"
            value={ngayNhan}
            onChange={(e) => setNgayNhan(e.target.value)}
          />
          <Input
            nhan="Ngày hẹn giao"
            batBuoc
            type="date"
            value={ngayHenGiao}
            onChange={(e) => setNgayHenGiao(e.target.value)}
            loi={ngayHenGiao < ngayNhan ? 'Không được sớm hơn ngày nhận đơn.' : undefined}
          />
          <Input
            nhan="Giảm giá (đồng)"
            type="number"
            min="0"
            step="1000"
            inputMode="numeric"
            value={giamGia}
            onChange={(e) => setGiamGia(e.target.value)}
          />
        </div>

        {/* Dòng sản phẩm */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Sản phẩm trong đơn</h3>
            <Button
              type="button"
              kieu="phu"
              co="nho"
              iconTrai={<Plus className="size-3.5" />}
              onClick={() => setDongSP((cu) => [...cu, DONG_RONG()])}
            >
              Thêm sản phẩm
            </Button>
          </div>

          <div className="space-y-3">
            {dongSP.map((d, i) => (
              <div
                key={i}
                className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 sm:p-4"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
                  <div className="col-span-2 sm:col-span-4">
                    <Input
                      nhan="Tên sản phẩm"
                      value={d.ten_san_pham}
                      onChange={(e) => doiDong(i, 'ten_san_pham', e.target.value)}
                      placeholder="Vest 2 khuy xanh navy"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Select
                      nhan="Loại"
                      value={d.loai}
                      onChange={(e) => doiDong(i, 'loai', e.target.value as LoaiTrangPhuc)}
                    >
                      {(Object.keys(NHAN_LOAI_TRANG_PHUC) as LoaiTrangPhuc[]).map((l) => (
                        <option key={l} value={l}>
                          {NHAN_LOAI_TRANG_PHUC[l]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      nhan="Số lượng"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={d.so_luong}
                      onChange={(e) => doiDong(i, 'so_luong', Number(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      nhan="Đơn giá"
                      type="number"
                      min="0"
                      step="1000"
                      inputMode="numeric"
                      value={d.don_gia}
                      onChange={(e) => doiDong(i, 'don_gia', Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-end justify-end pb-1.5 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() =>
                        setDongSP((cu) =>
                          cu.length === 1 ? [DONG_RONG()] : cu.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Xóa dòng sản phẩm"
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    value={d.ghi_chu ?? ''}
                    onChange={(e) => doiDong(i, 'ghi_chu', e.target.value)}
                    placeholder="Ghi chú riêng cho sản phẩm này (không bắt buộc)"
                    className="h-9 min-w-0 flex-1 rounded-lg bg-paper px-3 text-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <p className="text-sm font-semibold tabular-nums text-slate-700">
                    {dinhDangTien((Number(d.so_luong) || 0) * (Number(d.don_gia) || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tổng kết */}
        <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Tổng tiền hàng</span>
            <span className="tabular-nums text-slate-900">{dinhDangTien(tongHang)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Giảm giá</span>
            <span className="tabular-nums text-slate-900">− {dinhDangTien(soGiamGia)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-1.5 text-base font-bold">
            <span>Thành tiền</span>
            <span className="tabular-nums text-brand-800">{dinhDangTien(thanhTien)}</span>
          </div>
        </div>

        <Textarea
          nhan="Ghi chú cho cả đơn"
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          placeholder="Ví dụ: khách dặn may gấp trước ngày cưới…"
        />
      </form>
    </Modal>
  )
}
