import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { boDau } from '@/lib/utils'
import { KHOA, idNguoiDangNhap, lamMoiTien, queryClient } from './chung'
import type { KhachHang, KhachHangDayDu, KhachHangNhap } from '@/types'

/** Chuỗi không dấu dùng để tìm kiếm. */
function chuoiTimKiem(d: { ho_ten: string; so_dien_thoai: string; ma_khach?: string }): string {
  return boDau(`${d.ho_ten} ${d.so_dien_thoai} ${d.ma_khach ?? ''}`)
}

export type LocCongNo = 'tat_ca' | 'con_no' | 'da_tra_du'

export function useDanhSachKhachHang(tuKhoa: string, locCongNo: LocCongNo = 'tat_ca') {
  return useQuery({
    queryKey: [...KHOA.khachHang, 'ds', tuKhoa, locCongNo],
    queryFn: async (): Promise<KhachHangDayDu[]> => {
      let truyVan = supabase
        .from('v_khach_hang')
        .select('*')
        .order('ngay_tao', { ascending: false })
        .limit(500)

      const tk = boDau(tuKhoa)
      if (tk) truyVan = truyVan.ilike('tim_kiem', `%${tk}%`)
      if (locCongNo === 'con_no') truyVan = truyVan.gt('cong_no', 0)
      if (locCongNo === 'da_tra_du') truyVan = truyVan.lte('cong_no', 0)

      const { data, error } = await truyVan
      if (error) throw error
      return (data ?? []) as KhachHangDayDu[]
    },
  })
}

export function useKhachHang(id: string | null) {
  return useQuery({
    queryKey: [...KHOA.khachHang, 'mot', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<KhachHangDayDu | null> => {
      const { data, error } = await supabase
        .from('v_khach_hang')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return (data as KhachHangDayDu | null) ?? null
    },
  })
}

/** Danh sách rút gọn để đổ vào ô chọn khách hàng. */
export function useKhachHangRutGon() {
  return useQuery({
    queryKey: [...KHOA.khachHang, 'rut-gon'],
    queryFn: async (): Promise<Pick<KhachHang, 'id' | 'ho_ten' | 'so_dien_thoai' | 'ma_khach'>[]> => {
      const { data, error } = await supabase
        .from('khach_hang')
        .select('id, ho_ten, so_dien_thoai, ma_khach')
        .order('ho_ten')
        .limit(1000)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useThemKhachHang() {
  return useMutation({
    mutationFn: async (nhap: KhachHangNhap): Promise<KhachHang> => {
      const { data, error } = await supabase
        .from('khach_hang')
        .insert({
          ...nhap,
          tim_kiem: chuoiTimKiem(nhap),
          nguoi_tao: await idNguoiDangNhap(),
        })
        .select()
        .single()
      if (error) throw error

      // Mã khách do cơ sở dữ liệu sinh ra, phải cập nhật lại chuỗi tìm kiếm
      const kh = data as KhachHang
      await supabase
        .from('khach_hang')
        .update({ tim_kiem: chuoiTimKiem(kh) })
        .eq('id', kh.id)

      return kh
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.khachHang })
      void queryClient.invalidateQueries({ queryKey: KHOA.thongKe })
    },
  })
}

export function useSuaKhachHang() {
  return useMutation({
    mutationFn: async ({ id, nhap }: { id: string; nhap: KhachHangNhap }): Promise<void> => {
      // Lấy mã khách hiện tại để dựng lại chuỗi tìm kiếm cho đúng
      const { data: cu } = await supabase
        .from('khach_hang')
        .select('ma_khach')
        .eq('id', id)
        .maybeSingle()

      const { error } = await supabase
        .from('khach_hang')
        .update({
          ...nhap,
          tim_kiem: chuoiTimKiem({ ...nhap, ma_khach: cu?.ma_khach ?? '' }),
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.khachHang })
    },
  })
}

export function useXoaKhachHang() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('khach_hang').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.khachHang })
      lamMoiTien()
    },
  })
}
