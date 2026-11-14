/**
 * MẬT KHẨU XOÁ
 * ------------------------------------------------------------------
 * Chủ tiệm tự đặt một mật khẩu riêng, khác mật khẩu đăng nhập. Mỗi lần
 * xoá tài khoản hoặc xoá sạch dữ liệu để khôi phục, phải gõ đúng mật
 * khẩu này.
 *
 * VIỆC KIỂM NẰM Ở MÁY CHỦ, KHÔNG PHẢI Ở ĐÂY.
 *
 * Trước đây phần mềm tự băm và tự so ngay trong trình duyệt. Làm vậy
 * thì nó chỉ là cái gờ giảm tốc: ai mở công cụ lập trình của trình
 * duyệt (F12) cũng bảo được đoạn mã "coi như đúng rồi", không cần biết
 * mật khẩu.
 *
 * Giờ trình duyệt chỉ gửi chữ người dùng gõ lên máy chủ. Máy chủ tự
 * kiểm bằng bcrypt rồi mới xoá, và tự đếm số lần gõ sai để khoá tạm
 * người đoán mò. Dấu vân tay nằm trong bảng `khoa_xoa` mà KHÔNG AI đọc
 * được, kể cả Quản trị viên. Xem supabase/11_khoa_xoa_tren_may_chu.sql.
 *
 * File này vì thế chỉ còn một việc: kiểm sơ bộ mật khẩu MỚI trước khi
 * gửi đi, để báo lỗi cho nhanh. Máy chủ vẫn kiểm lại y hệt — đây chỉ
 * là phép lịch sự với người dùng, không phải chốt chặn.
 */

/** Mật khẩu mới có đủ chặt không. Chuỗi rỗng nghĩa là đạt. */
export function loiMatKhauMoi(mk: string): string {
  if (mk.length < 6) return 'Mật khẩu xoá phải có ít nhất 6 ký tự.'
  // bcrypt chỉ đọc 72 byte đầu, dài hơn là phần thừa bị bỏ lặng lẽ
  if (mk.length > 72) return 'Mật khẩu xoá quá dài, tối đa 72 ký tự.'
  if (!/\S/.test(mk)) return 'Mật khẩu xoá không được toàn khoảng trắng.'
  return ''
}

/**
 * Câu trả lời chung của mọi hàm cần mật khẩu xoá trên máy chủ.
 *
 * Chú ý: máy chủ KHÔNG báo lỗi khi sai mật khẩu, mà trả về `ok: false`.
 * Lý do nằm trong file SQL — báo lỗi là Postgres cuộn ngược giao dịch,
 * mất luôn cái đếm số lần gõ sai.
 */
export interface KetQuaMatKhau {
  ok: boolean
  /** 'sai_mat_khau' | 'bi_khoa' | 'chua_dat' | 'qua_ngan' | 'qua_dai' | 'trong' */
  ly_do?: string
  /** Câu tiếng Việt đã viết sẵn, hiện thẳng cho người dùng đọc. */
  loi?: string
  /** Còn mấy lần gõ sai nữa thì bị khoá tạm. */
  con_lai?: number
  /** Đang bị khoá, còn bao nhiêu phút. */
  phut?: number
  [k: string]: unknown
}

/** Đọc câu trả lời của máy chủ thành một câu tiếng Việt. */
export function cauLoi(kq: KetQuaMatKhau | null | undefined): string {
  if (!kq) return 'Máy chủ không trả lời. Thử lại xem sao.'
  if (kq.ok) return ''
  return typeof kq.loi === 'string' && kq.loi ? kq.loi : 'Mật khẩu xoá không đúng.'
}
