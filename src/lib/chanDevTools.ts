import { useEffect } from 'react'

/**
 * CHẶN PHÍM TẮT MỞ CÔNG CỤ LẬP TRÌNH
 * ==================================================================
 *
 * ĐỌC CÁI NÀY TRƯỚC KHI SỬA — ĐỪNG TIN NÓ LÀ BẢO MẬT.
 *
 * Phần này KHÔNG chặn được công cụ lập trình của trình duyệt. Không gì
 * chặn được. Nó chỉ bắt vài phím tắt quen tay, và người ta đi vòng qua
 * trong ba giây:
 *
 *   · Bấm menu ⋮ của Chrome → More tools → Developer tools
 *   · Chuột phải → Inspect
 *   · Mở trình duyệt kèm sẵn cờ --auto-open-devtools-for-tabs
 *   · Tải file JS về, sửa, chạy bản của mình
 *   · Bỏ qua trình duyệt luôn, gọi thẳng máy chủ bằng curl
 *
 * Chủ tiệm biết rõ điều này và vẫn muốn có, để người tiện tay đừng
 * nghịch. Đó là lựa chọn hợp lý cho một cái gờ giảm tốc. Chỉ đừng bao
 * giờ dựa vào nó mà bỏ bớt chốt chặn ở máy chủ.
 *
 * THỨ THẬT SỰ GIỮ DỮ LIỆU:
 *   · Row Level Security trong 01_schema.sql
 *   · Mật khẩu xoá do máy chủ kiểm, 11_khoa_xoa_tren_may_chu.sql
 *
 * NHỮNG MẸO TÔI CỐ Ý KHÔNG DÙNG:
 *
 *   · Nhét `debugger` vào vòng lặp. Mẹo này làm phần mềm giật lag cho
 *     TẤT CẢ mọi người, và người biết việc tắt nó bằng một cú chuột
 *     phải ("Never pause here"). Hại nhiều hơn lợi.
 *   · Đo kích thước cửa sổ để đoán công cụ đang mở. Kéo công cụ ra
 *     cửa sổ riêng là hết đo được, mà phóng to chữ lại bị báo nhầm —
 *     người già mắt kém phóng chữ lên tự dưng bị đá ra.
 *   · Chặn chuột phải. Mất luôn chức năng dán, chọn chữ, mở thẻ mới —
 *     phiền người dùng thật nhiều hơn phiền người nghịch.
 */

/* ------------------------------------------------------------------ */
/*  ÁP DỤNG Ở ĐÂU                                                   */
/* ------------------------------------------------------------------ */
/*
 *   · Trang giới thiệu (/tiệm) và trang đăng nhập: LUÔN BẬT, viết cứng.
 *     Hai trang này không đọc bảng cai_dat (người xem chưa đăng nhập nên
 *     không có quyền đọc), mà thêm một lượt hỏi Supabase chỉ để biết
 *     có nuốt phím hay không thì không đáng — đi ngược việc tiết kiệm
 *     dung lượng. Nên viết cứng luôn.
 *
 *   · Phần quản lý: theo ô tích trong Cài đặt, tắt được. Phải tắt được,
 *     vì khi phần mềm có lỗi thì chính chủ tiệm hoặc người sửa cần mở
 *     công cụ ra xem.
 */

/** Những tổ hợp phím quen tay sẽ bị nuốt. */
function laPhimCongCu(e: KeyboardEvent): boolean {
  if (e.key === 'F12') return true

  // Ctrl+Shift+I / J / C  (Windows, Linux)
  if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) return true

  // Cmd+Option+I / J / C  (máy Mac)
  if (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) return true

  // Ctrl+U / Cmd+Option+U — xem mã nguồn trang
  if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'U' && !e.shiftKey) return true

  return false
}

let daGan: ((e: KeyboardEvent) => void) | null = null

/**
 * Bật hoặc tắt việc nuốt phím.
 *
 * Gọi lại nhiều lần cũng được — lần sau thay lần trước, không chồng
 * nhiều bộ bắt phím lên nhau.
 *
 * @param bat     có nuốt phím không
 * @param khiBam  gọi khi có người bấm, để màn hình nhắc một câu
 */
export function chanDevTools(bat: boolean, khiBam?: () => void): void {
  if (daGan) {
    window.removeEventListener('keydown', daGan, true)
    daGan = null
  }
  if (!bat) return

  daGan = (e: KeyboardEvent) => {
    if (!laPhimCongCu(e)) return
    e.preventDefault()
    e.stopPropagation()
    khiBam?.()
  }

  // Bắt ở pha "đi xuống" (capture) để tóm trước mọi thứ khác trong trang.
  // Vẫn không tóm được trình duyệt, vì trình duyệt đứng ngoài trang.
  window.addEventListener('keydown', daGan, true)
}

/**
 * Dành cho hai trang công khai: bật lúc mở trang, gỡ lúc rời trang.
 *
 * Không nhắc gì cả khi có người bấm — khách vào xem bảng giá mà bị hiện
 * một câu nội bộ của tiệm thì kỳ.
 */
export function useChanPhimTatCongKhai(): void {
  useEffect(() => {
    chanDevTools(true)
    return () => chanDevTools(false)
  }, [])
}
