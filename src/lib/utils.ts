/** Nối các class CSS, bỏ qua mọi giá trị không phải chuỗi. */
export function cn(...classes: unknown[]): string {
  return classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ')
}

/** 1250000 -> "1.250.000 ₫" */
export function dinhDangTien(soTien: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(soTien || 0)
}

/** 1250000 -> "1.250.000" (không có ký hiệu tiền) */
export function dinhDangSo(so: number): string {
  return new Intl.NumberFormat('vi-VN').format(so || 0)
}

/** "2026-11-12" -> "12/11/2026" */
export function dinhDangNgay(ngay: string | Date | null | undefined): string {
  if (!ngay) return '—'
  const d = typeof ngay === 'string' ? new Date(ngay) : ngay
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/** "2026-11-12T08:30" -> "12/11/2026 08:30" */
export function dinhDangNgayGio(ngay: string | Date | null | undefined): string {
  if (!ngay) return '—'
  const d = typeof ngay === 'string' ? new Date(ngay) : ngay
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/** Số ngày còn lại tới hạn giao. Số âm nghĩa là đã trễ hẹn. */
export function soNgayConLai(ngayHen: string): number {
  const hen = new Date(ngayHen)
  const homNay = new Date()
  hen.setHours(0, 0, 0, 0)
  homNay.setHours(0, 0, 0, 0)
  return Math.round((hen.getTime() - homNay.getTime()) / 86_400_000)
}

/** Bỏ dấu tiếng Việt để tìm kiếm: "Nguyễn Văn Á" -> "nguyen van a" */
export function boDau(chuoi: string): string {
  return chuoi
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** Tìm kiếm không phân biệt hoa thường và dấu. */
export function khopTimKiem(noiDung: string, tuKhoa: string): boolean {
  if (!tuKhoa.trim()) return true
  return boDau(noiDung).includes(boDau(tuKhoa))
}

/** Chữ cái đầu của tên, dùng làm ảnh đại diện dự phòng. */
export function chuCaiDau(hoTen: string): string {
  const phan = hoTen.trim().split(/\s+/)
  if (phan.length === 0) return '?'
  if (phan.length === 1) return phan[0].charAt(0).toUpperCase()
  return (phan[0].charAt(0) + phan[phan.length - 1].charAt(0)).toUpperCase()
}

/** Phần trăm thay đổi giữa hai kỳ. */
export function phanTramThayDoi(hienTai: number, truocDo: number): number {
  if (truocDo === 0) return hienTai > 0 ? 100 : 0
  return ((hienTai - truocDo) / truocDo) * 100
}

/* ------------------------- Tên tài khoản ------------------------- */

/**
 * Những ký tự KHÔNG được có trong tên tài khoản.
 * Giữ đúng danh sách này trùng với ràng buộc ck_ho_ten_khong_ky_tu_la
 * trong file supabase/06_phan_quyen_quan_ly.sql.
 */
export const KY_TU_CAM = '<>@#$%^&*()_+={}[]|\\/:;"`~!?,'

/**
 * Kiểm tra tên tài khoản. Trả về chuỗi rỗng nghĩa là tên hợp lệ.
 *
 * Cho phép chữ (kể cả chữ có dấu tiếng Việt), số, khoảng trắng, dấu chấm,
 * gạch ngang và nháy đơn — đủ cho mọi cái tên người Việt, ví dụ
 * "Nguyễn Văn An", "Trần Thị Mai-Anh", "Lê Văn Đức Jr.".
 */
export function loiTenTaiKhoan(ten: string): string {
  const t = ten.trim()
  if (!t) return 'Bạn chưa nhập họ tên.'
  if (t.length < 2) return 'Họ tên quá ngắn, cần ít nhất 2 ký tự.'
  if (t.length > 60) return 'Họ tên quá dài, tối đa 60 ký tự.'

  const xau = Array.from(t).filter((c) => KY_TU_CAM.includes(c))
  if (xau.length > 0) {
    const ds = Array.from(new Set(xau)).join(' ')
    return `Họ tên không được có ký tự đặc biệt: ${ds}`
  }

  // Chặn nốt những ký tự lạ còn sót (biểu tượng cảm xúc, ký hiệu toán…)
  if (!/^[\p{L}\p{N} .'-]+$/u.test(t)) {
    return 'Họ tên chỉ được gồm chữ, số, khoảng trắng và dấu chấm, gạch ngang.'
  }
  if (!/^[\p{L}\p{N}]/u.test(t)) return 'Họ tên phải bắt đầu bằng chữ hoặc số.'

  return ''
}

/** Gột sạch ký tự đặc biệt khỏi một cái tên, dùng khi muốn tự sửa giúp. */
export function gotTenTaiKhoan(ten: string): string {
  return Array.from(ten)
    .filter((c) => !KY_TU_CAM.includes(c))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
