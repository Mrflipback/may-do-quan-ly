import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, queryClient } from './chung'
import type { CaiDat, DiemDoanhThu, NguoiDung, ThongKeTongQuan, VaiTro } from '@/types'

/* ------------------------- Bảng điều khiển ------------------------- */

export function useThongKeTongQuan() {
  return useQuery({
    queryKey: KHOA.thongKe,
    queryFn: async (): Promise<ThongKeTongQuan> => {
      const { data, error } = await supabase.rpc('thong_ke_tong_quan')
      if (error) throw error
      return data as ThongKeTongQuan
    },
  })
}

/* ---------------------------- Báo cáo ---------------------------- */

export type NhomBaoCao = 'ngay' | 'thang' | 'nam'

export function useBaoCaoDoanhThu(tuNgay: string, denNgay: string, nhom: NhomBaoCao) {
  return useQuery({
    queryKey: [...KHOA.baoCao, tuNgay, denNgay, nhom],
    retry: false,
    queryFn: async (): Promise<DiemDoanhThu[]> => {
      const { data, error } = await supabase.rpc('bao_cao_doanh_thu', {
        tu_ngay: tuNgay,
        den_ngay: denNgay,
        nhom,
      })
      if (error) throw error
      return (data ?? []) as DiemDoanhThu[]
    },
  })
}

/* --------------------------- Cài đặt tiệm --------------------------- */

export function useCaiDat() {
  return useQuery({
    queryKey: KHOA.caiDat,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from('cai_dat').select('khoa, gia_tri')
      if (error) throw error
      const kq: Record<string, string> = {}
      for (const d of (data ?? []) as CaiDat[]) kq[d.khoa] = d.gia_tri
      return kq
    },
  })
}

export function useLuuCaiDat() {
  return useMutation({
    mutationFn: async (gia_tri: Record<string, string>): Promise<void> => {
      const cacDong = Object.entries(gia_tri).map(([khoa, v]) => ({
        khoa,
        gia_tri: v,
        ngay_cap_nhat: new Date().toISOString(),
      }))
      const { error } = await supabase.from('cai_dat').upsert(cacDong, { onConflict: 'khoa' })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.caiDat })
    },
  })
}

/* ------------------------- Tài khoản nhân sự ------------------------- */

export function useDanhSachNguoiDung() {
  return useQuery({
    queryKey: KHOA.nguoiDung,
    queryFn: async (): Promise<NguoiDung[]> => {
      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('*')
        .order('ngay_tao')
      if (error) throw error
      return (data ?? []) as NguoiDung[]
    },
  })
}

export function useDoiVaiTro() {
  return useMutation({
    mutationFn: async ({ id, vaiTro }: { id: string; vaiTro: VaiTro }): Promise<void> => {
      const { error } = await supabase.from('nguoi_dung').update({ vai_tro: vaiTro }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.nguoiDung })
    },
  })
}

/**
 * Xoá tài khoản khỏi tiệm.
 *
 * Xoá hồ sơ trong bảng nguoi_dung, người đó mất sạch quyền vào phần mềm ngay
 * lập tức. Chỉ Quản trị viên xoá được, và không ai tự xoá chính mình
 * (policy p_nd_xoa). Email đăng nhập vẫn còn nằm trong phần Authentication của
 * Supabase — muốn xoá hẳn email đó thì phải vào bảng điều khiển Supabase, vì
 * trình duyệt không được phép đụng vào danh sách tài khoản đăng nhập.
 */
export function useXoaNguoiDung() {
  return useMutation({
    mutationFn: async (id: string): Promise<number> => {
      const { data, error } = await supabase.from('nguoi_dung').delete().eq('id', id).select('id')
      if (error) throw error
      return (data ?? []).length
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.nguoiDung })
    },
  })
}

export function useSuaHoSoCuaToi() {
  return useMutation({
    mutationFn: async ({ id, ho_ten }: { id: string; ho_ten: string }): Promise<void> => {
      const { error } = await supabase.from('nguoi_dung').update({ ho_ten }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.nguoiDung })
    },
  })
}

/* ---------------------------- Sao lưu ---------------------------- */
// Đã chuyển sang src/data/saoLuu.ts — nơi giữ cả phần sao lưu lẫn phần
// khôi phục, để hai chiều luôn khớp danh sách bảng và thứ tự với nhau.
