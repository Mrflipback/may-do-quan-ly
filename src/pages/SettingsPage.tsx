import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Download, ShieldCheck, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CaiDatTrangWeb } from '@/components/CaiDatTrangWeb'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Field'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { useThongBao } from '@/components/ui/ThongBao'
import {
  HopThoaiXoaCanMatKhau,
  TheMatKhauXoa,
} from '@/components/MatKhauXoa'
import { MO_TA_VAI_TRO, NHAN_VAI_TRO } from '@/lib/constants'
import { chuCaiDau, dinhDangNgay, dinhDangSo } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { taiBanSaoLuu } from '@/data/saoLuu'
import { KhoiPhucDuLieu } from '@/components/KhoiPhucDuLieu'
import { TheKhoaManHinh } from '@/components/TheKhoaManHinh'
import { TheGioDem } from '@/components/TheGioDem'
import { TheBanChupKhan } from '@/components/TheBanChupKhan'
import { TheDatLaiCaiDat, TheMatKhauDatLai } from '@/components/TheDatLaiCaiDat'
import {
  useCaiDat,
  useDanhSachNguoiDung,
  useDoiVaiTro,
  useLuuCaiDat,
} from '@/data/heThong'
import { useMatKhauXoa, useXoaTaiKhoan } from '@/data/matKhauXoa'
import { cauLoi } from '@/lib/matKhauXoa'
import type { NguoiDung, VaiTro } from '@/types'

