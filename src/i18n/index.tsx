import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import en from './ban-dich/en.json'
import {
  DANH_SACH_NGON_NGU,
  chonNgonNguNgay,
  doanTuDiaChiMang,
  ganThuocTinhHtml,
  luuLuaChon,
  napPhongChoNgonNgu,
  timNgonNgu,
  type MaNgonNgu,
} from './ngonNgu'

/**
 * BẢN DỊCH — CÁCH DÙNG
 * ==================================================================
 *   const { t } = useT()
 *   <h1>{t('shop.tieuDe')}</h1>
 *   <p>{t('donHang.conLai', { so: '3' })}</p>
 *
 * Thiếu một câu ở tiếng nào đó thì TỰ ĐỘNG lấy câu tiếng Anh thay vào,
 * chứ không để màn hình trống hay hiện ra cái mã khó hiểu. Nhờ vậy dịch
 * dở dang vẫn dùng được, và bổ sung dần cũng không sao.
 *
 * Tiếng Anh nằm sẵn trong phần mềm (vì là ngôn ngữ mặc định). Sáu thứ
 * tiếng còn lại chỉ tải về khi có người dùng tới — ai xem tiếng Thái thì
 * chỉ tải bản tiếng Thái, không phải gánh cả bảy.
 */

type Cay = { [k: string]: string | Cay }

const CAC_BAN_DICH = import.meta.glob<{ default: Cay }>('./ban-dich/*.json')

const BAN_TIENG_ANH = en as Cay

/** Lấy giá trị theo đường dẫn kiểu "donHang.trangThai.moi". */
function doc(cay: Cay | undefined, duong: string): string | undefined {
  if (!cay) return undefined
  let cho: string | Cay | undefined = cay
  for (const doan of duong.split('.')) {
    if (typeof cho !== 'object' || cho === null) return undefined
    cho = cho[doan]
  }
  return typeof cho === 'string' ? cho : undefined
}

/** Thay {ten} trong câu bằng giá trị thật. */
function thayCho(cau: string, thamSo?: Record<string, string | number>): string {
  if (!thamSo) return cau
  return cau.replace(/\{(\w+)\}/g, (nguyenVan, khoa: string) => {
    const v = thamSo[khoa]
    return v === undefined ? nguyenVan : String(v)
  })
}

interface GiaTriNgonNgu {
  ma: MaNgonNgu
  /** Mã vùng cho Intl, ví dụ "th-TH". Dùng khi định dạng ngày và số. */
  locale: string
  t: (duong: string, thamSo?: Record<string, string | number>) => string
  doiNgonNgu: (ma: MaNgonNgu) => void
  danhSach: typeof DANH_SACH_NGON_NGU
  /** Đang tải bản dịch về. */
  dangTai: boolean
  /**
   * Tra địa chỉ mạng thấy người xem có lẽ ở nước nói thứ tiếng này.
   * CHỈ LÀ GỢI Ý — phần mềm hỏi chứ không tự đổi. Xem giải thích ở dưới.
   */
  goiY: MaNgonNgu | null
  boGoiY: () => void
}

const Ctx = createContext<GiaTriNgonNgu | null>(null)

export function useT(): GiaTriNgonNgu {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useT phải nằm trong <NhaCungCapNgonNgu>')
  return ctx
}

/** Tải một bản dịch. Tiếng Anh có sẵn nên trả về ngay. */
async function taiBanDich(ma: MaNgonNgu): Promise<Cay> {
  if (ma === 'en') return BAN_TIENG_ANH
  const nap = CAC_BAN_DICH[`./ban-dich/${ma}.json`]
  if (!nap) return BAN_TIENG_ANH
  try {
    return (await nap()).default
  } catch {
    // Mất mạng giữa chừng: thà hiện tiếng Anh còn hơn trang trắng
    return BAN_TIENG_ANH
  }
}

/** Gọi một lần lúc mở phần mềm, TRƯỚC khi vẽ, để khỏi nháy chữ. */
export async function chuanBiNgonNgu(): Promise<{ ma: MaNgonNgu; ban: Cay }> {
  const { ma } = chonNgonNguNgay()
  napPhongChoNgonNgu(ma)
  ganThuocTinhHtml(ma)
  return { ma, ban: await taiBanDich(ma) }
}

export function NhaCungCapNgonNgu({
  children,
  banDau,
}: {
  children: ReactNode
  banDau: { ma: MaNgonNgu; ban: Cay }
}) {
  const [ma, setMa] = useState<MaNgonNgu>(banDau.ma)
  const [ban, setBan] = useState<Cay>(banDau.ban)
  const [dangTai, setDangTai] = useState(false)
  const [goiY, setGoiY] = useState<MaNgonNgu | null>(null)

  const doiNgonNgu = useCallback(
    (moi: MaNgonNgu) => {
      if (moi === ma) return
      setDangTai(true)
      luuLuaChon(moi)
      napPhongChoNgonNgu(moi)
      void taiBanDich(moi).then((b) => {
        setBan(b)
        setMa(moi)
        ganThuocTinhHtml(moi)
        setDangTai(false)
        setGoiY(null)
      })
    },
    [ma],
  )

  /*
   * Hai cách đầu không đoán được thì mới hỏi tới địa chỉ mạng.
   *
   * VÀ CHỈ GỢI Ý, KHÔNG TỰ ĐỔI.
   *
   * Tra địa chỉ mạng cho biết CÁI MẠNG ở nước nào, không cho biết NGƯỜI
   * ĐÓ ĐỌC ĐƯỢC TIẾNG GÌ. Khách Pháp sang Việt Nam du lịch vẫn là người
   * Pháp: tự ý đổi trang sang tiếng Việt là làm họ không đọc được gì.
   *
   * Nên thay vì đổi, phần mềm hiện một dòng nhỏ hỏi "Xem bằng tiếng
   * Khmer?" và để người ta tự bấm. Đoán sai thì họ bỏ qua, không mất gì.
   */
  useEffect(() => {
    const { nenTraIP } = chonNgonNguNgay()
    if (!nenTraIP) return
    let conSong = true
    void doanTuDiaChiMang().then((tuMang) => {
      if (conSong && tuMang && tuMang !== ma) setGoiY(tuMang)
    })
    return () => {
      conSong = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const giaTri = useMemo<GiaTriNgonNgu>(
    () => ({
      ma,
      locale: timNgonNgu(ma).locale,
      danhSach: DANH_SACH_NGON_NGU,
      dangTai,
      goiY,
      boGoiY: () => setGoiY(null),
      doiNgonNgu,
      t: (duong, thamSo) => {
        const cau = doc(ban, duong) ?? doc(BAN_TIENG_ANH, duong)
        // Chưa dịch câu nào thì hiện luôn cái mã, để còn biết đường đi tìm
        return thayCho(cau ?? duong, thamSo)
      },
    }),
    [ma, ban, dangTai, goiY, doiNgonNgu],
  )

  return <Ctx.Provider value={giaTri}>{children}</Ctx.Provider>
}
