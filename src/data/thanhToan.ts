import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, idNguoiDangNhap, lamMoiTien } from './chung'
import type { ThanhToanDayDu, ThanhToanNhap } from '@/types'

export function useLichSuThanhToan(donHangId?: string | null, soLuong = 50) {
  return useQuery({
    queryKey: [...KHOA.thanhToan, donHangId ?? 'tat-ca', soLuong],
    queryFn: async (): Promise<ThanhToanDayDu[]> => {
      let truyVan = supabase
        .from('v_thanh_toan')
        .select('*')
        .order('ngay_thanh_toan', { ascending: false })
        .order('ngay_tao', { ascending: false })
        .limit(soLuong)

      if (donHangId) truyVan = truyVan.eq('don_hang_id', donHangId)

      const { data, error } = await truyVan
      if (error) throw error
      return (data ?? []) as ThanhToanDayDu[]
    },
  })
}

export function useGhiThanhToan() {
  return useMutation({
    mutationFn: async (nhap: ThanhToanNhap): Promise<void> => {
      if (nhap.so_tien <= 0) throw new Error('Số tiền phải lớn hơn 0.')

      // Không cho thu quá số còn lại của đơn
      const { data: don, error: loiDon } = await supabase
        .from('v_don_hang')
        .select('con_lai, ma_don')
        .eq('id', nhap.don_hang_id)
        .maybeSingle()
      if (loiDon) throw loiDon

      if (don && nhap.so_tien > Number(don.con_lai) + 0.5) {
        throw new Error(
          `Đơn ${don.ma_don} chỉ còn phải thu ${Number(don.con_lai).toLocaleString('vi-VN')} ₫. ` +
            'Không thể thu nhiều hơn số này.',
        )
      }

      const { error } = await supabase
        .from('thanh_toan')
        .insert({ ...nhap, nguoi_tao: await idNguoiDangNhap() })
      if (error) throw error
    },
    onSuccess: () => lamMoiTien(),
  })
}

export function useXoaThanhToan() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('thanh_toan').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => lamMoiTien(),
  })
}
