import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, queryClient, idNguoiDangNhap } from './chung'

/**
 * CHI PHÍ CHUNG VÀ CÔNG NỢ NHÀ CUNG CẤP
 * ------------------------------------------------------------------
 * Hai mảng tiền RA, bù lại cho phần tiền VÀO vốn đã theo dõi kỹ.
 *
 * Tiền vải không nằm ở đây — nó đã có trong kho. Chi phí ở đây là
 * những khoản khác: thuê nhà, điện nước, lương thợ, mua sắm.
 *
 * Xem supabase/17_tho_may_chi_phi_ncc.sql.
 */

export type LoaiChiPhi = 'thue_nha' | 'dien_nuoc' | 'luong' | 'mua_sam' | 'van_chuyen' | 'khac'

export const NHAN_LOAI_CHI_PHI: Record<LoaiChiPhi, string> = {
  thue_nha: 'Thuê nhà',
  dien_nuoc: 'Điện nước',
  luong: 'Lương thợ',
  mua_sam: 'Mua sắm, máy móc',
  van_chuyen: 'Vận chuyển',
  khac: 'Khác',
}

export interface ChiPhi {
  id: string
  ngay: string
  loai: LoaiChiPhi
  so_tien: number
  ghi_chu: string | null
  ngay_tao: string
  nguoi_tao: string | null
}

const KHOA_CP = ['chi-phi'] as const
const KHOA_NCC = ['nha-cung-cap'] as const

function lamMoiTienRa() {
  void queryClient.invalidateQueries({ queryKey: KHOA_CP })
  void queryClient.invalidateQueries({ queryKey: KHOA_NCC })
  // Lãi lỗ phụ thuộc hai cái trên
  void queryClient.invalidateQueries({ queryKey: KHOA.baoCao })
}

export function useChiPhi(tuNgay: string, denNgay: string) {
  return useQuery({
    queryKey: [...KHOA_CP, tuNgay, denNgay],
    staleTime: 20_000,
    queryFn: async (): Promise<ChiPhi[]> => {
      const { data, error } = await supabase
        .from('chi_phi')
        .select('*')
        .gte('ngay', tuNgay)
        .lte('ngay', denNgay)
        .order('ngay', { ascending: false })
      if (error) throw error
      return (Array.isArray(data) ? data : []) as ChiPhi[]
    },
  })
}

export function useThemChiPhi() {
  return useMutation({
    mutationFn: async (c: {
      ngay: string
      loai: LoaiChiPhi
      so_tien: number
      ghi_chu: string | null
    }): Promise<void> => {
      if (c.so_tien <= 0) throw new Error('Số tiền phải lớn hơn 0.')
      const { error } = await supabase
        .from('chi_phi')
        .insert({ ...c, nguoi_tao: await idNguoiDangNhap() })
      if (error) throw error
    },
    onSuccess: lamMoiTienRa,
  })
}

export function useXoaChiPhi() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('chi_phi').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: lamMoiTienRa,
  })
}

/* ------------------------------------------------------------------ */
/*  Nhà cung cấp                                                       */
/* ------------------------------------------------------------------ */

export interface NhaCungCap {
  id: string
  ten: string
  so_dien_thoai: string
  dia_chi: string | null
  ghi_chu: string | null
  dang_hop_tac: boolean
  ngay_tao: string
}

/** Một dòng trong sổ nợ: đã nhập bao nhiêu, đã trả bao nhiêu, còn nợ. */
export interface CongNoNcc {
  id: string
  ten: string
  so_dien_thoai: string
  dia_chi: string | null
  dang_hop_tac: boolean
  tien_hang: number
  da_tra: number
  con_no: number
  lan_nhap_gan_nhat: string | null
  lan_tra_gan_nhat: string | null
}

export function useDanhSachNcc() {
  return useQuery({
    queryKey: KHOA_NCC,
    staleTime: 60_000,
    queryFn: async (): Promise<NhaCungCap[]> => {
      const { data, error } = await supabase.from('nha_cung_cap').select('*').order('ten')
      if (error) throw error
      return (Array.isArray(data) ? data : []) as NhaCungCap[]
    },
  })
}

export function useCongNoNcc() {
  return useQuery({
    queryKey: [...KHOA_NCC, 'cong-no'],
    staleTime: 20_000,
    queryFn: async (): Promise<CongNoNcc[]> => {
      const { data, error } = await supabase
        .from('v_cong_no_ncc')
        .select('*')
        .order('con_no', { ascending: false })
      if (error) throw error
      return (Array.isArray(data) ? data : []) as CongNoNcc[]
    },
  })
}

export function useThemNcc() {
  return useMutation({
    mutationFn: async (n: {
      ten: string
      so_dien_thoai: string
      dia_chi: string | null
      ghi_chu: string | null
    }): Promise<void> => {
      if (!n.ten.trim()) throw new Error('Phải có tên nhà cung cấp.')
      const { error } = await supabase.from('nha_cung_cap').insert(n)
      if (error) throw error
    },
    onSuccess: lamMoiTienRa,
  })
}

/** Ghi một lần trả tiền cho nhà cung cấp. */
export function useTraNcc() {
  return useMutation({
    mutationFn: async (t: {
      nha_cung_cap_id: string
      so_tien: number
      hinh_thuc: string
      ngay: string
      ghi_chu: string | null
    }): Promise<void> => {
      if (t.so_tien <= 0) throw new Error('Số tiền phải lớn hơn 0.')
      const { error } = await supabase
        .from('tra_nha_cung_cap')
        .insert({ ...t, nguoi_tao: await idNguoiDangNhap() })
      if (error) throw error
    },
    onSuccess: lamMoiTienRa,
  })
}

/* ------------------------------------------------------------------ */
/*  Báo cáo lãi lỗ                                                     */
/* ------------------------------------------------------------------ */

export interface LaiLo {
  doanh_thu: number
  vai_gan_don: number
  vai_chua_gan: number
  chi_phi_chung: number
  lai: number
}

export function useLaiLo(tuNgay: string, denNgay: string) {
  return useQuery({
    queryKey: [...KHOA.baoCao, 'lai-lo', tuNgay, denNgay],
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<LaiLo> => {
      const { data, error } = await supabase.rpc('bao_cao_lai_lo', {
        tu_ngay: tuNgay,
        den_ngay: denNgay,
      })
      if (error) throw error
      const d = Array.isArray(data) ? data[0] : data
      return (d ?? {
        doanh_thu: 0,
        vai_gan_don: 0,
        vai_chua_gan: 0,
        chi_phi_chung: 0,
        lai: 0,
      }) as LaiLo
    },
  })
}
