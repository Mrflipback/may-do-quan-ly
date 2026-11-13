import type { LoaiTrangPhuc } from '@/types'

/**
 * ẢNH CÓ SẴN CỦA TIỆM
 * ------------------------------------------------------------------
 * Ảnh thật của tiệm, đi kèm luôn trong phần mềm. Khác với Thư viện mẫu
 * ở chỗ: ảnh ở đây KHÔNG nằm trên Supabase, không tốn dung lượng kho
 * ảnh, không cần đăng nhập — nên khách vào trang web là thấy ngay.
 *
 * Ảnh gốc nằm ở thư mục PICTURES. Bản đã nén để chạy nhanh nằm ở
 * public/anh/mau (bản to, xem chi tiết) và public/anh/mau/nho (bản nhỏ,
 * xếp lưới).
 *
 * MUỐN THÊM ẢNH MỚI, làm một trong hai cách:
 *
 *   Cách dễ  — vào phần mềm, mục "Thư viện mẫu", bấm "Thêm ảnh mẫu".
 *              Ảnh lên Supabase, hiện ngay, không phải sửa file nào.
 *
 *   Cách này — bỏ ảnh vào PICTURES rồi chạy lại đoạn mã nén ảnh, thêm
 *              một dòng vào danh sách dưới đây. Dành cho người biết code.
 *
 * noiBat = true nghĩa là ảnh đó hiện ở trang khách xem (trang chủ).
 * Những ảnh còn lại chỉ hiện trong Thư viện mẫu bên trong phần mềm —
 * vì trang chủ mà bày 20 tấm chụp cùng một bộ đồ thì khách thấy chán.
 * Muốn đưa tấm nào ra trang chủ thì đổi false thành true.
 */
export interface AnhCoSan {
  /** Tên file, không có đuôi .jpg */
  ma: string
  ten: string
  loai: LoaiTrangPhuc
  moTa: string
  /**
   * 'tiem'      — ảnh tiệm tự chụp tại chỗ
   * 'tham_khao' — ảnh mẫu dựng sẵn (góc ảnh có chữ ký "Dola AI")
   *
   * Phân biệt để không nói với khách rằng ảnh mẫu là đồ tiệm đã may.
   * Tiệm chụp được ảnh thật rồi thì thay dần những tấm 'tham_khao' đi.
   */
  nguon: 'tiem' | 'tham_khao'
  noiBat: boolean
}

