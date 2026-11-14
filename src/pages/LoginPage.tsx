import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, Scissors, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useAuth } from '@/auth/AuthProvider'
import { useThongBao } from '@/components/ui/ThongBao'
import { DangTaiToanTrang } from '@/components/BaoVe'
import { dichLoi } from '@/lib/loi'
import { loiTenTaiKhoan } from '@/lib/utils'

type CheDo = 'dang_nhap' | 'dang_ky' | 'quen_mat_khau'

export function LoginPage() {
  const { phien, dangTai, dangNhap, dangKy, quenMatKhau } = useAuth()
  const dieuHuong = useNavigate()
  const viTri = useLocation()
  const tb = useThongBao()

  const [cheDo, setCheDo] = useState<CheDo>('dang_nhap')
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [hoTen, setHoTen] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')

  if (dangTai) return <DangTaiToanTrang loi="Đang kiểm tra đăng nhập…" />

  // Đã đăng nhập rồi thì vào thẳng phần mềm
  if (phien) {
    const quayVe = (viTri.state as { tu?: string } | null)?.tu ?? '/'
    return <Navigate to={quayVe} replace />
  }

  const guiBieuMau = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoi('')

    if (!email.trim()) return setLoi('Bạn chưa nhập email.')

    if (cheDo === 'quen_mat_khau') {
      setDangGui(true)
      try {
        await quenMatKhau(email)
        tb.thanhCong('Đã gửi email đặt lại mật khẩu. Hãy mở hộp thư của bạn.')
        setCheDo('dang_nhap')
      } catch (err) {
        setLoi(dichLoi(err))
      } finally {
        setDangGui(false)
      }
      return
    }

    if (matKhau.length < 6) return setLoi('Mật khẩu phải có ít nhất 6 ký tự.')
    if (cheDo === 'dang_ky') {
      const loiTen = loiTenTaiKhoan(hoTen)
      if (loiTen) return setLoi(loiTen)
    }

    setDangGui(true)
    try {
      if (cheDo === 'dang_ky') {
        const thongDiep = await dangKy(email, matKhau, hoTen)
        tb.thanhCong(thongDiep)
        setCheDo('dang_nhap')
      } else {
        await dangNhap(email, matKhau)
        dieuHuong('/', { replace: true })
      }
    } catch (err) {
      setLoi(dichLoi(err))
    } finally {
      setDangGui(false)
    }
  }

  const tieuDe =
    cheDo === 'dang_ky'
      ? 'Tạo tài khoản'
      : cheDo === 'quen_mat_khau'
        ? 'Quên mật khẩu'
        : 'Đăng nhập'

  const moTa =
    cheDo === 'dang_ky'
      ? 'Người tạo tài khoản ĐẦU TIÊN sẽ tự động là Quản trị viên của tiệm.'
      : cheDo === 'quen_mat_khau'
        ? 'Nhập email của bạn, hệ thống sẽ gửi liên kết đặt lại mật khẩu.'
        : 'Nhập tài khoản đã được cấp để vào phần mềm.'

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Cột thương hiệu */}
      <div className="relative hidden flex-1 flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gold-400 text-brand-950">
            <Scissors className="size-6" />
          </span>
          <div className="leading-tight">
            <p className="font-bold">MAY ĐO QUẢN LÝ</p>
            <p className="text-xs font-semibold tracking-widest text-gold-300">PRO</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý tiệm may đo gọn gàng trong một phần mềm
          </h1>
          <p className="mt-4 text-brand-200">
            Hồ sơ số đo, đơn hàng, kho vải, công nợ và báo cáo doanh thu — tất cả ở một nơi, dùng
            được trên cả máy tính lẫn điện thoại.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-100">
            {[
              'Lưu nhiều lần đo cho mỗi khách hàng',
              'Theo dõi tiền cọc và công nợ chính xác',
              'In phiếu số đo và phiếu đơn hàng khổ A4',
            ].map((d) => (
              <li key={d} className="flex items-center gap-3">
                <span className="size-1.5 shrink-0 rounded-full bg-gold-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-300">Dữ liệu lưu an toàn trên Supabase</p>
      </div>

      {/* Cột biểu mẫu */}
      <div className="flex flex-1 items-center justify-center bg-slate-100 p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-800 text-gold-400">
              <Scissors className="size-6" />
            </span>
            <div className="leading-tight">
              <p className="font-bold text-slate-900">MAY ĐO QUẢN LÝ</p>
              <p className="text-xs font-semibold tracking-widest text-brand-700">PRO</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{tieuDe}</h2>
          <p className="mt-1.5 text-sm text-slate-500">{moTa}</p>

          <form className="mt-7 space-y-4" onSubmit={guiBieuMau}>
            {cheDo === 'dang_ky' && (
              <Input
                nhan="Họ và tên"
                batBuoc
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                autoComplete="name"
                placeholder="Nguyen Van An"
                goiY="Viết KHÔNG DẤU, không dùng dấu toán học hay dấu câu. Ví dụ: Nguyen Van An"
                iconTrai={<UserRound className="size-4" />}
              />
            )}

            <Input
              nhan="Email"
              batBuoc
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="chutiem@gmail.com"
              iconTrai={<Mail className="size-4" />}
            />

            {cheDo !== 'quen_mat_khau' && (
              <Input
                nhan="Mật khẩu"
                batBuoc
                type="password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                autoComplete={cheDo === 'dang_ky' ? 'new-password' : 'current-password'}
                placeholder="Ít nhất 6 ký tự"
                iconTrai={<Lock className="size-4" />}
              />
            )}

            {loi && (
              <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-600/20">
                {loi}
              </p>
            )}

            <Button co="lon" rongHet type="submit" dangTai={dangGui}>
              {cheDo === 'dang_ky'
                ? 'Tạo tài khoản'
                : cheDo === 'quen_mat_khau'
                  ? 'Gửi email đặt lại'
                  : 'Đăng nhập'}
            </Button>
          </form>

          <div className="mt-5 space-y-2 text-center text-sm">
            {cheDo === 'dang_nhap' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCheDo('quen_mat_khau')
                    setLoi('')
                  }}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Quên mật khẩu?
                </button>
                <p className="text-slate-500">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setCheDo('dang_ky')
                      setLoi('')
                    }}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Tạo tài khoản mới
                  </button>
                </p>
              </>
            )}

            {cheDo !== 'dang_nhap' && (
              <button
                type="button"
                onClick={() => {
                  setCheDo('dang_nhap')
                  setLoi('')
                }}
                className="font-medium text-brand-700 hover:underline"
              >
                ← Quay lại đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
