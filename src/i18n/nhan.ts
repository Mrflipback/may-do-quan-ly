import { useMemo } from 'react'
import { useT } from '@/i18n'
import { NHOM_SO_DO } from '@/lib/constants'
import {
  HIEU_UNG as HIEU_UNG_GOC,
  MAU_CHU_DAO as MAU_GOC,
  type BoGoc,
  type ChoDoGiaoDien,
  type CoChu,
  type HieuUng,
  type TocDo,
} from '@/lib/giaoDien'
import type {
  ChiSoDo,
  HinhThucThanhToan,
  LoaiTrangPhuc,
  TrangThaiDonHang,
  VaiTro,
} from '@/types'

/**
 * CÁC BẢNG NHÃN DÙNG CHUNG, ĐÃ DỊCH
 * ==================================================================
 * Trước đây mấy bảng này nằm cứng trong src/lib/constants.ts bằng tiếng
 * Việt. Giờ chúng phải đổi theo thứ tiếng người xem đang dùng.
 *
 * CÁCH DÙNG — gần như không phải sửa gì ở các màn hình cũ:
 *
 *     // bỏ dòng import cũ từ '@/lib/constants'
 *     const { NHAN_TRANG_THAI, NHAN_LOAI_TRANG_PHUC } = useNhan()
 *
 * Tên các bảng giữ nguyên y hệt, nên mọi chỗ gọi NHAN_TRANG_THAI[x]
 * bên dưới không phải động tới một chữ nào.
 *
 * Vì sao phải là MỘT CÁI MÓC (hook) chứ không phải hằng số: hằng số
 * được tính một lần lúc nạp phần mềm, đổi ngôn ngữ nó không biết mà
 * đổi theo. Cái móc thì vẽ lại cùng với màn hình.
 */
export function useNhan() {
  const { t } = useT()

  return useMemo(() => {
    const NHAN_TRANG_THAI: Record<TrangThaiDonHang, string> = {
      moi: t('trangThai.moi'),
      dang_may: t('trangThai.dang_may'),
      cho_thu: t('trangThai.cho_thu'),
      hoan_thanh: t('trangThai.hoan_thanh'),
      da_giao: t('trangThai.da_giao'),
      da_huy: t('trangThai.da_huy'),
    }

    const NHAN_LOAI_TRANG_PHUC: Record<LoaiTrangPhuc, string> = {
      ao_so_mi: t('loaiTrangPhuc.ao_so_mi'),
      quan_tay: t('loaiTrangPhuc.quan_tay'),
      vest: t('loaiTrangPhuc.vest'),
      vay: t('loaiTrangPhuc.vay'),
      ao_dai: t('loaiTrangPhuc.ao_dai'),
      khac: t('loaiTrangPhuc.khac'),
    }

    const NHAN_HINH_THUC_TT: Record<HinhThucThanhToan, string> = {
      tien_mat: t('hinhThucTT.tien_mat'),
      chuyen_khoan: t('hinhThucTT.chuyen_khoan'),
      the: t('hinhThucTT.the'),
      vi_dien_tu: t('hinhThucTT.vi_dien_tu'),
    }

    const NHAN_VAI_TRO: Record<VaiTro, string> = {
      quan_tri: t('vaiTro.quan_tri'),
      quan_ly: t('vaiTro.quan_ly'),
      nhan_vien: t('vaiTro.nhan_vien'),
    }

    const MO_TA_VAI_TRO: Record<VaiTro, string> = {
      quan_tri: t('vaiTro.quan_triMoTa'),
      quan_ly: t('vaiTro.quan_lyMoTa'),
      nhan_vien: t('vaiTro.nhan_vienMoTa'),
    }

    /*
     * Số đo: giữ nguyên MÃ và ĐƠN VỊ lấy từ constants.ts, chỉ thay phần
     * tên hiện ra màn hình. Mã là thứ ghi vào cơ sở dữ liệu nên tuyệt
     * đối không được đổi theo ngôn ngữ, nếu không số đo cũ sẽ lạc hết.
     */
    const TIEU_DE_NHOM = [t('soDo.nhomChung'), t('soDo.nhomTren'), t('soDo.nhomDuoi')]

    const NHOM_SO_DO_DICH: { tieuDe: string; chiSo: ChiSoDo[] }[] = NHOM_SO_DO.map(
      (nhom, i) => ({
        tieuDe: TIEU_DE_NHOM[i] ?? nhom.tieuDe,
        chiSo: nhom.chiSo.map((c) => ({ ...c, ten: t(`soDo.${c.ma}`) })),
      }),
    )

    const TAT_CA_CHI_SO_DICH: ChiSoDo[] = NHOM_SO_DO_DICH.flatMap((n) => n.chiSo)

    /** Tra nhanh tên một chỉ số theo mã, ví dụ "vong_nguc" -> "Chest". */
    const tenChiSo = (ma: string): string => t(`soDo.${ma}`)

    return {
      NHAN_TRANG_THAI,
      NHAN_LOAI_TRANG_PHUC,
      NHAN_HINH_THUC_TT,
      NHAN_VAI_TRO,
      MO_TA_VAI_TRO,
      NHOM_SO_DO: NHOM_SO_DO_DICH,
      TAT_CA_CHI_SO: TAT_CA_CHI_SO_DICH,
      tenChiSo,
    }
  }, [t])
}

