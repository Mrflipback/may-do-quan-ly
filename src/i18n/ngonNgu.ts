/**
 * BẢY THỨ TIẾNG — NHẬN DIỆN VÀ CHUYỂN ĐỔI
 * ==================================================================
 * Thứ tự ưu tiên khi đoán xem người xem đọc tiếng gì:
 *
 *   1. Người đó đã TỰ CHỌN trong phần mềm   -> nghe theo, hết chuyện
 *   2. Địa chỉ có ?lang=th                   -> dùng để gửi link cho nhau
 *   3. Ngôn ngữ cài sẵn trong trình duyệt    -> chính xác nhất
 *   4. Múi giờ của máy                       -> đoán thêm, không cần mạng
 *   5. Tra địa chỉ IP (chạy ngầm, sau cùng)  -> chỉ khi 3 và 4 đều chịu
 *   6. Không đoán được                       -> TIẾNG ANH
 *
 * Vì sao ngôn ngữ trình duyệt đứng TRƯỚC tra IP: người Ấn sang Việt Nam
 * công tác vẫn đọc tiếng Anh hoặc tiếng Ấn, không đọc tiếng Việt. Cái
 * máy họ cầm nói đúng hơn cái mạng họ đang nối vào.
 */

export type MaNgonNgu = 'en' | 'vi' | 'zh' | 'th' | 'id' | 'hi' | 'km'

export const NGON_NGU_MAC_DINH: MaNgonNgu = 'en'

export interface MoTaNgonNgu {
  ma: MaNgonNgu
  /** Tên gọi bằng CHÍNH thứ tiếng đó — người ta mới nhận ra tiếng mình. */
  ten: string
  /** Tên tiếng Việt, để chủ tiệm đọc trong phần Cài đặt. */
  tenViet: string
  co: string
  /** Mã vùng cho Intl, dùng khi định dạng ngày và số. */
  locale: string
  /**
   * Phông chữ phải tải thêm. Chữ Thái, Khmer, Ấn, Trung không nằm trong
   * phông hiện tại — thiếu là màn hình hiện ra một dãy ô vuông.
   */
  phong?: string
}

export const DANH_SACH_NGON_NGU: MoTaNgonNgu[] = [
  { ma: 'en', ten: 'English', tenViet: 'Tiếng Anh', co: '🇬🇧', locale: 'en-US' },
  { ma: 'vi', ten: 'Tiếng Việt', tenViet: 'Tiếng Việt', co: '🇻🇳', locale: 'vi-VN' },
  {
    ma: 'zh',
    ten: '中文',
    tenViet: 'Tiếng Trung',
    co: '🇨🇳',
    locale: 'zh-CN',
    phong: 'Noto+Sans+SC:wght@400;500;600;700',
  },
  {
    ma: 'th',
    ten: 'ไทย',
    tenViet: 'Tiếng Thái',
    co: '🇹🇭',
    locale: 'th-TH',
    phong: 'Noto+Sans+Thai:wght@400;500;600;700',
  },
  { ma: 'id', ten: 'Bahasa Indonesia', tenViet: 'Tiếng Indonesia', co: '🇮🇩', locale: 'id-ID' },
  {
    ma: 'hi',
    ten: 'हिन्दी',
    tenViet: 'Tiếng Ấn (Hindi)',
    co: '🇮🇳',
    locale: 'hi-IN',
    phong: 'Noto+Sans+Devanagari:wght@400;500;600;700',
  },
  {
    ma: 'km',
    ten: 'ភាសាខ្មែរ',
    tenViet: 'Tiếng Khmer',
    co: '🇰🇭',
    locale: 'km-KH',
    phong: 'Noto+Sans+Khmer:wght@400;500;600;700',
  },
]

export const MA_HOP_LE = DANH_SACH_NGON_NGU.map((n) => n.ma)

export function laMaHopLe(v: unknown): v is MaNgonNgu {
  return typeof v === 'string' && (MA_HOP_LE as string[]).includes(v)
}

export function timNgonNgu(ma: MaNgonNgu): MoTaNgonNgu {
  return DANH_SACH_NGON_NGU.find((n) => n.ma === ma) ?? DANH_SACH_NGON_NGU[0]
}

