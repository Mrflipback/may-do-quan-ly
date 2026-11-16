/**
 * ĐÁNH DẤU TRUY CẬP LẠ
 * ==================================================================
 * Soi nhật ký rồi gắn nhãn cho những dòng đáng nhìn kỹ.
 *
 * NGUYÊN TẮC ĐẶT RA TỪ ĐẦU: thà bỏ sót còn hơn báo oan.
 *
 * Một cuốn sổ đánh dấu đỏ chi chít thì chẳng ai buồn đọc nữa, và lúc
 * có chuyện thật thì dấu đỏ đó cũng chìm nghỉm giữa đống dấu đỏ vô
 * nghĩa. Nên mỗi dấu hiệu ở đây đều cố ý đặt ngưỡng rộng.
 *
 * VÀ ĐÂY CHỈ LÀ DẤU HIỆU, KHÔNG PHẢI BẰNG CHỨNG. Nhân viên ở lại muộn
 * dọn sổ sách là việc bình thường; đổi từ wifi sang 4G là đổi IP thật.
 * Phần mềm chỉ nói "chỗ này đáng nhìn", còn kết luận là việc của người.
 *
 * Mấy hàm trong file này đều là hàm thuần — đưa vào cùng một dữ liệu
 * thì luôn ra cùng một kết quả, không đụng mạng, không đụng màn hình.
 * Nhờ vậy kiểm được bằng máy.
 */

/** Khung giờ coi là "tiệm đã đóng cửa". Chủ tiệm tự đặt trong Cài đặt. */
export interface KhungGioDem {
  /** Giờ bắt đầu, 0–23. Ví dụ 22 nghĩa là 22h. */
  tu: number
  /** Giờ kết thúc, 0–23. Ví dụ 6 nghĩa là 6h sáng. */
  den: number
}

export const KHUNG_GIO_MAC_DINH: KhungGioDem = { tu: 22, den: 6 }

/** Tên hai ô lưu trong bảng cai_dat. */
export const KHOA_GIO_TU = 'gio_dem_tu'
export const KHOA_GIO_DEN = 'gio_dem_den'

export function docKhungGio(caiDat: Record<string, string> | undefined): KhungGioDem {
  const so = (v: string | undefined, macDinh: number) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 0 && n <= 23 ? n : macDinh
  }
  return {
    tu: so(caiDat?.[KHOA_GIO_TU], KHUNG_GIO_MAC_DINH.tu),
    den: so(caiDat?.[KHOA_GIO_DEN], KHUNG_GIO_MAC_DINH.den),
  }
}

/**
 * Thời điểm này có rơi vào khung giờ tiệm đóng cửa không.
 *
 * Tính theo GIỜ TRÊN MÁY ĐANG XEM, không phải giờ quốc tế. Máy của chủ
 * tiệm chạy đúng giờ tiệm, nên cách này tự đúng múi giờ mà không phải
 * khai báo gì.
 *
 * Khung giờ đêm vắt qua nửa đêm (22h → 6h) nên phải xét hai đoạn, chứ
 * so kiểu `gio >= tu && gio < den` là luôn sai.
 */
export function laGioDem(iso: string, khung: KhungGioDem): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const gio = d.getHours()
  // tu === den nghĩa là khung rỗng, không đánh dấu gì
  if (khung.tu === khung.den) return false
  return khung.tu > khung.den
    ? gio >= khung.tu || gio < khung.den // vắt qua nửa đêm
    : gio >= khung.tu && gio < khung.den // nằm gọn trong ngày
}

