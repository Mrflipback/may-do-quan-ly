import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

/**
 * Ô TÍCH "TÔI KHÔNG PHẢI ROBOT"
 * ==================================================================
 * Supabase đang bật chống bot cho phần đăng nhập. Nghĩa là MỌI lời gọi
 * đăng nhập, đăng ký và quên mật khẩu đều phải kèm một mã captcha —
 * không có mã thì Supabase chặn trước cả khi xét tới mật khẩu.
 *
 * ĐIỀU QUAN TRỌNG NHẤT: MÃ CHỈ DÙNG ĐƯỢC MỘT LẦN.
 *
 * Gõ sai mật khẩu rồi bấm lại mà vẫn gửi mã cũ thì Supabase trả về lỗi
 * captcha, không phải lỗi mật khẩu — người dùng sẽ tưởng mình gõ đúng
 * mà máy vẫn chối. Nên sau MỖI lần gửi hỏng, phải gọi `datLai()` để
 * lấy mã mới. Mã cũng tự hết hạn sau khoảng hai phút.
 *
 * Phần kiểm mã nằm ở máy chủ Supabase, không phải ở đây — nên đây là
 * chốt chặn thật, khác với mấy lớp chỉ chạy trong trình duyệt.
 */

/**
 * Khoá công khai của tiệm.
 *
 * Khoá này CÔNG KHAI ĐƯỢC, nó nằm sẵn trong mã trang mà ai cũng xem
 * được — khác hẳn `secret key`, cái đó chỉ được dán vào Supabase.
 *
 * Đổi khoá thì sửa đúng dòng này. Hoặc khai VITE_HCAPTCHA_SITEKEY
 * trong file .env nếu muốn mỗi nơi một khoá.
 */
const KHOA_MAC_DINH = 'da9e5322-7f00-45da-b1ae-aabc73da2ef2'

export const KHOA_HCAPTCHA =
  (import.meta.env.VITE_HCAPTCHA_SITEKEY as string | undefined)?.trim() || KHOA_MAC_DINH

export interface TayCamHCaptcha {
  /** Xoá mã cũ và lấy mã mới. Gọi sau MỖI lần gửi hỏng. */
  datLai: () => void
}

interface Props {
  /** Nhận mã mỗi khi người dùng tích xong, hoặc null khi mã hết hạn. */
  khiCoMa: (ma: string | null) => void
}

export const OTichHCaptcha = forwardRef<TayCamHCaptcha, Props>(function OTichHCaptcha(
  { khiCoMa },
  ref,
) {
  const o = useRef<HCaptcha>(null)
  const [loi, setLoi] = useState('')

  useImperativeHandle(ref, () => ({
    datLai: () => {
      setLoi('')
      khiCoMa(null)
      try {
        o.current?.resetCaptcha()
      } catch {
        // Ô chưa dựng xong thì thôi, không có gì để dọn
      }
    },
  }))

  return (
    <div data-o-captcha>
      <HCaptcha
        ref={o}
        sitekey={KHOA_HCAPTCHA}
        languageOverride="vi"
        onVerify={(ma) => {
          setLoi('')
          khiCoMa(ma)
        }}
        // Mã hết hạn sau khoảng hai phút. Xoá đi để nút bấm khoá lại,
        // còn hơn để người dùng bấm rồi nhận một câu lỗi khó hiểu.
        onExpire={() => khiCoMa(null)}
        onError={() => {
          khiCoMa(null)
          setLoi('Không tải được ô xác thực. Kiểm tra lại đường mạng rồi thử lại.')
        }}
      />
      {loi && (
        <p className="mt-2 text-sm font-medium text-rose-700">{loi}</p>
      )}
    </div>
  )
})