/* ------------------------------------------------------------------ */
/*  Nhớ lựa chọn của người dùng                                        */
/* ------------------------------------------------------------------ */

export const KHOA_NGON_NGU = 'may-do-ngon-ngu'

export function docLuaChonDaLuu(): MaNgonNgu | null {
  try {
    const v = localStorage.getItem(KHOA_NGON_NGU)
    return laMaHopLe(v) ? v : null
  } catch {
    return null
  }
}

export function luuLuaChon(ma: MaNgonNgu): void {
  try {
    localStorage.setItem(KHOA_NGON_NGU, ma)
  } catch {
    /* trình duyệt chặn localStorage thì vẫn đổi được cho phiên này */
  }
}

/* ------------------------------------------------------------------ */
/*  Đoán từ trình duyệt                                                */
/* ------------------------------------------------------------------ */

/** "zh-TW" -> "zh", "en-US" -> "en". Lấy phần đầu trước dấu gạch. */
function goc(the: string): string {
  return the.toLowerCase().split('-')[0]
}

/** Đọc danh sách ngôn ngữ người dùng cài trong trình duyệt. */
export function doanTuTrinhDuyet(): MaNgonNgu | null {
  if (typeof navigator === 'undefined') return null
  const ds = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const the of ds) {
    if (!the) continue
    const g = goc(the)
    if (laMaHopLe(g)) return g
    // Người Đài Loan, Hồng Kông để máy là zh-TW, zh-HK
    if (g === 'zh') return 'zh'
    // Vài trình duyệt cũ ghi tiếng Indonesia là "in"
    if (g === 'in') return 'id'
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  Đoán từ múi giờ — không cần mạng, không lộ gì                      */
/* ------------------------------------------------------------------ */

/*
 * CHI nhan nhung mui gio CHI THUOC VE MOT NUOC.
 *
 * TUYET DOI KHONG them 'Asia/Bangkok' vao day. Windows gop ca ba nuoc
 * vao MOT muc ten la "(UTC+07:00) Bangkok, Hanoi, Jakarta", va trinh
 * duyet bao mui gio do la "Asia/Bangkok". Nghia la may cua mot tiem may
 * o Viet Nam cung bao "Asia/Bangkok" y het may o Thai Lan.
 *
 * Da tung dung no, va ket qua la khach Viet Nam bi doi sang tieng Thai.
 * Gap mui gio nhap nhang thi de cho buoc tra dia chi IP quyet dinh, vi
 * no biet dung ten nuoc.
 */
const THEO_MUI_GIO: Record<string, MaNgonNgu> = {
  'Asia/Ho_Chi_Minh': 'vi',
  'Asia/Saigon': 'vi',
  'Asia/Phnom_Penh': 'km',
  'Asia/Jakarta': 'id',
  'Asia/Pontianak': 'id',
  'Asia/Makassar': 'id',
  'Asia/Jayapura': 'id',
  'Asia/Shanghai': 'zh',
  'Asia/Chongqing': 'zh',
  'Asia/Harbin': 'zh',
  'Asia/Urumqi': 'zh',
  'Asia/Taipei': 'zh',
  'Asia/Hong_Kong': 'zh',
  'Asia/Macau': 'zh',
  'Asia/Kolkata': 'hi',
  'Asia/Calcutta': 'hi',
}

export function doanTuMuiGio(): MaNgonNgu | null {
  try {
    const mg = Intl.DateTimeFormat().resolvedOptions().timeZone
    return THEO_MUI_GIO[mg] ?? null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Đoán từ địa chỉ IP — chạy ngầm, chỉ khi hai cách trên đều chịu     */
/* ------------------------------------------------------------------ */

const THEO_QUOC_GIA: Record<string, MaNgonNgu> = {
  VN: 'vi',
  TH: 'th',
  KH: 'km',
  ID: 'id',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',
  SG: 'zh',
  IN: 'hi',
}

/**
 * Hỏi một dịch vụ bên ngoài xem địa chỉ IP này thuộc nước nào.
 *
 * NÓI THẲNG: cách này GỬI ĐỊA CHỈ MẠNG của người xem sang một công ty
 * khác. Đổi lại thì đoán được nước. Vì vậy nó chỉ chạy khi hai cách
 * trên (trình duyệt, múi giờ) đều không ra kết quả — tức là rất hiếm.
 *
 * Muốn tắt hẳn: đặt BAT_TRA_IP = false ở dưới.
 */
export const BAT_TRA_IP = true

export async function doanTuDiaChiMang(): Promise<MaNgonNgu | null> {
  if (!BAT_TRA_IP) return null
  try {
    const dung = new AbortController()
    const hen = setTimeout(() => dung.abort(), 2500)
    const tl = await fetch('https://api.country.is/', { signal: dung.signal })
    clearTimeout(hen)
    if (!tl.ok) return null
    const kq = (await tl.json()) as { country?: string }
    const nuoc = (kq.country ?? '').toUpperCase()
    return THEO_QUOC_GIA[nuoc] ?? null
  } catch {
    // Mất mạng, bị chặn, hết lượt miễn phí — im lặng bỏ qua
    return null
  }
}

/* ------------------------------------------------------------------ */
/*  Gộp lại                                                            */
/* ------------------------------------------------------------------ */

/** Đọc ?lang=th trên thanh địa chỉ. */
export function docTuDiaChi(): MaNgonNgu | null {
  try {
    const v = new URLSearchParams(window.location.search).get('lang')
    return laMaHopLe(v) ? v : null
  } catch {
    return null
  }
}

/**
 * Chọn ngôn ngữ để hiện NGAY lập tức, không chờ mạng.
 * Trả về cả cờ cho biết có nên tra IP thêm hay không.
 */
export function chonNgonNguNgay(): { ma: MaNgonNgu; nenTraIP: boolean } {
  const daChon = docLuaChonDaLuu()
  if (daChon) return { ma: daChon, nenTraIP: false }

  const tuDiaChi = docTuDiaChi()
  if (tuDiaChi) return { ma: tuDiaChi, nenTraIP: false }

  const tuTrinhDuyet = doanTuTrinhDuyet()
  if (tuTrinhDuyet) return { ma: tuTrinhDuyet, nenTraIP: false }

  const tuMuiGio = doanTuMuiGio()
  if (tuMuiGio) return { ma: tuMuiGio, nenTraIP: false }

  return { ma: NGON_NGU_MAC_DINH, nenTraIP: true }
}

/* ------------------------------------------------------------------ */
/*  Phông chữ                                                          */
/* ------------------------------------------------------------------ */

const daTaiPhong = new Set<string>()

/**
 * Nạp phông cho thứ tiếng đang dùng, và CHỈ thứ tiếng đó.
 * Nạp cả bảy là mỗi người xem phải tải mấy megabyte phông vô ích.
 */
export function napPhongChoNgonNgu(ma: MaNgonNgu): void {
  const n = timNgonNgu(ma)
  if (!n.phong || daTaiPhong.has(n.phong)) return
  daTaiPhong.add(n.phong)

  const the = document.createElement('link')
  the.rel = 'stylesheet'
  the.href = `https://fonts.googleapis.com/css2?family=${n.phong}&display=swap`
  document.head.appendChild(the)
}

/** Gắn mã ngôn ngữ lên thẻ <html> — cho trình đọc màn hình và Google. */
export function ganThuocTinhHtml(ma: MaNgonNgu): void {
  const n = timNgonNgu(ma)
  document.documentElement.lang = n.ma
  // Thêm phông của thứ tiếng đó lên đầu danh sách phông
  const theoNgonNgu: Partial<Record<MaNgonNgu, string>> = {
    zh: "'Noto Sans SC'",
    th: "'Noto Sans Thai'",
    hi: "'Noto Sans Devanagari'",
    km: "'Noto Sans Khmer'",
  }
  const them = theoNgonNgu[ma]
  document.documentElement.style.setProperty(
    '--font-ngon-ngu',
    them ? `${them}, ` : '',
  )
}
