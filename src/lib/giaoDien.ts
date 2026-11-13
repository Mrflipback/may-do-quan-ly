import { useCallback, useEffect, useState } from 'react'

/**
 * TUỲ CHỈNH GIAO DIỆN
 * ------------------------------------------------------------------
 * Tất cả lựa chọn ở đây chỉ làm MỘT việc: gắn lớp và thuộc tính lên thẻ
 * <html>. Phần còn lại nằm trong index.css. Nhờ vậy đổi màu, đổi cỡ chữ
 * hay đổi hiệu ứng là cả phần mềm đổi theo, không phải sửa từng màn hình.
 *
 *    <html class="toi" data-mau="ngoc" data-co-chu="lon" …>
 *
 * Lựa chọn lưu trong máy của từng người (localStorage), mỗi máy một kiểu,
 * không ảnh hưởng tới người khác trong tiệm.
 */

/* ----------------------------- Các lựa chọn ----------------------------- */

export type ChoDoGiaoDien = 'sang' | 'toi' | 'theo_may'
export type MauChuDao = 'navy' | 'ngoc' | 'rung' | 'tia' | 'gach' | 'than'
export type CoChu = 'nho' | 'vua' | 'lon'
export type BoGoc = 'vuong' | 'vua' | 'tron'
export type HieuUng = 'tat' | 'mo_dan' | 'truot_len' | 'truot_ngang' | 'phong_to' | 'nay'
export type TocDo = 'cham' | 'vua' | 'nhanh'

export interface CaiDatGiaoDien {
  che: ChoDoGiaoDien
  mau: MauChuDao
  coChu: CoChu
  bo: BoGoc
  hieuUng: HieuUng
  tocDo: TocDo
  /** Người dùng đã tự chọn hiệu ứng hay chưa (xem ghi chú ở apDung). */
  tuChonHieuUng: boolean
}

export const MAC_DINH: CaiDatGiaoDien = {
  che: 'theo_may',
  mau: 'navy',
  coChu: 'vua',
  bo: 'vua',
  hieuUng: 'truot_len',
  tocDo: 'vua',
  tuChonHieuUng: false,
}

/* ------------------------------- Nhãn ------------------------------- */

export const NHAN_GIAO_DIEN: Record<ChoDoGiaoDien, string> = {
  sang: 'Nền sáng',
  toi: 'Nền tối',
  theo_may: 'Theo máy',
}

export const MAU_CHU_DAO: { ma: MauChuDao; ten: string; xem: string }[] = [
  { ma: 'navy', ten: 'Xanh navy', xem: '#204274' },
  { ma: 'ngoc', ten: 'Xanh ngọc', xem: '#13635d' },
  { ma: 'rung', ten: 'Xanh rừng', xem: '#26571f' },
  { ma: 'tia', ten: 'Tím tía', xem: '#552ca3' },
  { ma: 'gach', ten: 'Đỏ gạch', xem: '#9b3123' },
  { ma: 'than', ten: 'Xám than', xem: '#3d4452' },
]

export const NHAN_CO_CHU: Record<CoChu, string> = {
  nho: 'Nhỏ',
  vua: 'Vừa',
  lon: 'Lớn',
}

export const NHAN_BO_GOC: Record<BoGoc, string> = {
  vuong: 'Góc vuông',
  vua: 'Bo vừa',
  tron: 'Bo tròn',
}

export const HIEU_UNG: { ma: HieuUng; ten: string; moTa: string }[] = [
  { ma: 'tat', ten: 'Tắt hiệu ứng', moTa: 'Hiện ra ngay, không chuyển động gì cả' },
  { ma: 'mo_dan', ten: 'Mờ dần', moTa: 'Nhẹ nhàng nhất, chỉ sáng dần lên' },
  { ma: 'truot_len', ten: 'Trượt lên', moTa: 'Nội dung đẩy nhẹ từ dưới lên' },
  { ma: 'truot_ngang', ten: 'Trượt ngang', moTa: 'Nội dung đẩy từ bên trái sang' },
  { ma: 'phong_to', ten: 'Phóng to', moTa: 'Nở ra từ giữa màn hình' },
  { ma: 'nay', ten: 'Nảy', moTa: 'Vui mắt nhất, bật nhẹ một cái rồi dừng' },
]

export const NHAN_TOC_DO: Record<TocDo, string> = {
  cham: 'Chậm',
  vua: 'Vừa',
  nhanh: 'Nhanh',
}

/* --------------------------- Đọc / ghi / áp dụng --------------------------- */

export const KHOA_GIAO_DIEN = 'may-do-giao-dien-v2'
/** Khoá cũ chỉ chứa chế độ sáng/tối. Giữ lại để không mất lựa chọn đã có. */
const KHOA_CU = 'may-do-giao-dien'

