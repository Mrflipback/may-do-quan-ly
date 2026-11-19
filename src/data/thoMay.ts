import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, queryClient } from './chung'

/**
 * THỢ MAY
 * ------------------------------------------------------------------
 * Danh sách riêng, KHÔNG dùng lại bảng tài khoản nhân sự.
 *
 * Vì sao: thợ may thường không cần tài khoản đăng nhập. Bắt mỗi thợ
 * phải có tài khoản chỉ để được gắn tên vào đơn thì vừa phiền vừa mở
 * thêm cửa vào phần mềm một cách không cần thiết.
 *
 * Xem supabase/17_tho_may_chi_phi_ncc.sql.
 */

export interface ThoMay {
  id: string
  ho_ten: string
  so_dien_thoai: string
  ghi_chu: string | null
  dang_lam_viec: boolean
  ngay_tao: string
}

export interface ThoMayNhap {
  ho_ten: string
  so_dien_thoai: string
  ghi_chu: string | null
}

const KHOA_THO = ['tho-may'] as const

function lamMoi() {
  void queryClient.invalidateQueries({ queryKey: KHOA_THO })
  // Đơn hàng hiện tên thợ, nên đổi tên thợ là danh sách đơn phải vẽ lại
  void queryClient.invalidateQueries({ queryKey: KHOA.donHang })
}

/** @param caNguoiNghi true thì lấy cả thợ đã nghỉ việc. */
export function useDanhSachTho(caNguoiNghi = true) {
  return useQuery({
    queryKey: [...KHOA_THO, caNguoiNghi],
    staleTime: 60_000,
    queryFn: async (): Promise<ThoMay[]> => {
      let q = supabase.from('tho_may').select('*').order('ho_ten')
      if (!caNguoiNghi) q = q.eq('dang_lam_viec', true)
      const { data, error } = await q
      if (error) throw error
      return (Array.isArray(data) ? data : []) as ThoMay[]
    },
  })
}

export function useThemTho() {
  return useMutation({
    mutationFn: async (t: ThoMayNhap): Promise<void> => {
      if (!t.ho_ten.trim()) throw new Error('Phải có tên thợ.')
      const { error } = await supabase.from('tho_may').insert(t)
      if (error) throw error
    },
    onSuccess: lamMoi,
  })
}

export function useSuaTho() {
  return useMutation({
    mutationFn: async ({ id, ...t }: Partial<ThoMay> & { id: string }): Promise<void> => {
      const { error } = await supabase.from('tho_may').update(t).eq('id', id)
      if (error) throw error
    },
    onSuccess: lamMoi,
  })
}

/**
 * Cho thợ nghỉ việc — TẮT chứ không xoá.
 *
 * Xoá là đơn cũ mất tên người may, mà đó đúng là thứ cần tra lại khi
 * khách phàn nàn sau này.
 */
export function useChoThoNghi() {
  return useMutation({
    mutationFn: async ({ id, nghi }: { id: string; nghi: boolean }): Promise<void> => {
      const { error } = await supabase
        .from('tho_may')
        .update({ dang_lam_viec: !nghi })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: lamMoi,
  })
}

/* ------------------------------------------------------------------ */
/*  Thống kê theo thợ                                                  */
/* ------------------------------------------------------------------ */

export interface ThongKeTho {
  tho_may_id: string
  ho_ten: string
  dang_lam_viec: boolean
  so_don: number
  dang_may: number
  tre_hen: number
  tien_hang: number
}

export function useThongKeTho(tuNgay: string, denNgay: string) {
  return useQuery({
    queryKey: [...KHOA_THO, 'thong-ke', tuNgay, denNgay],
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<ThongKeTho[]> => {
      const { data, error } = await supabase.rpc('thong_ke_tho', {
        tu_ngay: tuNgay,
        den_ngay: denNgay,
      })
      if (error) throw error
      return (Array.isArray(data) ? data : []) as ThongKeTho[]
    },
  })
}
