import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '@/auth/AuthProvider'
import { useCaiDat } from '@/data/heThong'
import { DangTaiToanTrang } from '@/components/BaoVe'

export function AppLayout() {
  const [moMenu, setMoMenu] = useState(false)
  const viTri = useLocation()
  const { hoSo } = useAuth()
  const { data: caiDat } = useCaiDat()

  // Chuyển trang thì tự đóng menu trên điện thoại
  useEffect(() => {
    setMoMenu(false)
  }, [viTri.pathname])

  // Đã có phiên đăng nhập nhưng hồ sơ nhân sự chưa tải xong
  if (!hoSo) return <DangTaiToanTrang loi="Đang tải hồ sơ tài khoản…" />

  const tenTiem = caiDat?.ten_tiem?.trim() || 'MAY ĐO QUẢN LÝ'

  return (
    <div className="min-h-dvh bg-slate-100">
      <Sidebar
        vaiTro={hoSo.vai_tro}
        tenTiem={tenTiem}
        moTrenDienThoai={moMenu}
        dong={() => setMoMenu(false)}
      />

      <div className="flex min-h-dvh flex-col lg:pl-72">
        <Topbar nguoiDung={hoSo} moMenu={() => setMoMenu(true)} />
        {/* key doi theo duong dan -> React ve lai -> hieu ung chay lai
            moi lan chuyen sang trang khac */}
        <main key={viTri.pathname} className="hieu-ung flex-1 px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
        <footer className="no-print border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 sm:px-6">
          {tenTiem} · Phần mềm quản lý tiệm may đo
        </footer>
      </div>
    </div>
  )
}
