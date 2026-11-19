import type { LoaiTrangPhuc } from '@/types'

/*
 * Danh mục ảnh của tiệm.
 *
 * Ảnh gốc nằm trong thư mục PICTURES ở gốc dự án (KHÔNG được đóng gói).
 * Bản đã nén nằm trong public/anh/mau/ nên Vite tự chép vào dist/.
 * Muốn thêm hoặc đổi ảnh: sửa danh sách KE_HOACH trong
 * PICTURES/nen-anh-cho-web.py rồi chạy lại script đó, sau đó chạy lại
 * script sinh file này.
 *
 * Mỗi ảnh có hai cỡ:
 *   public/anh/mau/<ma>.jpg       900px — xem to
 *   public/anh/mau/nho/<ma>.jpg   440px — ô lưới
 */

export type AnhMau = {
  ma: string
  ten: string
  loai: LoaiTrangPhuc
  moTa: string
  rong: number
  cao: number
}

/*
 * Đường dẫn phải đi qua BASE_URL, KHÔNG được viết cứng "/anh/mau/...".
 * Khi đăng lên GitHub Pages, phần mềm nằm trong thư mục con (ví dụ
 * /may-do/) — viết cứng dấu gạch chéo đầu là ảnh hỏng hết.
 */
const GOC_ANH = `${import.meta.env.BASE_URL}anh/mau/`

/** Ảnh cỡ lớn (900px) để xem to. */
export function duongDanAnh(ma: string): string {
  return `${GOC_ANH}${ma}.jpg`
}

/** Ảnh cỡ nhỏ (440px) dùng cho ô lưới và ảnh đại diện. */
export function duongDanAnhNho(ma: string): string {
  return `${GOC_ANH}nho/${ma}.jpg`
}

/** 7 tấm chụp studio — dùng làm ảnh đại diện trên đầu phần mềm. */
export const ANH_DAI_DIEN: AnhMau[] = [
  { ma: "vest-3-manh-be", ten: "Vest 3 mảnh màu be", loai: "vest", moTa: "Vest ba mảnh màu be sáng, ve xuôi, kèm khăn choàng len", rong: 675, cao: 900 },
  { ma: "vest-3-manh-nau-socola", ten: "Vest 3 mảnh nâu socola", loai: "vest", moTa: "Vest ba mảnh nâu socola, hai khuy, gi-lê cùng màu", rong: 675, cao: 900 },
  { ma: "vest-3-manh-nau-dam", ten: "Vest 3 mảnh nâu đậm", loai: "vest", moTa: "Vest ba mảnh nâu đậm, dáng ôm, kèm khăn choàng kẻ", rong: 675, cao: 900 },
  { ma: "vest-3-manh-kem", ten: "Vest 3 mảnh màu kem", loai: "vest", moTa: "Vest ba mảnh màu kem, gi-lê năm khuy, khăn choàng xám", rong: 675, cao: 900 },
  { ma: "vest-3-manh-xanh-xam", ten: "Vest 3 mảnh xanh xám", loai: "vest", moTa: "Vest ba mảnh xanh xám, ve xuôi bản vừa, gi-lê cùng màu", rong: 675, cao: 900 },
  { ma: "vest-3-manh-xam-tro", ten: "Vest 3 mảnh xám tro", loai: "vest", moTa: "Vest ba mảnh xám tro, gi-lê, thắt cà vạt hoa văn", rong: 675, cao: 900 },
  { ma: "so-mi-may-do", ten: "Sơ mi may đo", loai: "ao_so_mi", moTa: "Sơ mi may đo nhiều màu: xanh nhạt, kem, hồng phấn, tím chấm bi", rong: 900, cao: 506 },
]

/** 21 tấm chụp tại tiệm — thư viện mẫu cho khách xem. */
export const ANH_MAU_GIOI_THIEU: AnhMau[] = [
  { ma: "vest-xanh-xam-ca-vat", ten: "Vest xanh xám — thắt cà vạt", loai: "vest", moTa: "Ảnh chụp tại tiệm: ve áo và cà vạt chấm bi", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-1", ten: "Vest xanh xám — trọn bộ", loai: "vest", moTa: "Ảnh chụp tại tiệm: áo và quần đồng bộ trên ma-nơ-canh", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-2", ten: "Vest xanh xám — trọn bộ, ve xuôi", loai: "vest", moTa: "Ảnh chụp tại tiệm: dáng áo một khuy, ve xuôi bản vừa", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-3", ten: "Vest xanh xám — trọn bộ, nhìn nghiêng", loai: "vest", moTa: "Ảnh chụp tại tiệm: nhìn nghiêng thấy rõ đường bên", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-1", ten: "Vest xanh xám — cận ve áo 1", loai: "vest", moTa: "Ảnh chụp tại tiệm: cận cảnh ve áo và túi ngực", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-2", ten: "Vest xanh xám — cận ve áo 2", loai: "vest", moTa: "Ảnh chụp tại tiệm: cận cảnh cổ áo và khuy cài", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-3", ten: "Vest xanh xám — cận ve áo 3", loai: "vest", moTa: "Ảnh chụp tại tiệm: ve áo nhìn chính diện", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-4", ten: "Vest xanh xám — cận ve áo 4", loai: "vest", moTa: "Ảnh chụp tại tiệm: đường may ve áo", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-5", ten: "Vest xanh xám — cận ve áo 5", loai: "vest", moTa: "Ảnh chụp tại tiệm: cổ áo sơ mi trắng bên trong", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-6", ten: "Vest xanh xám — cận ve áo 6", loai: "vest", moTa: "Ảnh chụp tại tiệm: ve áo và túi hộp", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-7", ten: "Vest xanh xám — cận ve áo 7", loai: "vest", moTa: "Ảnh chụp tại tiệm: nẹp áo và khuy cài giữa", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tren-nguoi", ten: "Vest xanh xám — thử dáng", loai: "vest", moTa: "Ảnh chụp tại tiệm: thợ chỉnh form áo trên ma-nơ-canh", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-8", ten: "Vest xanh xám — cận ve áo 8", loai: "vest", moTa: "Ảnh chụp tại tiệm: ve áo nhìn gần", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-ve-ao-9", ten: "Vest xanh xám — cận ve áo 9", loai: "vest", moTa: "Ảnh chụp tại tiệm: thân trước và khuy cài", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-4", ten: "Vest xanh xám — trọn bộ 4", loai: "vest", moTa: "Ảnh chụp tại tiệm: áo và quần gấp trên giá", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-5", ten: "Vest xanh xám — trọn bộ 5", loai: "vest", moTa: "Ảnh chụp tại tiệm: trọn bộ, nhìn hơi chếch", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-6", ten: "Vest xanh xám — trọn bộ 6", loai: "vest", moTa: "Ảnh chụp tại tiệm: trọn bộ cùng áo vest xanh than bên cạnh", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-7", ten: "Vest xanh xám — trọn bộ 7", loai: "vest", moTa: "Ảnh chụp tại tiệm: dáng áo và ống quần", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-8", ten: "Vest xanh xám — trọn bộ 8", loai: "vest", moTa: "Ảnh chụp tại tiệm: thân áo và quần gấp phía trước", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-9", ten: "Vest xanh xám — trọn bộ 9", loai: "vest", moTa: "Ảnh chụp tại tiệm: trọn bộ nhìn từ phía trái", rong: 675, cao: 900 },
  { ma: "vest-xanh-xam-tron-bo-10", ten: "Vest xanh xám — trọn bộ 10", loai: "vest", moTa: "Ảnh chụp tại tiệm: trọn bộ, khung hình rộng", rong: 675, cao: 900 },
]
