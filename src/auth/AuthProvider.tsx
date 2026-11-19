import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { DA_CAU_HINH, supabase } from '@/lib/supabase'
import { queryClient } from '@/data/chung'
import { dichLoi, ghiLoi } from '@/lib/loi'
import type { NguoiDung } from '@/types'

interface GiaTriAuth {
  /** Đang kiểm tra phiên đăng nhập lúc mới mở phần mềm. */
  dangTai: boolean
  phien: Session | null
  /** Hồ sơ nhân sự lấy từ bảng nguoi_dung. */
  hoSo: NguoiDung | null
  /** Đã hỏi xong bảng nguoi_dung chưa. Phân biệt "đang tải" với "hồ sơ đã bị xoá". */
  hoSoDaTai: boolean
  laQuanTri: boolean
  /** Quản trị viên HOẶC Quản lý. Dùng cho báo cáo và quyền xoá dữ liệu. */
  laQuanLy: boolean
  dangNhap: (email: string, matKhau: string, maCaptcha?: string) => Promise<void>
  dangKy: (email: string, matKhau: string, hoTen: string, maCaptcha?: string) => Promise<string>
  dangXuat: () => Promise<void>
  quenMatKhau: (email: string, maCaptcha?: string) => Promise<void>
  taiLaiHoSo: () => Promise<void>
}

const Ctx = createContext<GiaTriAuth | null>(null)

export function useAuth(): GiaTriAuth {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth phải nằm trong <NhaCungCapAuth>')
  return ctx
}

export function NhaCungCapAuth({ children }: { children: ReactNode }) {
  const [dangTai, setDangTai] = useState(true)
  const [phien, setPhien] = useState<Session | null>(null)
  const [hoSo, setHoSo] = useState<NguoiDung | null>(null)
  const [hoSoDaTai, setHoSoDaTai] = useState(false)

  /** Lấy hồ sơ nhân sự ứng với tài khoản đang đăng nhập. */
  const layHoSo = useCallback(async (userId: string): Promise<NguoiDung | null> => {
    const { data, error } = await supabase
      .from('nguoi_dung')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      ghiLoi('Lấy hồ sơ người dùng', error)
      return null
    }
    return (data as NguoiDung | null) ?? null
  }, [])

  // Khôi phục phiên đăng nhập khi mở phần mềm, và theo dõi đổi trạng thái
  useEffect(() => {
    if (!DA_CAU_HINH) {
      setDangTai(false)
      return
    }

    let conSong = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!conSong) return
        setPhien(data.session)
        if (data.session?.user) {
          setHoSo(await layHoSo(data.session.user.id))
          setHoSoDaTai(true)
        }
      })
      .catch((e) => ghiLoi('Khôi phục phiên đăng nhập', e))
      .finally(() => {
        if (conSong) setDangTai(false)
      })

    const { data: theoDoi } = supabase.auth.onAuthStateChange((_suKien, phienMoi) => {
      setPhien(phienMoi)
      if (phienMoi?.user) {
        setHoSoDaTai(false)
        void layHoSo(phienMoi.user.id).then((hs) => {
          if (!conSong) return
          setHoSo(hs)
          setHoSoDaTai(true)
        })
      } else {
        setHoSo(null)
        setHoSoDaTai(false)
      }
    })

    return () => {
      conSong = false
      theoDoi.subscription.unsubscribe()
    }
  }, [layHoSo])

  /*
   * Supabase đang bật chống bot cho phần đăng nhập, nên ba hàm dưới đây
   * đều phải kèm MÃ CAPTCHA. Thiếu mã là Supabase chặn trước cả khi xét
   * tới mật khẩu, và câu lỗi nói về captcha chứ không nói về mật khẩu.
   *
   * Mã CHỈ DÙNG ĐƯỢC MỘT LẦN. Gửi hỏng thì màn hình phải lấy mã mới
   * trước khi gửi lại — xem OTichHCaptcha.datLai().
   */
  const dangNhap = useCallback(async (email: string, matKhau: string, maCaptcha?: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: matKhau,
      options: { captchaToken: maCaptcha },
    })
    if (error) throw new Error(dichLoi(error))
  }, [])

  const dangKy = useCallback(
    async (
      email: string,
      matKhau: string,
      hoTen: string,
      maCaptcha?: string,
    ): Promise<string> => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: matKhau,
        options: { data: { ho_ten: hoTen.trim() }, captchaToken: maCaptcha },
      })
      if (error) throw new Error(dichLoi(error))

      // Nếu Supabase bắt xác nhận email thì chưa có phiên đăng nhập ngay
      if (data.session) {
        return 'Tạo tài khoản thành công. Đang vào phần mềm…'
      }
      return 'Đã tạo tài khoản. Hãy mở hộp thư và bấm vào liên kết xác nhận, rồi quay lại đăng nhập.'
    },
    [],
  )

  const dangXuat = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(dichLoi(error))
    setHoSo(null)
    setPhien(null)

    // Dọn sạch bộ nhớ đệm của người vừa ra.
    // Phần mềm là một trang duy nhất, đăng xuất rồi đăng nhập người khác
    // KHÔNG tải lại trang. Không dọn thì màn hình sẽ vẽ lại ngay dữ liệu
    // cũ còn trong bộ nhớ (khách hàng, đơn hàng, tiền nong) trước khi kịp
    // hỏi lại máy chủ — mà staleTime đang là 30 giây.
    queryClient.clear()
  }, [])

  const quenMatKhau = useCallback(async (email: string, maCaptcha?: string) => {
    // origin chỉ là "https://tiemmay.github.io", KHÔNG gồm thư mục con.
    // Phải ghép thêm BASE_URL, nếu không link trong email sẽ rơi ra ngoài
    // dự án và người dùng không đặt lại được mật khẩu.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}dang-nhap`,
      captchaToken: maCaptcha,
    })
    if (error) throw new Error(dichLoi(error))
  }, [])

  const taiLaiHoSo = useCallback(async () => {
    if (!phien?.user) return
    setHoSo(await layHoSo(phien.user.id))
  }, [phien, layHoSo])

  const giaTri = useMemo<GiaTriAuth>(
    () => ({
      dangTai,
      phien,
      hoSo,
      hoSoDaTai,
      laQuanTri: hoSo?.vai_tro === 'quan_tri',
      laQuanLy: hoSo?.vai_tro === 'quan_tri' || hoSo?.vai_tro === 'quan_ly',
      dangNhap,
      dangKy,
      dangXuat,
      quenMatKhau,
      taiLaiHoSo,
    }),
    [dangTai, phien, hoSo, hoSoDaTai, dangNhap, dangKy, dangXuat, quenMatKhau, taiLaiHoSo],
  )

  return <Ctx.Provider value={giaTri}>{children}</Ctx.Provider>
}
