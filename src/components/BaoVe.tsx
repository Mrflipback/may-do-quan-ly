import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Scissors, ShieldCheck, UserX } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { useT } from '@/i18n'
import { useNhan } from '@/i18n/nhan'
import { ShopPage } from '@/pages/ShopPage'

/** Màn hình chờ trong lúc kiểm tra phiên đăng nhập. */
export function DangTaiToanTrang({ loi }: { loi?: string }) {
  const { t: dich } = useT()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-100">
      <span className="flex size-12 animate-pulse items-center justify-center rounded-xl bg-brand-800 text-gold-400">
        <Scissors className="size-6" />
      </span>
      <p className="text-sm text-slate-500">{loi ?? dich('chung.dangTaiDuLieu')}</p>
    </div>
  )
}

/** Tài khoản còn đăng nhập được nhưng hồ sơ đã bị chủ tiệm xoá khỏi tiệm. */
function TaiKhoanDaXoa() {
  const { dangXuat } = useAuth()
  const { t: dich } = useT()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <UserX className="size-7" />
      </span>
      <h1 className="text-lg font-bold text-slate-900">{dich('baoVe.taiKhoanDaXoa')}</h1>
      <p className="max-w-md text-sm text-slate-500">
        {dich('baoVe.taiKhoanDaXoaMoTa')}
      </p>
      <button
        type="button"
        onClick={() => void dangXuat()}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
      >
        {dich('chung.dangXuat')}
      </button>
    </div>
  )
}

/** Chặn người chưa đăng nhập. */
export function CanDangNhap({ children }: { children: ReactNode }) {
  const { dangTai, phien, hoSo, hoSoDaTai } = useAuth()
  const viTri = useLocation()

  if (dangTai) return <DangTaiToanTrang />

  if (!phien) {
    // Nguoi la vao dia chi goc thi thay trang gioi thieu & dat may cua tiem,
    // khong bat dang nhap. Cac trang quan ly khac van phai dang nhap.
    if (viTri.pathname === '/') return <ShopPage />
    return <Navigate to="/dang-nhap" state={{ tu: viTri.pathname }} replace />
  }

  // Hỏi xong bảng nguoi_dung mà không thấy hồ sơ nào: tài khoản đã bị xoá
  if (hoSoDaTai && !hoSo) return <TaiKhoanDaXoa />

  return <>{children}</>
}

/** Màn hình báo "bạn không đủ quyền". */
function KhongDuQuyen({ khoaAi, khoaLyDo }: { khoaAi: string; khoaLyDo: string }) {
  const { hoSo } = useAuth()
  const { t: dich } = useT()
  const { NHAN_VAI_TRO } = useNhan()
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <ShieldCheck className="size-7" />
      </span>
      <h1 className="mt-5 text-lg font-bold text-slate-900">{dich('baoVe.chiDanhCho', { ai: dich(khoaAi) })}</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {dich('baoVe.giaiThich', {
          vaiTro: hoSo ? NHAN_VAI_TRO[hoSo.vai_tro] : NHAN_VAI_TRO.nhan_vien,
          lyDo: dich(khoaLyDo),
        })}
      </p>
    </div>
  )
}

/** Chặn người không phải quản trị viên. */
export function CanQuanTri({ children }: { children: ReactNode }) {
  const { laQuanTri, hoSo, dangTai } = useAuth()

  if (dangTai || !hoSo) return <DangTaiToanTrang />

  if (!laQuanTri) {
    return (
      <KhongDuQuyen khoaAi="baoVe.aiQuanTri" khoaLyDo="baoVe.lyDoQuanTri" />
    )
  }

  return <>{children}</>
}

/** Chặn nhân viên, nhưng Quản lý thì vào được. Dùng cho báo cáo doanh thu. */
export function CanQuanLy({ children }: { children: ReactNode }) {
  const { laQuanLy, hoSo, dangTai } = useAuth()

  if (dangTai || !hoSo) return <DangTaiToanTrang />

  if (!laQuanLy) {
    return (
      <KhongDuQuyen khoaAi="baoVe.aiQuanLy" khoaLyDo="baoVe.lyDoQuanLy" />
    )
  }

  return <>{children}</>
}
