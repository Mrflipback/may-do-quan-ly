import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Kết nối tới Supabase.
 *
 * Hai giá trị dưới đây lấy từ file .env ở thư mục gốc dự án.
 * Chúng là khóa CÔNG KHAI, lộ ra trình duyệt cũng không sao — dữ liệu
 * được bảo vệ bằng Row Level Security đã bật trong file 01_schema.sql.
 *
 * TUYỆT ĐỐI KHÔNG đặt service_role key vào đây.
 */
const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const KHOA_CONG_KHAI = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** Phần mềm đã được điền khóa Supabase chưa. */
export const DA_CAU_HINH =
  URL_SUPABASE.length > 0 &&
  KHOA_CONG_KHAI.length > 0 &&
  URL_SUPABASE.startsWith('http')

/**
 * Cảnh báo nếu lỡ dán nhầm khóa bí mật vào file .env.
 * Khóa bí mật của Supabase chứa chữ "service_role".
 */
if (KHOA_CONG_KHAI.includes('service_role')) {
  throw new Error(
    'NGUY HIỂM: bạn đã dán service_role key vào VITE_SUPABASE_ANON_KEY. ' +
      'Khóa này cho phép đọc ghi mọi dữ liệu và sẽ bị lộ ra trình duyệt. ' +
      'Hãy thay bằng anon key (publishable key) trong file .env, ' +
      'rồi vào Supabase thu hồi khóa bí mật vừa lộ.',
  )
}

/**
 * Nếu chưa cấu hình, ta vẫn tạo một client "rỗng" để phần mềm không bị
 * trắng màn hình. Màn hình hướng dẫn cấu hình sẽ hiện ra thay thế.
 */
export const supabase: SupabaseClient = createClient(
  DA_CAU_HINH ? URL_SUPABASE : 'https://chua-cau-hinh.supabase.co',
  DA_CAU_HINH ? KHOA_CONG_KHAI : 'chua-cau-hinh',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'may-do-quan-ly-pro-auth',
    },
  },
)

