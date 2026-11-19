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

/* ------------------------------------------------------------------ */
/*  Ngày theo giờ địa phương                                           */
/*                                                                      */
/*  TUYỆT ĐỐI KHÔNG dùng new Date().toISOString().slice(0, 10) để lấy   */
/*  "hôm nay". Hàm toISOString() trả về giờ quốc tế UTC, mà Việt Nam    */
/*  sớm hơn 7 tiếng. Nên từ 00:00 đến 06:59 giờ Việt Nam, nó cho ra     */
/*  NGÀY HÔM TRƯỚC: tiền thu lúc rạng sáng bị ghi vào sổ ngày hôm qua   */
/*  (ngày có thể đã chốt sổ rồi), ngày giao hàng ghi sai, và báo cáo    */
/*  bỏ sót cả ngày hôm nay.                                            */
/* ------------------------------------------------------------------ */

/** Một ngày bất kỳ theo giờ máy, dạng "2026-11-19". */
export function ngayDiaPhuong(d: Date = new Date()): string {
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

/** Hôm nay theo giờ máy, dạng "2026-11-19". */
export function ngayHomNay(): string {
  return ngayDiaPhuong(new Date())
}

/**
 * Hôm nay cộng/trừ n ngày, theo giờ máy.
 * Dùng setDate() nên tự nhảy đúng qua đầu tháng và năm nhuận.
 */
export function ngayCongThem(soNgay: number, tuNgay: Date = new Date()): string {
  const d = new Date(tuNgay)
  d.setDate(d.getDate() + soNgay)
  return ngayDiaPhuong(d)
}

/**
 * Mốc thời gian đầu ngày / cuối ngày theo giờ máy, đổi sang chuỗi UTC
 * để so sánh với cột timestamptz trong cơ sở dữ liệu.
 *
 * Chuỗi "2026-11-17T00:00:00" gửi thẳng xuống Postgres sẽ bị hiểu theo
 * múi giờ của máy chủ (Supabase để UTC), tức là lệch 7 tiếng.
 */
export function mocDauNgay(ngay: string): string {
  return new Date(`${ngay}T00:00:00`).toISOString()
}

export function mocCuoiNgay(ngay: string): string {
  return new Date(`${ngay}T23:59:59.999`).toISOString()
}

/** Nhãn thời gian đặt tên file, theo giờ máy: "2026-11-19-22-20-05". */
export function nhanThoiGianTenFile(d: Date = new Date()): string {
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${ngayDiaPhuong(d)}-${hai(d.getHours())}-${hai(d.getMinutes())}-${hai(d.getSeconds())}`
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
 * QUY TẮC ĐẶT TÊN TÀI KHOẢN
 * ------------------------------------------------------------------
 *   ĐƯỢC : chữ của mọi thứ tiếng (kể cả Trung, Thái, Khmer, Ấn…),
 *           chữ số, khoảng trắng, và ba dấu hay có trong tên người:
 *           dấu chấm, gạch ngang, nháy đơn.
 *
 *   KHÔNG : dấu tiếng Việt   — à á ả ã ạ ă â đ ê ô ơ ư…
 *           dấu toán học   — + − × ÷ = < > % ^ *
 *           dấu câu văn học — “ ” ‘ ’ — – … ! ? , ; :
 *
 *     ĐƯỢC : Nguyen Van An  ·  Tran Thi Mai-Anh  ·  Le Van Duc Jr.
 *     KHÔNG: Nguyễn Văn An  ·  Tho may #1  ·  Le "Bob" Tran
 */

/**
 * DẢI CHỮ CÓ DẤU.
 *
 * Gồm chữ La-tinh mang dấu và cả những "dấu rời" đứng sau chữ — vì bộ
 * gõ tiếng Việt có kiểu gõ ra một chữ "ễ" liền một cục, cũng có kiểu gõ ra
 * "e" rồi mới thêm dấu. Nhìn bằng mắt thấy y hệt nhau, nên phải bắt cả hai.
 *
 * Giữ đúng dải này trùng với ràng buộc ck_ho_ten_khong_dau trong
 * supabase/06_phan_quyen_quan_ly.sql.
 */
const CO_DAU = /[\u00C0-\u024F\u0300-\u036F\u1E00-\u1EFF]/

/** Chỉ cho chữ, số, khoảng trắng và ba dấu hay có trong tên người. */
const CHO_PHEP = /^[\p{L}\p{N} .'-]+$/u

/** Kiểm tra tên tài khoản. Trả về chuỗi rỗng nghĩa là tên hợp lệ. */
export function loiTenTaiKhoan(ten: string): string {
  const t = ten.trim()
  if (!t) return 'Bạn chưa nhập họ tên.'
  if (t.length < 2) return 'Họ tên quá ngắn, cần ít nhất 2 ký tự.'
  if (t.length > 60) return 'Họ tên quá dài, tối đa 60 ký tự.'

  // Tách chữ và dấu ra trước khi soi, để bắt được cả hai kiểu gõ
  if (CO_DAU.test(t.normalize('NFD'))) {
    return `Họ tên phải viết KHÔNG DẤU. Bạn thử gõ: “${boDauTenTaiKhoan(t)}”`
  }

  if (!CHO_PHEP.test(t)) {
    const xau = Array.from(new Set(Array.from(t).filter((c) => !CHO_PHEP.test(c)))).join(' ')
    return `Họ tên không được có dấu toán học hay dấu câu: ${xau}`
  }

  if (!/^[\p{L}\p{N}]/u.test(t)) return 'Họ tên phải bắt đầu bằng chữ hoặc số.'

  return ''
}

/**
 * Bỏ dấu khỏi một cái tên, GIỮ NGUYÊN chữ hoa chữ thường.
 * "Nguyễn Văn Đức" -> "Nguyen Van Duc"
 *
 * Khác hàm boDau() ở trên: hàm kia hạ hết thành chữ thường vì dùng để tìm
 * kiếm, còn đây là tên người nên phải giữ chữ hoa.
 */
export function boDauTenTaiKhoan(ten: string): string {
  return ten
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tên cũ của hàm trên, giữ lại cho chỗ nào lỡ còn gọi. */
export const gotTenTaiKhoan = boDauTenTaiKhoan
