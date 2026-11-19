import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { boDau } from '@/lib/utils'
import { KHOA, idNguoiDangNhap, queryClient } from './chung'
import type { GiaoDichKho, LoaiGiaoDichKho, LoaiVatTu, VatTuDayDu, VatTuNhap } from '@/types'

function lamMoiKho() {
  void queryClient.invalidateQueries({ queryKey: KHOA.vatTu })
  void queryClient.invalidateQueries({ queryKey: KHOA.giaoDichKho })
  void queryClient.invalidateQueries({ queryKey: KHOA.thongKe })
}

export function useDanhSachVatTu(loc: LoaiVatTu | 'tat_ca' = 'tat_ca', tuKhoa = '') {
  return useQuery({
    queryKey: [...KHOA.vatTu, 'ds', loc, tuKhoa],
    queryFn: async (): Promise<VatTuDayDu[]> => {
      let truyVan = supabase.from('v_vat_tu').select('*').order('ma_vat_tu').limit(500)
      if (loc !== 'tat_ca') truyVan = truyVan.eq('loai', loc)

      const tk = boDau(tuKhoa)
      if (tk) truyVan = truyVan.ilike('tim_kiem', `%${tk}%`)

      const { data, error } = await truyVan
      if (error) throw error
      return (data ?? []) as VatTuDayDu[]
    },
  })
}

export function useVatTuSapHet() {
  return useQuery({
    queryKey: [...KHOA.vatTu, 'sap-het'],
    queryFn: async (): Promise<VatTuDayDu[]> => {
      const { data, error } = await supabase.from('v_vat_tu').select('*').limit(500)
      if (error) throw error
      return ((data ?? []) as VatTuDayDu[])
        .filter((v) => Number(v.ton_kho) < Number(v.ton_toi_thieu))
        .sort((a, b) => Number(a.ton_kho) / (Number(a.ton_toi_thieu) || 1) -
                        Number(b.ton_kho) / (Number(b.ton_toi_thieu) || 1))
        .slice(0, 6)
    },
  })
}

export function useLuuVatTu() {
  return useMutation({
    mutationFn: async ({ id, nhap }: { id?: string | null; nhap: VatTuNhap }): Promise<void> => {
      const duLieu = {
        ...nhap,
        ma_vat_tu: nhap.ma_vat_tu.trim().toUpperCase(),
        tim_kiem: boDau(`${nhap.ma_vat_tu} ${nhap.ten_vat_tu} ${nhap.nha_cung_cap ?? ''}`),
      }

      if (id) {
        const { error } = await supabase.from('vat_tu').update(duLieu).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vat_tu').insert(duLieu)
        if (error) throw error
      }
    },
    onSuccess: lamMoiKho,
  })
}

export function useXoaVatTu() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('vat_tu').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: lamMoiKho,
  })
}

interface GiaoDichNhap {
  vat_tu_id: string
  loai: LoaiGiaoDichKho
  so_luong: number
  don_gia: number | null
  ngay: string
  ghi_chu: string | null
  /** Xuất vải cho đơn nào. Để trống thì không tính được lãi của đơn. */
  don_hang_id?: string | null
  /** Nhập vải từ ai. Để trống thì sổ nợ nhà cung cấp không cộng khoản này. */
  nha_cung_cap_id?: string | null
}

export function useGhiGiaoDichKho() {
  return useMutation({
    mutationFn: async (nhap: GiaoDichNhap): Promise<void> => {
      if (nhap.so_luong <= 0) throw new Error('Số lượng phải lớn hơn 0.')

      // Không cho xuất quá số đang có trong kho
      if (nhap.loai === 'xuat') {
        const { data: vt, error: loiVt } = await supabase
          .from('v_vat_tu')
          .select('ton_kho, ten_vat_tu, don_vi_tinh')
          .eq('id', nhap.vat_tu_id)
          .maybeSingle()
        if (loiVt) throw loiVt

        if (vt && nhap.so_luong > Number(vt.ton_kho)) {
          throw new Error(
            `Kho chỉ còn ${Number(vt.ton_kho).toLocaleString('vi-VN')} ${vt.don_vi_tinh} ` +
              `"${vt.ten_vat_tu}". Không xuất được nhiều hơn số này.`,
          )
        }
      }

      const { error } = await supabase
        .from('giao_dich_kho')
        .insert({ ...nhap, nguoi_tao: await idNguoiDangNhap() })
      if (error) throw error
    },
    onSuccess: lamMoiKho,
  })
}

export function useLichSuKho(vatTuId: string | null) {
  return useQuery({
    queryKey: [...KHOA.giaoDichKho, vatTuId],
    enabled: Boolean(vatTuId),
    queryFn: async (): Promise<GiaoDichKho[]> => {
      const { data, error } = await supabase
        .from('giao_dich_kho')
        .select('*')
        .eq('vat_tu_id', vatTuId!)
        .order('ngay', { ascending: false })
        .order('ngay_tao', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as GiaoDichKho[]
    },
  })
}