function mayDangToi(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function laMot<T extends string>(v: unknown, ds: readonly T[], md: T): T {
  return ds.includes(v as T) ? (v as T) : md
}

export function docCaiDat(): CaiDatGiaoDien {
  try {
    const tho = localStorage.getItem(KHOA_GIAO_DIEN)
    if (tho) {
      const o = JSON.parse(tho) as Partial<CaiDatGiaoDien>
      return {
        che: laMot(o.che, ['sang', 'toi', 'theo_may'] as const, MAC_DINH.che),
        mau: laMot(o.mau, ['navy', 'ngoc', 'rung', 'tia', 'gach', 'than'] as const, MAC_DINH.mau),
        coChu: laMot(o.coChu, ['nho', 'vua', 'lon'] as const, MAC_DINH.coChu),
        bo: laMot(o.bo, ['vuong', 'vua', 'tron'] as const, MAC_DINH.bo),
        hieuUng: laMot(
          o.hieuUng,
          ['tat', 'mo_dan', 'truot_len', 'truot_ngang', 'phong_to', 'nay'] as const,
          MAC_DINH.hieuUng,
        ),
        tocDo: laMot(o.tocDo, ['cham', 'vua', 'nhanh'] as const, MAC_DINH.tocDo),
        tuChonHieuUng: o.tuChonHieuUng === true,
      }
    }
    // Lần đầu chạy bản mới: lấy lại chế độ sáng/tối người dùng đã chọn trước đây
    const cu = localStorage.getItem(KHOA_CU)
    if (cu === 'sang' || cu === 'toi' || cu === 'theo_may') return { ...MAC_DINH, che: cu }
  } catch {
    /* trình duyệt chặn localStorage thì dùng mặc định */
  }
  return { ...MAC_DINH }
}

/**
 * Gắn mọi lựa chọn lên thẻ <html>.
 *
 * Về data-hieu-ung-tay: nếu máy đang bật "giảm chuyển động" (Windows ›
 * Cài đặt › Trợ năng › Hiệu ứng hình ảnh) thì mặc định phần mềm tắt hiệu
 * ứng cho hợp với máy. Nhưng khi người dùng đã TỰ TAY chọn một hiệu ứng
 * trong phần Giao diện thì ý họ thắng, nên đánh dấu lại ở đây.
 */
export function apDung(c: CaiDatGiaoDien): void {
  const g = document.documentElement
  g.classList.toggle('toi', c.che === 'toi' || (c.che === 'theo_may' && mayDangToi()))
  g.dataset.mau = c.mau
  g.dataset.coChu = c.coChu
  g.dataset.bo = c.bo
  g.dataset.hieuUng = c.hieuUng
  g.dataset.tocDo = c.tocDo
  if (c.tuChonHieuUng) g.dataset.hieuUngTay = '1'
  else delete g.dataset.hieuUngTay
}

export function luuCaiDat(c: CaiDatGiaoDien): void {
  try {
    localStorage.setItem(KHOA_GIAO_DIEN, JSON.stringify(c))
    // Giữ khoá cũ đúng với lựa chọn hiện tại — đoạn script chống nháy
    // trắng trong index.html đọc được cả hai khoá.
    localStorage.setItem(KHOA_CU, c.che)
  } catch {
    /* không lưu được thì vẫn đổi được cho phiên này */
  }
  apDung(c)
}

/* ------------------- Chia sẻ lựa chọn cho mọi màn hình ------------------- */

let hienTai: CaiDatGiaoDien | null = null
const nguoiNghe = new Set<(c: CaiDatGiaoDien) => void>()

function layHienTai(): CaiDatGiaoDien {
  if (!hienTai) hienTai = docCaiDat()
  return hienTai
}

function dat(moi: CaiDatGiaoDien): void {
  hienTai = moi
  luuCaiDat(moi)
  nguoiNghe.forEach((f) => f(moi))
}

/** Dùng trong giao diện: đọc lựa chọn hiện tại và đổi lựa chọn. */
export function useGiaoDien() {
  const [cai, setCai] = useState<CaiDatGiaoDien>(layHienTai)

  // Mọi màn hình cùng nghe một nguồn, đổi ở Cài đặt thì thanh trên cũng đổi
  useEffect(() => {
    nguoiNghe.add(setCai)
    return () => {
      nguoiNghe.delete(setCai)
    }
  }, [])

  // Đang để "Theo máy" thì nghe ngóng khi Windows đổi sáng/tối
  useEffect(() => {
    if (cai.che !== 'theo_may') return
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const doi = () => apDung(layHienTai())
    mq.addEventListener('change', doi)
    return () => mq.removeEventListener('change', doi)
  }, [cai.che])

  const doi = useCallback(<K extends keyof CaiDatGiaoDien>(khoa: K, gt: CaiDatGiaoDien[K]) => {
    const moi = { ...layHienTai(), [khoa]: gt }
    if (khoa === 'hieuUng') moi.tuChonHieuUng = true
    dat(moi)
  }, [])

  const doiCheDo = useCallback((che: ChoDoGiaoDien) => doi('che', che), [doi])

  const traVeMacDinh = useCallback(() => dat({ ...MAC_DINH }), [])

  return { cai, doi, doiCheDo, traVeMacDinh }
}

/** Máy có đang yêu cầu giảm chuyển động không (để báo cho người dùng biết). */
export function mayGiamChuyenDong(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Gọi một lần lúc mở phần mềm. */
export function khoiDongGiaoDien(): void {
  apDung(layHienTai())
}
