import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, queryClient } from './chung'
import type { HoSoSoDo, HoSoSoDoNhap } from '@/types'

export function useDanhSachSoDo(khachHangId: string | null) {
  return useQuery({
    queryKey: [...KHOA.soDo, khachHangId],
    enabled: Boolean(khachHangId),
    queryFn: async (): Promise<HoSoSoDo[]> => {
      const { data, error } = await supabase
        .from('ho_so_so_do')
        .select('*')
        .eq('khach_hang_id', khachHangId!)
        .order('ngay_do', { ascending: false })
      if (error) throw error
      return (data ?? []) as HoSoSoDo[]
    },
  })
}

export function useThemSoDo() {
  return useMutation({
    mutationFn: async (nhap: HoSoSoDoNhap): Promise<HoSoSoDo> => {
      const { data, error } = await supabase
        .from('ho_so_so_do')
        .insert(nhap)
        .select()
        .single()
      if (error) throw error
      return data as HoSoSoDo
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.soDo })
    },
  })
}

export function useSuaSoDo() {
  return useMutation({
    mutationFn: async ({ id, nhap }: { id: string; nhap: HoSoSoDoNhap }): Promise<void> => {
      const { error } = await supabase.from('ho_so_so_do').update(nhap).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.soDo })
    },
  })
}

export function useXoaSoDo() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('ho_so_so_do').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.soDo })
    },
  })
}
