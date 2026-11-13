import { KHO_ANH, supabase } from '@/lib/supabase'

/** Kích thước ảnh tối đa cho phép tải lên: 5MB. */
export const GIOI_HAN_ANH = 5 * 1024 * 1024

const DINH_DANG_CHO_PHEP = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Kiểm tra file trước khi tải lên. Trả về câu lỗi, hoặc null nếu hợp lệ. */
export function kiemTraAnh(file: File): string | null {
  if (!DINH_DANG_CHO_PHEP.includes(file.type)) {
    return 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.'
  }
  if (file.size > GIOI_HAN_ANH) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `Ảnh nặng ${mb}MB, vượt quá giới hạn 5MB. Hãy chọn ảnh nhỏ hơn.`
  }
  return null
}

function duoiFile(ten: string): string {
  const phan = ten.split('.')
  return phan.length > 1 ? phan[phan.length - 1].toLowerCase() : 'jpg'
}

/**
 * Tải một ảnh lên kho và trả về đường dẫn trong kho.
 * Tên file được đặt ngẫu nhiên để không ai đoán được.
 */
export async function taiAnhLen(
  kho: (typeof KHO_ANH)[keyof typeof KHO_ANH],
  file: File,
  thuMuc = '',
): Promise<string> {
  const loi = kiemTraAnh(file)
  if (loi) throw new Error(loi)

  const ten = `${crypto.randomUUID()}.${duoiFile(file.name)}`
  const duongDan = thuMuc ? `${thuMuc}/${ten}` : ten

  const { error } = await supabase.storage.from(kho).upload(duongDan, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error

  return duongDan
}

/** Xóa một ảnh khỏi kho. Chỉ Quản trị viên làm được. */
export async function xoaAnh(
  kho: (typeof KHO_ANH)[keyof typeof KHO_ANH],
  duongDan: string,
): Promise<void> {
  const { error } = await supabase.storage.from(kho).remove([duongDan])
  if (error) throw error
}

/**
 * Kho ảnh để ở chế độ riêng tư, nên phải xin "vé xem ảnh" có hạn giờ.
 * Vé giữ được 1 tiếng.
 */
export async function veXemAnh(
  kho: (typeof KHO_ANH)[keyof typeof KHO_ANH],
  duongDan: string,
): Promise<string | null> {
  if (!duongDan) return null
  const { data, error } = await supabase.storage.from(kho).createSignedUrl(duongDan, 3600)
  if (error) return null
  return data?.signedUrl ?? null
}

/** Xin vé cho nhiều ảnh cùng lúc, nhanh hơn xin từng tấm. */
export async function veXemNhieuAnh(
  kho: (typeof KHO_ANH)[keyof typeof KHO_ANH],
  duongDanList: string[],
): Promise<Record<string, string>> {
  const sach = duongDanList.filter(Boolean)
  if (sach.length === 0) return {}

  const { data, error } = await supabase.storage.from(kho).createSignedUrls(sach, 3600)
  if (error || !data) return {}

  const kq: Record<string, string> = {}
  for (const m of data) {
    if (m.path && m.signedUrl) kq[m.path] = m.signedUrl
  }
  return kq
}
