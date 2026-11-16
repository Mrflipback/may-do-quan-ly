import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA } from './chung'

/**
 * NHẬT KÝ ĐĂNG NHẬP
 * ------------------------------------------------------------------
 * Ai vào phần mềm, lúc nào, từ địa chỉ IP nào, bằng cách nào.
 *
 * ĐIỀU CẦN BIẾT: phần mềm chạy trong trình duyệt KHÔNG tự biết được
 * địa chỉ IP của chính máy đang chạy nó. Trình duyệt không cho.
 *
 * Nên dữ liệu ở đây không do phần mềm ghi. Nó là cuốn sổ mà Supabase
 * vốn đã tự ghi sẵn ở tầng máy chủ — xem supabase/10_nhat_ky_dang_nhap.sql.
 * Phần mềm chỉ đọc qua một cánh cửa hẹp, và chỉ Quản trị viên mở được.
 *
 * Vì là sổ của máy chủ nên không ai sửa được, kể cả chủ tiệm, và nó có
 * sẵn lịch sử từ trước khi phần này được làm ra.
 */

/** Loại việc trong sổ. Trình duyệt tự gia hạn phiên thì không tính. */
export type LoaiSuKienDangNhap =
  | 'vao'
  | 'xin_doi_mk'
  | 'doi_mk_xong'
  | 'ra'
  | 'khac'

export interface DongDangNhap {
  thoi_diem: string
  nguoi_id: string | null
  ten_nguoi: string
  vai_tro: string
  email: string
  /** null khi máy chủ không bắt được IP. */
  dia_chi_ip: string | null
  loai_su_kien: LoaiSuKienDangNhap
  /**
   * Lần vào này có vẻ đi qua đường "quên mật khẩu".
   *
   * Đây là SUY ĐOÁN THEO DẤU VẾT, không phải Supabase ghi thẳng ra:
   * ngay trước lần vào, chính người đó vừa xin đặt lại mật khẩu trong
   * vòng một tiếng. Dòng "xin đặt lại mật khẩu" vẫn hiện riêng trong
   * sổ để đối chiếu.
   */
  qua_quen_mk: boolean
  /**
   * Lan dau tai khoan nay vao tu dia chi mang do, tinh tren TOAN BO
   * lich su chu khong rieng khoang dang xem.
   *
   * May chu tinh (xem supabase/13_danh_dau_ip_la.sql) vi cau hoi nay
   * phai soi het ca cuon so. May dau hieu con lai thi phan mem tu tinh,
   * do chung can gio dia phuong cua tiem.
   *
   * Chua chay file 13 thi may chu khong gui cot nay -> undefined ->
   * khong danh dau gi. Khong hong gi ca.
   */
  ip_la?: boolean
}

export interface BoLocDangNhap {
  /** yyyy-mm-dd */
  tuNgay: string
  denNgay: string
  /** Mã người dùng, chuỗi rỗng là tất cả. */
  nguoiId: string
  loai: 'tat_ca' | 'chi_vao' | 'chi_mat_khau'
}

const GIOI_HAN = 400

export function useNhatKyDangNhap(loc: BoLocDangNhap, bat: boolean) {
  return useQuery({
    queryKey: [...KHOA.dangNhap, loc],
    enabled: bat,
    staleTime: 20_000,
    retry: false,
    queryFn: async (): Promise<DongDangNhap[]> => {
      const { data, error } = await supabase.rpc('nhat_ky_dang_nhap', {
        tu_ngay: loc.tuNgay,
        den_ngay: loc.denNgay,
        nguoi: loc.nguoiId || null,
        loai: loc.loai,
        gioi_han: GIOI_HAN,
      })
      if (error) throw error
      return (data ?? []) as DongDangNhap[]
    },
  })
}

export const SO_DONG_TOI_DA = GIOI_HAN

export interface TongKetDangNhap {
  so_lan_vao: number
  so_nguoi: number
  so_ip: number
  so_lan_quen: number
  lan_gan_nhat: string | null
}

export function useTongKetDangNhap(loc: BoLocDangNhap, bat: boolean) {
  return useQuery({
    queryKey: [...KHOA.dangNhap, 'tong-ket', loc.tuNgay, loc.denNgay],
    enabled: bat,
    staleTime: 20_000,
    retry: false,
    queryFn: async (): Promise<TongKetDangNhap> => {
      const { data, error } = await supabase.rpc('tong_ket_dang_nhap', {
        tu_ngay: loc.tuNgay,
        den_ngay: loc.denNgay,
      })
      if (error) throw error
      // Hàm trả về một bảng một dòng, nên data là mảng.
      const d = (Array.isArray(data) ? data[0] : data) as TongKetDangNhap | undefined
      return (
        d ?? { so_lan_vao: 0, so_nguoi: 0, so_ip: 0, so_lan_quen: 0, lan_gan_nhat: null }
      )
    },
  })
}

/* ------------------------------------------------------------------ */
/*  Tải ra file                                                        */
/* ------------------------------------------------------------------ */

function oCsv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export async function taiDangNhapCsv(
  loc: BoLocDangNhap,
  tenViec: (l: LoaiSuKienDangNhap) => string,
): Promise<number> {
  const { data, error } = await supabase.rpc('nhat_ky_dang_nhap', {
    tu_ngay: loc.tuNgay,
    den_ngay: loc.denNgay,
    nguoi: loc.nguoiId || null,
    loai: loc.loai,
    gioi_han: 2000,
  })
  if (error) throw error
  const ds = (data ?? []) as DongDangNhap[]

  const dong = [
    ['Thời điểm', 'Người', 'Vai trò', 'Email', 'Địa chỉ IP', 'Việc', 'Qua quên mật khẩu']
      .map(oCsv)
      .join(','),
    ...ds.map((d) =>
      [
        new Date(d.thoi_diem).toLocaleString('vi-VN'),
        d.ten_nguoi,
        d.vai_tro,
        d.email,
        d.dia_chi_ip ?? '',
        tenViec(d.loai_su_kien),
        d.qua_quen_mk ? 'Có' : '',
      ]
        .map(oCsv)
        .join(','),
    ),
  ].join('\r\n')

  // Dấu BOM ở đầu để Excel hiểu đây là UTF-8, không thì chữ Việt thành rác
  const blob = new Blob([`﻿${dong}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nhat-ky-dang-nhap-${loc.tuNgay}-den-${loc.denNgay}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return ds.length
}