export function SettingsPage() {
  const tb = useThongBao()
  const { hoSo, taiLaiHoSo, dangXuat } = useAuth()
  const dieuHuong = useNavigate()
  const matKhauXoa = useMatKhauXoa()

  const caiDat = useCaiDat()
  const luuCaiDat = useLuuCaiDat()
  const nhanSu = useDanhSachNguoiDung()
  const doiVaiTro = useDoiVaiTro()
  const xoaNguoiDung = useXoaTaiKhoan()
  const [nguoiXoa, setNguoiXoa] = useState<NguoiDung | null>(null)
  /** Câu báo sai mật khẩu do máy chủ trả về, để hộp thoại hiện lên. */
  const [loiMatKhau, setLoiMatKhau] = useState('')

  /**
   * Xoá một tài khoản khỏi tiệm.
   *
   * Xoá chính mình cũng được — xoá xong thì đăng xuất luôn, vì hồ sơ không
   * còn nên có ở lại cũng chẳng xem được gì. Riêng Quản trị viên CUỐI CÙNG
   * thì cơ sở dữ liệu chặn lại, để tiệm không bị khoá ngoài cửa.
   */
  async function xoaTaiKhoan(matKhau: string) {
    const u = nguoiXoa
    if (!u) return
    const laChinhMinh = u.id === hoSo?.id
    setLoiMatKhau('')
    try {
      const kq = await xoaNguoiDung.mutateAsync({ id: u.id, matKhau })

      // Sai mật khẩu KHÔNG phải lỗi — máy chủ trả về ok:false. Giữ hộp
      // thoại mở cho người dùng gõ lại, đừng đóng đi.
      if (!kq.ok) return setLoiMatKhau(cauLoi(kq))

      if (Number(kq.so_dong ?? 0) === 0) {
        tb.loi(
          'Không xoá được. Có thể đây là Quản trị viên cuối cùng — cơ sở dữ liệu giữ lại ít nhất một người để tiệm không bị khoá ngoài cửa.',
        )
        setNguoiXoa(null)
        return
      }
      setNguoiXoa(null)
      if (laChinhMinh) {
        tb.tin('Đã xoá tài khoản của bạn khỏi tiệm. Đang đăng xuất…')
        await dangXuat()
        dieuHuong('/dang-nhap', { replace: true })
        return
      }
      tb.thanhCong(`Đã xoá tài khoản ${u.ho_ten} khỏi tiệm.`)
    } catch (e) {
      tb.loi(dichLoi(e))
      setNguoiXoa(null)
    }
  }

  const [form, setForm] = useState({
    ten_tiem: '',
    khau_hieu: '',
    dien_thoai: '',
    dia_chi: '',
  })
  const [dangSaoLuu, setDangSaoLuu] = useState(false)

  useEffect(() => {
    if (caiDat.data) {
      setForm({
        ten_tiem: caiDat.data.ten_tiem ?? '',
        khau_hieu: caiDat.data.khau_hieu ?? '',
        dien_thoai: caiDat.data.dien_thoai ?? '',
        dia_chi: caiDat.data.dia_chi ?? '',
      })
    }
  }, [caiDat.data])

  const luuThongTin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ten_tiem.trim()) return tb.loi('Bạn chưa nhập tên tiệm.')
    try {
      await luuCaiDat.mutateAsync({
        ten_tiem: form.ten_tiem.trim(),
        khau_hieu: form.khau_hieu.trim(),
        dien_thoai: form.dien_thoai.trim(),
        dia_chi: form.dia_chi.trim(),
      })
      tb.thanhCong('Đã lưu thông tin tiệm. Thông tin này sẽ in lên các phiếu.')
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  const capNhatVaiTro = async (id: string, vaiTro: VaiTro, ten: string) => {
    try {
      await doiVaiTro.mutateAsync({ id, vaiTro })
      tb.thanhCong(`${ten} giờ là ${NHAN_VAI_TRO[vaiTro]}.`)
      if (id === hoSo?.id) await taiLaiHoSo()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  const saoLuu = async () => {
    setDangSaoLuu(true)
    try {
      const kq = await taiBanSaoLuu()
      tb.thanhCong(`Đã tải ${kq.tenFile} (${dinhDangSo(kq.soDong)} dòng dữ liệu).`)
    } catch (err) {
      tb.loi(dichLoi(err))
    } finally {
      setDangSaoLuu(false)
    }
  }

  return (
    <div>
      <PageHeader tieuDe="Cài đặt" moTa="Thông tin tiệm, tài khoản nhân viên và sao lưu dữ liệu" />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Thông tin tiệm */}
        <Card>
          <CardHeader tieuDe="Thông tin tiệm may" moTa="Thông tin này in lên tất cả các phiếu" />
          {caiDat.isLoading ? (
            <DangTaiBang soDong={4} />
          ) : caiDat.isError ? (
            <BaoLoi loi={caiDat.error} thuLai={() => void caiDat.refetch()} />
          ) : (
            <CardBody>
              <form onSubmit={luuThongTin} className="space-y-4">
                <Input
                  nhan="Tên tiệm"
                  batBuoc
                  value={form.ten_tiem}
                  onChange={(e) => setForm((c) => ({ ...c, ten_tiem: e.target.value }))}
                  placeholder="NHÀ MAY QUANG ANH"
                />
                <Input
                  nhan="Khẩu hiệu"
                  value={form.khau_hieu}
                  onChange={(e) => setForm((c) => ({ ...c, khau_hieu: e.target.value }))}
                  placeholder="Nhà may cao cấp"
                />
                <Input
                  nhan="Số điện thoại"
                  type="tel"
                  value={form.dien_thoai}
                  onChange={(e) => setForm((c) => ({ ...c, dien_thoai: e.target.value }))}
                  placeholder="028 1234 5678"
                />
                <Textarea
                  nhan="Địa chỉ"
                  value={form.dia_chi}
                  onChange={(e) => setForm((c) => ({ ...c, dia_chi: e.target.value }))}
                  placeholder="Số nhà, đường, phường, quận, tỉnh/thành"
                />
                <Button type="submit" dangTai={luuCaiDat.isPending}>
                  Lưu thông tin
                </Button>
              </form>
            </CardBody>
          )}
        </Card>

        <CaiDatTrangWeb />

        <div className="space-y-5">
          {/* Nhân sự & phân quyền */}
          <Card>
            <CardHeader
              tieuDe="Tài khoản & phân quyền"
              moTa={nhanSu.data ? `${nhanSu.data.length} tài khoản` : 'Đang tải…'}
            />
            {nhanSu.isLoading ? (
              <DangTaiBang soDong={3} />
            ) : nhanSu.isError ? (
              <BaoLoi loi={nhanSu.error} thuLai={() => void nhanSu.refetch()} />
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {nhanSu.data!.map((u) => {
                    const laToi = u.id === hoSo?.id
                    return (
                      <li key={u.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                          {chuCaiDau(u.ho_ten)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {u.ho_ten}
                            {laToi && (
                              <span className="ml-1.5 text-xs font-normal text-slate-500">
                                (bạn)
                              </span>
                            )}
                          </p>
                          {/* Chỉ hiện email của chính mình. Email người khác là thông tin riêng. */}
                          {laToi && (
                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            Tham gia {dinhDangNgay(u.ngay_tao)}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                            {MO_TA_VAI_TRO[u.vai_tro]}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <select
                            value={u.vai_tro}
                            onChange={(e) =>
                              capNhatVaiTro(u.id, e.target.value as VaiTro, u.ho_ten)
                            }
                            aria-label={`Vai trò của ${u.ho_ten}`}
                            className="h-8 cursor-pointer rounded-lg bg-paper px-2 text-xs font-medium ring-1 ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          >
                            <option value="nhan_vien">Nhân viên</option>
                            <option value="quan_ly">Quản lý</option>
                            <option value="quan_tri">Quản trị viên</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setNguoiXoa(u)}
                            aria-label={
                              laToi ? 'Xoá tài khoản của tôi' : `Xoá tài khoản ${u.ho_ten}`
                            }
                            title={
                              laToi
                                ? 'Xoá tài khoản của chính bạn khỏi tiệm'
                                : 'Xoá tài khoản khỏi tiệm'
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div className="border-t border-slate-100 px-5 py-3.5">
                  <div className="space-y-2 text-xs text-slate-500">
                    <p>
                      Nhân viên mới tự tạo tài khoản ở trang đăng nhập (mục “Tạo tài khoản
                      mới”). Sau đó bạn vào đây nâng quyền nếu cần.
                    </p>
                    <p>
                      Bấm biểu tượng thùng rác để xoá tài khoản khỏi tiệm — kể cả tài khoản
                      Quản trị viên, kể cả tài khoản của chính bạn. Phần mềm sẽ hỏi{' '}
                      <strong>mật khẩu xoá tài khoản</strong> trước khi làm thật.
                    </p>
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-600/20">
                      Chỉ có một việc phần mềm không cho làm:{' '}
                      <strong>xoá hoặc hạ quyền người Quản trị viên cuối cùng</strong>. Muốn làm
                      vậy thì cấp quyền Quản trị viên cho một người khác trước đã, nếu
                      không cả tiệm sẽ không còn ai quản lý được.
                    </p>
                    <p>
                      Người bị xoá mất quyền vào phần mềm ngay, nhưng email đăng nhập vẫn
                      còn trong Supabase &rsaquo; Authentication &rsaquo; Users nếu bạn muốn xoá hẳn.
                    </p>
                  </div>
                </div>
              </>
            )}
          </Card>

          <TheMatKhauXoa />

          <TheKhoaManHinh />

          <TheGioDem />

          <TheBanChupKhan />

          <TheMatKhauDatLai />

          <TheDatLaiCaiDat />

          {/* Bảo mật */}
          <Card>
            <CardHeader tieuDe="Bảo mật dữ liệu" />
            <CardBody className="space-y-3">
              <div className="flex gap-3">
                <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Row Level Security đang bật
                  </p>
                  <p className="text-sm text-slate-500">
                    Chưa đăng nhập thì không đọc được bất kỳ dữ liệu nào. Nhân viên xem và nhập
                    liệu được nhưng không xóa được, cũng không xem được báo cáo doanh thu.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Database className="size-5 shrink-0 text-brand-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Khóa bí mật</p>
                  <p className="text-sm text-slate-500">
                    Phần mềm chỉ dùng khóa công khai (anon key). Khóa service_role không có trong
                    mã nguồn chạy trên trình duyệt.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Sao lưu */}
          <Card>
            <CardHeader tieuDe="Sao lưu dữ liệu" />
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-600">
                Tải toàn bộ khách hàng, số đo, đơn hàng, kho và thanh toán về máy dưới dạng một file
                JSON. Nên sao lưu mỗi tháng một lần và cất ở nơi an toàn.
              </p>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
                File sao lưu <strong>không chứa ảnh</strong>. Ảnh nằm trong mục Storage trên trang
                Supabase. Gửi file này vào thẻ “Khôi phục dữ liệu” bên dưới là nạp lại được.
              </p>
              <Button
                kieu="phu"
                iconTrai={<Download className="size-4" />}
                onClick={saoLuu}
                dangTai={dangSaoLuu}
              >
                Tải bản sao lưu
              </Button>
            </CardBody>
          </Card>

          <KhoiPhucDuLieu />
        </div>
      </div>

      <HopThoaiXoaCanMatKhau
        moRa={Boolean(nguoiXoa)}
        tieuDe={
          nguoiXoa?.id === hoSo?.id
            ? 'Xoá tài khoản của chính bạn?'
            : 'Xoá tài khoản này khỏi tiệm?'
        }
        noiDung={
          nguoiXoa
            ? `${nguoiXoa.ho_ten} (${NHAN_VAI_TRO[nguoiXoa.vai_tro]}) sẽ mất quyền vào phần mềm ngay lập tức. ` +
              'Khách hàng, đơn hàng và số đo do người này nhập vẫn giữ nguyên. ' +
              'Email đăng nhập vẫn còn trong Supabase › Authentication › Users, vào đó xoá nếu muốn xoá hẳn.'
            : ''
        }
        canhBao={
          nguoiXoa?.id === hoSo?.id
            ? 'Đây là tài khoản bạn đang dùng. Xoá xong phần mềm sẽ đăng xuất bạn ra ngay, và bạn sẽ không vào lại được trừ khi có người khác tạo lại tài khoản cho bạn.'
            : undefined
        }
        nhanDongY={nguoiXoa?.id === hoSo?.id ? 'Xoá tài khoản của tôi' : 'Xoá tài khoản'}
        dangXuLy={xoaNguoiDung.isPending}
        daDatMatKhau={matKhauXoa.daDat}
        loiMayChu={loiMatKhau}
        dongY={(mk) => void xoaTaiKhoan(mk)}
        huy={() => {
          setNguoiXoa(null)
          setLoiMatKhau('')
        }}
      />
    </div>
  )
}