export const ANH_CO_SAN: AnhCoSan[] = [
  {
    ma: 'vest-3-manh-be',
    nguon: 'tham_khao',
    ten: 'Vest 3 mảnh màu be',
    loai: 'vest',
    moTa: 'Vest ba mảnh màu be sáng, ve xuôi, kèm khăn choàng len',
    noiBat: true,
  },
  {
    ma: 'vest-3-manh-nau-socola',
    nguon: 'tham_khao',
    ten: 'Vest 3 mảnh nâu socola',
    loai: 'vest',
    moTa: 'Vest ba mảnh nâu socola, hai khuy, gi-lê cùng màu',
    noiBat: true,
  },
  {
    ma: 'vest-3-manh-nau-dam',
    nguon: 'tham_khao',
    ten: 'Vest 3 mảnh nâu đậm',
    loai: 'vest',
    moTa: 'Vest ba mảnh nâu đậm, dáng ôm, kèm khăn choàng kẻ',
    noiBat: true,
  },
  {
    ma: 'vest-3-manh-kem',
    nguon: 'tham_khao',
    ten: 'Vest 3 mảnh màu kem',
    loai: 'vest',
    moTa: 'Vest ba mảnh màu kem, gi-lê năm khuy, khăn choàng xám',
    noiBat: true,
  },
  {
    ma: 'vest-3-manh-xanh-xam',
    nguon: 'tham_khao',
    ten: 'Vest 3 mảnh xanh xám',
    loai: 'vest',
    moTa: 'Vest ba mảnh xanh xám, ve xuôi bản vừa, gi-lê cùng màu',
    noiBat: true,
  },
  {
    ma: 'vest-3-manh-xam-tro',
    nguon: 'tham_khao',
    ten: 'Vest 3 mảnh xám tro',
    loai: 'vest',
    moTa: 'Vest ba mảnh xám tro, gi-lê, thắt cà vạt hoa văn',
    noiBat: true,
  },
  {
    ma: 'so-mi-may-do',
    nguon: 'tham_khao',
    ten: 'Sơ mi may đo',
    loai: 'ao_so_mi',
    moTa: 'Sơ mi may đo nhiều màu: xanh nhạt, kem, hồng phấn, tím chấm bi',
    noiBat: true,
  },
  {
    ma: 'vest-xanh-xam-ca-vat',
    nguon: 'tiem',
    ten: 'Vest xanh xám — thắt cà vạt',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: ve áo và cà vạt chấm bi',
    noiBat: true,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-1',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: áo và quần đồng bộ trên ma-nơ-canh',
    noiBat: true,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-2',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ, ve xuôi',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: dáng áo một khuy, ve xuôi bản vừa',
    noiBat: true,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-3',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ, nhìn nghiêng',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: nhìn nghiêng thấy rõ đường bên',
    noiBat: true,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-1',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 1',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: cận cảnh ve áo và túi ngực',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-2',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 2',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: cận cảnh cổ áo và khuy cài',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-3',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 3',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: ve áo nhìn chính diện',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-4',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 4',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: đường may ve áo',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-5',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 5',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: cổ áo sơ mi trắng bên trong',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-6',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 6',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: ve áo và túi hộp',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-7',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 7',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: nẹp áo và khuy cài giữa',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tren-nguoi',
    nguon: 'tiem',
    ten: 'Vest xanh xám — thử dáng',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: thợ chỉnh form áo trên ma-nơ-canh',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-8',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 8',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: ve áo nhìn gần',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-ve-ao-9',
    nguon: 'tiem',
    ten: 'Vest xanh xám — cận ve áo 9',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: thân trước và khuy cài',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-4',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 4',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: áo và quần gấp trên giá',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-5',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 5',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: trọn bộ, nhìn hơi chếch',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-6',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 6',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: trọn bộ cùng áo vest xanh than bên cạnh',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-7',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 7',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: dáng áo và ống quần',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-8',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 8',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: thân áo và quần gấp phía trước',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-9',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 9',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: trọn bộ nhìn từ phía trái',
    noiBat: false,
  },
  {
    ma: 'vest-xanh-xam-tron-bo-10',
    nguon: 'tiem',
    ten: 'Vest xanh xám — trọn bộ 10',
    loai: 'vest',
    moTa: 'Ảnh chụp tại tiệm: trọn bộ, khung hình rộng',
    noiBat: false,
  },
]

/*
 * BASE_URL là thư mục gốc của trang, do vite.config.ts quyết định.
 * Chạy ở gốc thì nó là "/", trên GitHub Pages là "/may-do/".
 * Nó LUÔN kết thúc bằng dấu "/" nên nối thẳng, không thêm dấu nữa.
 *
 * Viết cứng "/anh/mau/..." là sai: trên GitHub Pages ảnh nằm ở
 * "/may-do/anh/mau/..." và cả 56 tấm sẽ không hiện.
 */

/** Đường dẫn ảnh bản to, dùng khi bấm vào xem chi tiết. */
export function anhTo(ma: string): string {
  return `${import.meta.env.BASE_URL}anh/mau/${ma}.jpg`
}

/** Đường dẫn ảnh bản nhỏ, dùng khi xếp lưới cho nhẹ máy. */
export function anhNho(ma: string): string {
  return `${import.meta.env.BASE_URL}anh/mau/nho/${ma}.jpg`
}

/** Những ảnh được chọn đưa ra trang khách xem. */
export const ANH_NOI_BAT: AnhCoSan[] = ANH_CO_SAN.filter((a) => a.noiBat)

/** Tìm một ảnh đại diện cho từng loại trang phục. */
export function anhDaiDienLoai(loai: LoaiTrangPhuc): AnhCoSan | undefined {
  return ANH_CO_SAN.find((a) => a.loai === loai && a.noiBat) ?? ANH_CO_SAN.find((a) => a.loai === loai)
}

/** Ảnh do chính tiệm chụp tại chỗ. */
export const ANH_CUA_TIEM: AnhCoSan[] = ANH_CO_SAN.filter((a) => a.nguon === 'tiem')

/** Nhãn nguồn ảnh, hiện dưới ảnh khi xem to. */
export const NHAN_NGUON: Record<AnhCoSan['nguon'], string> = {
  tiem: 'Ảnh chụp tại tiệm',
  tham_khao: 'Ảnh mẫu tham khảo',
}
