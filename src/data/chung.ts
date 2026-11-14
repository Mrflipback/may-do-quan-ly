import { QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/** Khóa truy vấn dùng chung, để làm mới đúng phần cần làm mới. */
export const KHOA = {
  khachHang: ['khach-hang'] as const,
  soDo: ['so-do'] as const,
  donHang: ['don-hang'] as const,
  vatTu: ['vat-tu'] as const,
  giaoDichKho: ['giao-dich-kho'] as const,
  thanhToan: ['thanh-toan'] as const,
  thongKe: ['thong-ke'] as const,
  baoCao: ['bao-cao'] as const,
  caiDat: ['cai-dat'] as const,
  nguoiDung: ['nguoi-dung'] as const,
  nhatKy: ['nhat-ky'] as const,
  dangNhap: ['nhat-ky-dang-nhap'] as const,
}

/** Làm mới mọi thứ liên quan tới tiền, vì chúng phụ thuộc lẫn nhau. */
export function lamMoiTien() {
  void queryClient.invalidateQueries({ queryKey: KHOA.donHang })
  void queryClient.invalidateQueries({ queryKey: KHOA.thanhToan })
  void queryClient.invalidateQueries({ queryKey: KHOA.khachHang })
  void queryClient.invalidateQueries({ queryKey: KHOA.thongKe })
  void queryClient.invalidateQueries({ queryKey: KHOA.baoCao })
}

/** Id của người đang đăng nhập, để ghi vào cột nguoi_tao. */
export async function idNguoiDangNhap(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/** Ném lỗi gốc của Supabase lên trên để nơi gọi dịch sang tiếng Việt. */
export function nemNeuLoi(error: unknown): void {
  if (error) throw error
}