/* ------------------------------------------------------------------ */
/*  Nhãn của mục Giao diện                                             */
/* ------------------------------------------------------------------ */

/**
 * Giống useNhan ở trên, nhưng cho mục Giao diện.
 *
 * Tên bảng giữ nguyên như trong src/lib/giaoDien.ts, nên màn hình cũ chỉ
 * cần đổi dòng import thành một dòng destructure là xong.
 */
export function useNhanGiaoDien() {
  const { t } = useT()

  return useMemo(() => {
    const NHAN_GIAO_DIEN: Record<ChoDoGiaoDien, string> = {
      sang: t('giaoDien.nenSang'),
      toi: t('giaoDien.nenToi'),
      theo_may: t('giaoDien.theoMay'),
    }

    // Giữ nguyên mã màu lấy từ giaoDien.ts, chỉ thay phần tên hiện ra
    const MAU_CHU_DAO = MAU_GOC.map((m) => ({
      ...m,
      ten: t(`giaoDien.mau${m.ma.charAt(0).toUpperCase()}${m.ma.slice(1)}`),
    }))

    const NHAN_CO_CHU: Record<CoChu, string> = {
      nho: t('giaoDien.coChuNho'),
      vua: t('giaoDien.coChuVua'),
      lon: t('giaoDien.coChuLon'),
    }

    const NHAN_BO_GOC: Record<BoGoc, string> = {
      vuong: t('giaoDien.boVuong'),
      vua: t('giaoDien.boVua'),
      tron: t('giaoDien.boTron'),
    }

    const KHOA_HIEU_UNG: Record<HieuUng, string> = {
      tat: 'huTat',
      mo_dan: 'huMoDan',
      truot_len: 'huTruotLen',
      truot_ngang: 'huTruotNgang',
      phong_to: 'huPhongTo',
      nay: 'huNay',
    }

    const HIEU_UNG = HIEU_UNG_GOC.map((h) => ({
      ma: h.ma,
      ten: t(`giaoDien.${KHOA_HIEU_UNG[h.ma]}`),
      moTa: t(`giaoDien.${KHOA_HIEU_UNG[h.ma]}MoTa`),
    }))

    const NHAN_TOC_DO: Record<TocDo, string> = {
      cham: t('giaoDien.tocDoCham'),
      vua: t('giaoDien.tocDoVua'),
      nhanh: t('giaoDien.tocDoNhanh'),
    }

    return { NHAN_GIAO_DIEN, MAU_CHU_DAO, NHAN_CO_CHU, NHAN_BO_GOC, HIEU_UNG, NHAN_TOC_DO }
  }, [t])
}
