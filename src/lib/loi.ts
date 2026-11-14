/**
 * Dịch thông báo lỗi của Supabase sang tiếng Việt dễ hiểu.
 * Người dùng không bao giờ phải đọc lỗi tiếng Anh.
 */

interface LoiCoMa {
  code?: string
  message?: string
  details?: string
  hint?: string
}

const THEO_MA: Record<string, string> = {
  // Lỗi cơ sở dữ liệu
  '23505': 'Dữ liệu này đã tồn tại. Hãy kiểm tra lại mã hoặc tên bị trùng.',
  '23503': 'Không làm được vì dữ liệu này đang được nơi khác sử dụng.',
  '23514': 'Dữ liệu không hợp lệ. Hãy kiểm tra lại các ô vừa nhập.',
  '23502': 'Bạn còn bỏ trống ô bắt buộc.',
  '22P02': 'Có ô nhập sai định dạng (ví dụ chữ nằm trong ô số).',
  '42501': 'Tài khoản của bạn không có quyền làm việc này.',
  '42P01': 'Chưa tạo bảng trong Supabase. Hãy chạy file 01_schema.sql.',
  '42883': 'Chưa tạo hàm trong Supabase. Hãy chạy lại file 01_schema.sql.',
  PGRST301: 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  PGRST116: 'Không tìm thấy dữ liệu.',
  PGRST204: 'Cấu trúc bảng chưa khớp. Hãy chạy lại file 01_schema.sql.',
  PGRST205:
    'Supabase chưa có bảng này. Hãy chạy các file SQL trong thư mục supabase theo đúng thứ tự 01 → 05.',
}

const THEO_NOI_DUNG: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Sai email hoặc mật khẩu.'],
  [/email not confirmed/i, 'Email chưa được xác nhận. Hãy mở hộp thư và bấm vào liên kết xác nhận.'],
  [/user already registered/i, 'Email này đã có tài khoản rồi.'],
  [/password should be at least/i, 'Mật khẩu quá ngắn, cần ít nhất 6 ký tự.'],
  [/email rate limit|over_email_send_rate_limit/i, 'Gửi email quá nhiều lần. Hãy đợi vài phút rồi thử lại.'],
  [/for security purposes.*after (\d+) seconds/i, 'Thao tác quá nhanh. Hãy đợi vài giây rồi thử lại.'],
  [/jwt expired|token.*expired/i, 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'],
  [/failed to fetch|networkerror|network request failed/i,
   'Không kết nối được tới máy chủ. Hãy kiểm tra mạng Internet và địa chỉ Supabase trong file .env.'],
  [/row-level security|violates row-level security/i,
   'Tài khoản của bạn không có quyền làm việc này. Chỉ Quản trị viên mới được phép.'],
  [/nguoi_dung_vai_tro_check/i,
   'Chưa bật vai trò Quản lý. Hãy chạy file supabase/06_phan_quyen_quan_ly.sql trong Supabase trước.'],
  [/ck_ho_ten_khong_dau|ck_ho_ten_khong_ky_tu_la/i,
   'Họ tên phải viết không dấu. Ví dụ: Nguyen Van An.'],
  [/nhat_ky|don_nhat_ky_cu/i,
   'Chưa bật nhật ký hoạt động. Hãy chạy file supabase/08_nhat_ky.sql trong Supabase.'],
  [/Quản trị viên cuối cùng/i,
   'Đây là Quản trị viên cuối cùng của tiệm nên không xoá hay hạ quyền được. Hãy cấp quyền Quản trị viên cho một người khác trước.'],
  [/Chỉ Quản trị viên và Quản lý/i, 'Chỉ Quản trị viên và Quản lý mới được xem báo cáo doanh thu.'],
  [/Chỉ Quản trị viên/i, 'Chỉ Quản trị viên mới được xem báo cáo doanh thu.'],
  [/bucket not found/i, 'Chưa tạo kho ảnh. Hãy chạy file 02_storage.sql trong Supabase.'],
  [/payload too large|exceeded the maximum allowed size/i, 'Ảnh quá nặng. Hãy chọn ảnh dưới 5MB.'],
  [/mime type.*not supported|invalid_mime_type/i, 'Định dạng ảnh không hợp lệ. Chỉ nhận JPG, PNG, WEBP hoặc GIF.'],
  [/duplicate key value/i, 'Dữ liệu này đã tồn tại. Hãy kiểm tra lại mã hoặc tên bị trùng.'],
  [/ck_ngay_giao_hop_le/i, 'Ngày hẹn giao không được sớm hơn ngày nhận đơn.'],
  [/so_luong.*check|check.*so_luong/i, 'Số lượng phải lớn hơn 0.'],
  [/so_tien.*check|check.*so_tien/i, 'Số tiền phải lớn hơn 0.'],
]

/** Biến bất kỳ lỗi nào thành một câu tiếng Việt cho người dùng đọc. */
export function dichLoi(loi: unknown): string {
  if (!loi) return 'Đã xảy ra lỗi không rõ nguyên nhân.'

  const e = loi as LoiCoMa
  const noiDung = [e.message, e.details, e.hint].filter(Boolean).join(' · ')

  if (e.code && THEO_MA[e.code]) return THEO_MA[e.code]

  for (const [mau, cau] of THEO_NOI_DUNG) {
    if (mau.test(noiDung)) return cau
  }

  if (noiDung) return noiDung
  if (typeof loi === 'string') return loi
  return 'Đã xảy ra lỗi không rõ nguyên nhân.'
}

/** Ghi lỗi gốc ra Console để thợ sửa phần mềm xem khi cần. */
export function ghiLoi(boiCanh: string, loi: unknown): void {
  console.error(`[May Đo Quản Lý Pro] ${boiCanh}:`, loi)
}