/** Ngày theo giờ địa phương, dạng yyyy-mm-dd. Dùng để gom theo ngày. */
function ngayDiaPhuong(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

/* ================================================================== */
/*  NHẬT KÝ ĐĂNG NHẬP                                                  */
/* ================================================================== */

export interface DongDeSoi {
  thoi_diem: string
  nguoi_id: string | null
  dia_chi_ip: string | null
  loai_su_kien: string
  ip_la?: boolean
}

/** Mã của từng dấu hiệu, để màn hình biết hiện nhãn nào. */
export type DauHieuDangNhap = 'ip_la' | 'gio_dem' | 'nhieu_ip'

export const NHAN_DAU_HIEU_DANG_NHAP: Record<DauHieuDangNhap, string> = {
  ip_la: 'địa chỉ mạng lạ',
  gio_dem: 'vào lúc tiệm đóng cửa',
  nhieu_ip: 'nhiều địa chỉ trong một ngày',
}

export const GIAI_THICH_DANG_NHAP: Record<DauHieuDangNhap, string> = {
  ip_la: 'Lần đầu tài khoản này vào từ địa chỉ mạng đó, tính trên toàn bộ lịch sử.',
  gio_dem: 'Giờ này nằm trong khung bạn đặt là tiệm đã đóng cửa.',
  nhieu_ip:
    'Cùng một người vào từ hai địa chỉ mạng trở lên trong cùng ngày. ' +
    'Đổi từ wifi sang 4G cũng ra như vậy, nên đây là dấu hiệu yếu nhất.',
}

/**
 * Soi cả danh sách rồi trả về dấu hiệu cho từng dòng.
 *
 * Trả về một Map theo chỉ số dòng, không gắn thẳng vào dữ liệu gốc —
 * để dữ liệu máy chủ gửi về giữ nguyên, muốn đối chiếu lúc nào cũng được.
 */
export function soiDangNhap(
  ds: DongDeSoi[],
  khung: KhungGioDem,
): Map<number, DauHieuDangNhap[]> {
  // Đếm số địa chỉ khác nhau của từng người trong từng ngày
  const theoNguoiNgay = new Map<string, Set<string>>()
  for (const d of ds) {
    if (d.loai_su_kien !== 'vao' || !d.dia_chi_ip) continue
    const khoa = `${d.nguoi_id ?? '?'}|${ngayDiaPhuong(d.thoi_diem)}`
    const cu = theoNguoiNgay.get(khoa) ?? new Set<string>()
    cu.add(d.dia_chi_ip)
    theoNguoiNgay.set(khoa, cu)
  }

  const kq = new Map<number, DauHieuDangNhap[]>()
  ds.forEach((d, i) => {
    const dau: DauHieuDangNhap[] = []
    if (d.ip_la) dau.push('ip_la')
    if (laGioDem(d.thoi_diem, khung)) dau.push('gio_dem')
    if (d.loai_su_kien === 'vao' && d.dia_chi_ip) {
      const khoa = `${d.nguoi_id ?? '?'}|${ngayDiaPhuong(d.thoi_diem)}`
      if ((theoNguoiNgay.get(khoa)?.size ?? 0) >= 2) dau.push('nhieu_ip')
    }
    if (dau.length > 0) kq.set(i, dau)
  })
  return kq
}

/* ================================================================== */
/*  NHẬT KÝ HOẠT ĐỘNG                                                  */
/* ================================================================== */

export interface ViecDeSoi {
  thoi_diem: string
  nguoi_id: string | null
  bang: string
  hanh_dong: string
  tien_truoc: number | null
  tien_sau: number | null
}

export type DauHieuHoatDong = 'xoa_tien' | 'giam_tien' | 'gio_dem' | 'xoa_lien_tiep'

export const NHAN_DAU_HIEU_HOAT_DONG: Record<DauHieuHoatDong, string> = {
  xoa_tien: 'xoá tiền khách đã trả',
  giam_tien: 'sửa tiền thấp xuống',
  gio_dem: 'làm lúc tiệm đóng cửa',
  xoa_lien_tiep: 'xoá nhiều thứ liên tiếp',
}

export const GIAI_THICH_HOAT_DONG: Record<DauHieuHoatDong, string> = {
  xoa_tien: 'Một khoản khách đã trả bị xoá khỏi sổ. Đây là thứ đáng soi nhất về tiền bạc.',
  giam_tien: 'Một khoản tiền đã ghi bị sửa thành số nhỏ hơn.',
  gio_dem: 'Giờ này nằm trong khung bạn đặt là tiệm đã đóng cửa.',
  xoa_lien_tiep:
    'Từ ba lần xoá trở lên trong mười phút, bởi cùng một người. ' +
    'Dọn dẹp bình thường cũng có thể rơi vào đây.',
}

/** Ngưỡng cho dấu hiệu "xoá nhiều thứ liên tiếp". */
const SO_LAN_XOA = 3
const TRONG_PHUT = 10

/**
 * Soi nhật ký hoạt động.
 *
 * Danh sách đưa vào phải được sắp MỚI NHẤT TRƯỚC — đúng như máy chủ trả
 * về. Hàm tự xử lý thứ tự đó khi đếm chuỗi xoá liên tiếp.
 */
export function soiHoatDong(
  ds: ViecDeSoi[],
  khung: KhungGioDem,
): Map<number, DauHieuHoatDong[]> {
  const kq = new Map<number, DauHieuHoatDong[]>()

  // Gom các lần xoá theo người, rồi tìm cụm ba lần trong mười phút
  const lanXoa = new Map<string, { i: number; luc: number }[]>()
  ds.forEach((d, i) => {
    if (d.hanh_dong !== 'xoa') return
    const t = new Date(d.thoi_diem).getTime()
    if (Number.isNaN(t)) return
    const khoa = d.nguoi_id ?? '?'
    const cu = lanXoa.get(khoa) ?? []
    cu.push({ i, luc: t })
    lanXoa.set(khoa, cu)
  })

  const trongCum = new Set<number>()
  for (const ds2 of lanXoa.values()) {
    // Sắp theo thời gian tăng dần cho dễ quét bằng cửa sổ trượt
    const sap = [...ds2].sort((a, b) => a.luc - b.luc)
    let dau = 0
    for (let cuoi = 0; cuoi < sap.length; cuoi++) {
      while (sap[cuoi].luc - sap[dau].luc > TRONG_PHUT * 60_000) dau++
      if (cuoi - dau + 1 >= SO_LAN_XOA) {
        for (let k = dau; k <= cuoi; k++) trongCum.add(sap[k].i)
      }
    }
  }

  ds.forEach((d, i) => {
    const dau: DauHieuHoatDong[] = []

    if (d.bang === 'thanh_toan' && d.hanh_dong === 'xoa') dau.push('xoa_tien')

    // Chỉ tính khi CÓ CẢ HAI con số và số sau NHỎ HƠN. Sửa tiền lên thì
    // không đánh dấu — không ai ăn bớt bằng cách cộng thêm.
    if (
      d.bang === 'thanh_toan' &&
      d.hanh_dong === 'sua' &&
      d.tien_truoc !== null &&
      d.tien_sau !== null &&
      Number(d.tien_sau) < Number(d.tien_truoc)
    ) {
      dau.push('giam_tien')
    }

    if (laGioDem(d.thoi_diem, khung)) dau.push('gio_dem')
    if (trongCum.has(i)) dau.push('xoa_lien_tiep')

    if (dau.length > 0) kq.set(i, dau)
  })
  return kq
}
