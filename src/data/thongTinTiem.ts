import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA } from './chung'
import type { DongBangGia } from '@/types'

/**
 * THÔNG TIN TIỆM CHO TRANG GIỚI THIỆU
 * ==================================================================
 * Ai cũng đọc được, kể cả người chưa đăng nhập — vì trang giới thiệu
 * là trang công khai.
 *
 * Đọc qua khung nhìn v_thong_tin_tiem, chỉ gồm những mục được phép để
 * công khai (tên tiệm, giới thiệu, giờ mở cửa, bảng giá...). Dữ liệu
 * khách hàng và đơn hàng không nằm trong khung nhìn này.
 */

export interface ThongTinTiem {
  ten: string
  khauHieu: string
  gioiThieu: string
  dienThoai: string
  diaChi: string
  gioMoCua: string
  bangGia: DongBangGia[]
  ghiChuGia: string
}

/** Bảng giá mẫu, dùng khi tiệm chưa tự nhập bảng giá của mình. */
export const BANG_GIA_MAU: DongBangGia[] = [
  { trang_phuc: 'Áo dài truyền thống', cong_may: 'May tay, có lót', gia_tu: '900.000 đ', thoi_gian: '7–10 ngày' },
  { trang_phuc: 'Vest / Blazer', cong_may: 'Có dựng, có lót', gia_tu: '2.200.000 đ', thoi_gian: '10–14 ngày' },
  { trang_phuc: 'Sơ mi', cong_may: 'Cổ đức hoặc cổ tàu', gia_tu: '450.000 đ', thoi_gian: '3–5 ngày' },
  { trang_phuc: 'Quần âu', cong_may: 'Ống côn hoặc ống đứng', gia_tu: '550.000 đ', thoi_gian: '3–5 ngày' },
  { trang_phuc: 'Váy / Đầm', cong_may: 'May theo ảnh mẫu', gia_tu: '700.000 đ', thoi_gian: '5–7 ngày' },
  { trang_phuc: 'Sửa quần áo', cong_may: 'Lên lai, bóp eo, thay khoá', gia_tu: '50.000 đ', thoi_gian: '1–2 ngày' },
]

/** Dùng khi chưa chạy file SQL hoặc mạng chưa trả lời: trang vẫn đọc được. */
export const TIEM_MAC_DINH: ThongTinTiem = {
  ten: 'Tiệm may đo',
  khauHieu: 'May đo theo số đo riêng',
  gioiThieu: '',
  dienThoai: '',
  diaChi: '',
  gioMoCua: '',
  bangGia: BANG_GIA_MAU,
  ghiChuGia: 'Giá trên là công may, chưa gồm tiền vải. Tiệm báo giá chính xác sau khi xem mẫu và chọn vải.',
}

function docBangGia(thoChuoi: string | undefined): DongBangGia[] {
  if (!thoChuoi) return BANG_GIA_MAU
  try {
    const d = JSON.parse(thoChuoi)
    if (!Array.isArray(d) || d.length === 0) return BANG_GIA_MAU
    return d
      .filter((r) => r && typeof r.trang_phuc === 'string' && r.trang_phuc.trim())
      .map((r) => ({
        trang_phuc: String(r.trang_phuc ?? ''),
        cong_may: String(r.cong_may ?? ''),
        gia_tu: String(r.gia_tu ?? ''),
        thoi_gian: String(r.thoi_gian ?? ''),
      }))
  } catch {
    return BANG_GIA_MAU
  }
}

/**
 * Thông tin tiệm cho trang công khai.
 * Đọc khung nhìn v_thong_tin_tiem (chỉ gồm các khóa được phép công khai),
 * nên chạy được cả khi người xem chưa đăng nhập.
 */
export function useThongTinTiemCongKhai() {
  return useQuery({
    queryKey: [...KHOA.caiDat, 'cong-khai'],
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async (): Promise<ThongTinTiem> => {
      const { data, error } = await supabase.from('v_thong_tin_tiem').select('khoa, gia_tri')
      if (error) throw error

      const m: Record<string, string> = {}
      for (const d of (data ?? []) as { khoa: string; gia_tri: string }[]) m[d.khoa] = d.gia_tri

      return {
        ten: m.ten_tiem?.trim() || 'Tiệm may đo',
        khauHieu: m.khau_hieu?.trim() || 'May đo theo số đo riêng',
        gioiThieu: m.gioi_thieu?.trim() || '',
        dienThoai: m.dien_thoai?.trim() || '',
        diaChi: m.dia_chi?.trim() || '',
        gioMoCua: m.gio_mo_cua?.trim() || '',
        bangGia: docBangGia(m.bang_gia),
        ghiChuGia: m.ghi_chu_gia?.trim() || '',
      }
    },
  })
}
