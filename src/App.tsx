import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { DA_CAU_HINH } from '@/lib/supabase'
import { queryClient } from '@/data/chung'
import { NhaCungCapAuth } from '@/auth/AuthProvider'
import { NhaCungCapThongBao } from '@/components/ui/ThongBao'
import { ChuaCauHinh } from '@/components/ChuaCauHinh'
import { CanDangNhap, CanQuanLy, CanQuanTri } from '@/components/BaoVe'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { MeasurementsPage } from '@/pages/MeasurementsPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { PrintPage } from '@/pages/PrintPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NhatKyPage } from '@/pages/NhatKyPage'
import { GiaoDienPage } from '@/pages/GiaoDienPage'
import { LoginPage } from '@/pages/LoginPage'
import { OnlineOrdersPage } from '@/pages/OnlineOrdersPage'
import { ShopPage } from '@/pages/ShopPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Thư mục gốc của trang, để React Router biết đường mà tính.
 *
 * Chạy ở gốc thì BASE_URL là "/" -> GOC thành "" -> router chạy y như cũ.
 * Trên GitHub Pages, BASE_URL là "/may-do/" -> GOC thành "/may-do".
 * Phải cắt dấu "/" ở cuối, vì React Router muốn basename không có dấu đó.
 *
 * Nhờ vậy toàn bộ <Route path="/..."> và <Link to="/..."> giữ nguyên,
 * không phải sửa một dòng nào.
 */
const GOC = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  // Chưa điền khóa Supabase thì hiện màn hình hướng dẫn thay vì lỗi trắng
  if (!DA_CAU_HINH) return <ChuaCauHinh />

  return (
    <QueryClientProvider client={queryClient}>
      <NhaCungCapThongBao>
        <BrowserRouter basename={GOC}>
          <NhaCungCapAuth>
            <Routes>
              <Route path="/dang-nhap" element={<LoginPage />} />

              {/* Trang cong khai cho khach: xem san pham, bang gia va dat may */}
              <Route path="/tiem" element={<ShopPage />} />

              <Route
                element={
                  <CanDangNhap>
                    <AppLayout />
                  </CanDangNhap>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/khach-hang" element={<CustomersPage />} />
                <Route path="/so-do" element={<MeasurementsPage />} />
                <Route path="/thu-vien-mau" element={<GalleryPage />} />
                <Route path="/don-hang" element={<OrdersPage />} />
                <Route path="/don-online" element={<OnlineOrdersPage />} />
                <Route path="/kho" element={<InventoryPage />} />
                <Route path="/thanh-toan" element={<PaymentsPage />} />
                <Route path="/in-phieu" element={<PrintPage />} />
                {/* Ai cung chinh duoc giao dien cua rieng minh */}
                <Route path="/giao-dien" element={<GiaoDienPage />} />

                <Route
                  path="/bao-cao"
                  element={
                    <CanQuanLy>
                      <ReportsPage />
                    </CanQuanLy>
                  }
                />
                <Route
                  path="/nhat-ky"
                  element={
                    <CanQuanLy>
                      <NhatKyPage />
                    </CanQuanLy>
                  }
                />
                <Route
                  path="/cai-dat"
                  element={
                    <CanQuanTri>
                      <SettingsPage />
                    </CanQuanTri>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </NhaCungCapAuth>
        </BrowserRouter>
      </NhaCungCapThongBao>
    </QueryClientProvider>
  )
}
