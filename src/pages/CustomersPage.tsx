import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Phone, Search, Trash, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { chuCaiDau, dinhDangNgay, dinhDangTien } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import {
  useDanhSachKhachHang,
  useSuaKhachHang,
  useThemKhachHang,
  useXoaKhachHang,
  type LocCongNo,
} from '@/data/khachHang'
import type { GioiTinh, KhachHangDayDu, KhachHangNhap } from '@/types'

const RONG: KhachHangNhap = {
  ho_ten: '',
  so_dien_thoai: '',
  gioi_tinh: 'nam',
  ngay_sinh: null,
  dia_chi: null,
  ghi_chu: null,
}

export function CustomersPage() {
  const [thamSo, setThamSo] = useSearchParams()
  const [tuKhoa, setTuKhoa] = useState(thamSo.get('tim') ?? '')
  const [locCongNo, setLocCongNo] = useState<LocCongNo>('tat_ca')
  const [dangSua, setDangSua] = useState<KhachHangDayDu | null>(null)
  const [moForm, setMoForm] = useState(false)
  const [xoaKhach, setXoaKhach] = useState<KhachHangDayDu | null>(null)

  const { laQuanTri } = useAuth()
  const tb = useThongBao()
  const danhSach = useDanhSachKhachHang(tuKhoa, locCongNo)
  const xoa = useXoaKhachHang()

  // Đồng bộ ô tìm kiếm với địa chỉ trang (dùng cho ô tìm ở thanh trên)
  useEffect(() => {
    const tim = thamSo.get('tim')
    if (tim !== null && tim !== tuKhoa) setTuKhoa(tim)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thamSo])

  const doiTuKhoa = (v: string) => {
    setTuKhoa(v)
    if (thamSo.get('tim')) setThamSo({}, { replace: true })
  }

  const xacNhanXoa = async () => {
    if (!xoaKhach) return
    try {
      await xoa.mutateAsync(xoaKhach.id)
      tb.thanhCong(`Đã xóa khách hàng ${xoaKhach.ho_ten}.`)
      setXoaKhach(null)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  const ds = danhSach.data ?? []

  return (
    <div>
      <PageHeader
        tieuDe="Khách hàng"
        moTa={danhSach.data ? `${ds.length} khách hàng` : 'Đang tải…'}
        hanhDong={
          <Button
            iconTrai={<UserPlus className="size-4" />}
            onClick={() => {
              setDangSua(null)
              setMoForm(true)
            }}
          >
            Thêm khách hàng
          </Button>
        }
      />

      <Card>
        <CardHeader
          tieuDe="Danh sách khách hàng"
          hanhDong={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={tuKhoa}
                  onChange={(e) => doiTuKhoa(e.target.value)}
                  placeholder="Tìm tên, số điện thoại, mã khách…"
                  aria-label="Tìm khách hàng"
                  className="h-9 w-full rounded-lg bg-paper pr-3 pl-9 text-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <select
                value={locCongNo}
                onChange={(e) => setLocCongNo(e.target.value as LocCongNo)}
                aria-label="Lọc theo công nợ"
                className="h-9 cursor-pointer rounded-lg bg-paper px-3 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="tat_ca">Tất cả</option>
                <option value="con_no">Còn nợ</option>
                <option value="da_tra_du">Đã trả đủ</option>
              </select>
            </div>
          }
        />

        {danhSach.isLoading ? (
          <DangTaiBang />
        ) : danhSach.isError ? (
          <BaoLoi loi={danhSach.error} thuLai={() => void danhSach.refetch()} />
        ) : ds.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            tieuDe={tuKhoa || locCongNo !== 'tat_ca' ? 'Không tìm thấy khách nào' : 'Chưa có khách hàng'}
            moTa={
              tuKhoa || locCongNo !== 'tat_ca'
                ? 'Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc công nợ.'
                : 'Bấm "Thêm khách hàng" để lưu người khách đầu tiên của tiệm.'
            }
            hanhDong={
              tuKhoa || locCongNo !== 'tat_ca' ? (
                <Button
                  kieu="phu"
                  onClick={() => {
                    doiTuKhoa('')
                    setLocCongNo('tat_ca')
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setDangSua(null)
                    setMoForm(true)
                  }}
                >
                  Thêm khách hàng
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Bảng cho máy tính */}
            <div className="scrollbar-slim hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                    <th className="px-5 py-2.5 font-semibold">Khách hàng</th>
                    <th className="px-5 py-2.5 font-semibold">Điện thoại</th>
                    <th className="px-5 py-2.5 font-semibold">Khách từ</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Tổng chi tiêu</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Công nợ</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ds.map((k) => (
                    <tr key={k.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                            {chuCaiDau(k.ho_ten)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{k.ho_ten}</p>
                            <p className="text-xs text-slate-500">{k.ma_khach}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-slate-700">{k.so_dien_thoai}</td>
                      <td className="px-5 py-3 tabular-nums text-slate-600">
                        {dinhDangNgay(k.ngay_tao)}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-800">
                        {dinhDangTien(Number(k.tong_chi_tieu))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {Number(k.cong_no) > 0 ? (
                          <Badge className="bg-rose-100 text-rose-800 ring-rose-600/20">
                            {dinhDangTien(Number(k.cong_no))}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-600/20">
                            Đã trả đủ
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            kieu="mo"
                            co="nho"
                            aria-label={`Sửa ${k.ho_ten}`}
                            onClick={() => {
                              setDangSua(k)
                              setMoForm(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {laQuanTri && (
                            <Button
                              kieu="mo"
                              co="nho"
                              aria-label={`Xóa ${k.ho_ten}`}
                              className="text-rose-600 hover:bg-rose-50"
                              onClick={() => setXoaKhach(k)}
                            >
                              <Trash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thẻ cho điện thoại và máy tính bảng */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {ds.map((k) => (
                <li key={k.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                      {chuCaiDau(k.ho_ten)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{k.ho_ten}</p>
                          <p className="text-xs text-slate-500">{k.ma_khach}</p>
                        </div>
                        {Number(k.cong_no) > 0 ? (
                          <Badge className="bg-rose-100 text-rose-800 ring-rose-600/20">
                            Nợ {dinhDangTien(Number(k.cong_no))}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 ring-emerald-600/20">
                            Đã trả đủ
                          </Badge>
                        )}
                      </div>
                      {k.so_dien_thoai && (
                        <a
                          href={`tel:${k.so_dien_thoai.replace(/\s/g, '')}`}
                          className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-700"
                        >
                          <Phone className="size-3.5" />
                          {k.so_dien_thoai}
                        </a>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Tổng chi tiêu: {dinhDangTien(Number(k.tong_chi_tieu))}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          kieu="phu"
                          co="nho"
                          iconTrai={<Pencil className="size-3.5" />}
                          onClick={() => {
                            setDangSua(k)
                            setMoForm(true)
                          }}
                        >
                          Sửa
                        </Button>
                        {laQuanTri && (
                          <Button
                            kieu="mo"
                            co="nho"
                            className="text-rose-600"
                            iconTrai={<Trash className="size-3.5" />}
                            onClick={() => setXoaKhach(k)}
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <FormKhachHang
        moRa={moForm}
        dong={() => setMoForm(false)}
        khachDangSua={dangSua}
      />

      <HopThoaiXacNhan
        moRa={Boolean(xoaKhach)}
        tieuDe="Xóa khách hàng này?"
        noiDung={
          xoaKhach
            ? `Toàn bộ hồ sơ số đo của "${xoaKhach.ho_ten}" cũng bị xóa theo và không khôi phục được. ` +
              'Nếu khách đã có đơn hàng, phần mềm sẽ không cho xóa.'
            : ''
        }
        dangXuLy={xoa.isPending}
        dongY={xacNhanXoa}
        huy={() => setXoaKhach(null)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface FormProps {
  moRa: boolean
  dong: () => void
  khachDangSua: KhachHangDayDu | null
}

function FormKhachHang({ moRa, dong, khachDangSua }: FormProps) {
  const tb = useThongBao()
  const them = useThemKhachHang()
  const sua = useSuaKhachHang()
  const [form, setForm] = useState<KhachHangNhap>(RONG)
  const [loi, setLoi] = useState<Record<string, string>>({})

  // Nạp dữ liệu vào biểu mẫu mỗi khi mở
  useEffect(() => {
    if (!moRa) return
    setLoi({})
    if (khachDangSua) {
      setForm({
        ho_ten: khachDangSua.ho_ten,
        so_dien_thoai: khachDangSua.so_dien_thoai,
        gioi_tinh: khachDangSua.gioi_tinh,
        ngay_sinh: khachDangSua.ngay_sinh,
        dia_chi: khachDangSua.dia_chi,
        ghi_chu: khachDangSua.ghi_chu,
      })
    } else {
      setForm(RONG)
    }
  }, [moRa, khachDangSua])

  const dat = <K extends keyof KhachHangNhap>(khoa: K, giaTri: KhachHangNhap[K]) => {
    setForm((cu) => ({ ...cu, [khoa]: giaTri }))
    setLoi((cu) => ({ ...cu, [khoa]: '' }))
  }

  const kiemTra = (): boolean => {
    const l: Record<string, string> = {}
    if (!form.ho_ten.trim()) l.ho_ten = 'Bạn chưa nhập họ tên khách.'
    const sdt = form.so_dien_thoai.replace(/[\s.-]/g, '')
    if (!sdt) l.so_dien_thoai = 'Bạn chưa nhập số điện thoại.'
    else if (!/^0\d{8,10}$/.test(sdt))
      l.so_dien_thoai = 'Số điện thoại không hợp lệ. Ví dụ đúng: 0901234567'
    setLoi(l)
    return Object.keys(l).length === 0
  }

  const luu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kiemTra()) return

    const duLieu: KhachHangNhap = {
      ...form,
      ho_ten: form.ho_ten.trim(),
      so_dien_thoai: form.so_dien_thoai.replace(/[\s.-]/g, ''),
      dia_chi: form.dia_chi?.trim() || null,
      ghi_chu: form.ghi_chu?.trim() || null,
      ngay_sinh: form.ngay_sinh || null,
    }

    try {
      if (khachDangSua) {
        await sua.mutateAsync({ id: khachDangSua.id, nhap: duLieu })
        tb.thanhCong(`Đã cập nhật khách hàng ${duLieu.ho_ten}.`)
      } else {
        const kh = await them.mutateAsync(duLieu)
        tb.thanhCong(`Đã thêm khách hàng ${kh.ho_ten} (mã ${kh.ma_khach}).`)
      }
      dong()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  const dangLuu = them.isPending || sua.isPending

  return (
    <Modal
      moRa={moRa}
      dong={dong}
      tieuDe={khachDangSua ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
      moTa="Các ô có dấu * là bắt buộc"
      coLon="lon"
      chanTrang={
        <>
          <Button kieu="phu" onClick={dong} disabled={dangLuu}>
            Hủy
          </Button>
          <Button type="submit" form="form-khach-hang" dangTai={dangLuu}>
            {khachDangSua ? 'Lưu thay đổi' : 'Lưu khách hàng'}
          </Button>
        </>
      }
    >
      <form id="form-khach-hang" onSubmit={luu} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          nhan="Họ và tên"
          batBuoc
          value={form.ho_ten}
          onChange={(e) => dat('ho_ten', e.target.value)}
          loi={loi.ho_ten}
          placeholder="Nguyễn Văn An"
          autoFocus
        />
        <Input
          nhan="Số điện thoại"
          batBuoc
          type="tel"
          inputMode="tel"
          value={form.so_dien_thoai}
          onChange={(e) => dat('so_dien_thoai', e.target.value)}
          loi={loi.so_dien_thoai}
          placeholder="0901234567"
        />
        <Select
          nhan="Giới tính"
          value={form.gioi_tinh}
          onChange={(e) => dat('gioi_tinh', e.target.value as GioiTinh)}
        >
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
          <option value="khac">Khác</option>
        </Select>
        <Input
          nhan="Ngày sinh"
          type="date"
          value={form.ngay_sinh ?? ''}
          onChange={(e) => dat('ngay_sinh', e.target.value || null)}
        />
        <Input
          nhan="Địa chỉ"
          value={form.dia_chi ?? ''}
          onChange={(e) => dat('dia_chi', e.target.value)}
          placeholder="Số nhà, đường, quận, tỉnh/thành"
          boxClassName="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <Textarea
            nhan="Ghi chú"
            value={form.ghi_chu ?? ''}
            onChange={(e) => dat('ghi_chu', e.target.value)}
            placeholder="Sở thích, kiểu dáng ưa chuộng, lưu ý khi may…"
          />
        </div>
      </form>
    </Modal>
  )
}
