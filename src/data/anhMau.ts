import { useMutation, useQuery } from '@tanstack/react-query'
import { KHO_ANH, supabase } from '@/lib/supabase'
import { KHOA, idNguoiDangNhap, queryClient } from './chung'
import { taiAnhLen, veXemNhieuAnh, xoaAnh } from './anh'
import type { AnhMau, LoaiTrangPhuc } from '@/types'

export interface AnhMauCoVe extends AnhMau {
  /** Đường dẫn xem được trên trình duyệt, có hạn 1 tiếng. */
  urlXem: string | null
}

export function useThuVienMau(loc: LoaiTrangPhuc | 'tat_ca' = 'tat_ca') {
  return useQuery({
    queryKey: [...KHOA.anhMau, loc],
    queryFn: async (): Promise<AnhMauCoVe[]> => {
      let truyVan = supabase
        .from('anh_mau')
        .select('*')
        .order('ngay_tao', { ascending: false })
        .limit(300)
      if (loc !== 'tat_ca') truyVan = truyVan.eq('loai', loc)

      const { data, error } = await truyVan
      if (error) throw error

      const ds = (data ?? []) as AnhMau[]
      const ve = await veXemNhieuAnh(
        KHO_ANH.mau,
        ds.map((a) => a.duong_dan_anh),
      )
      return ds.map((a) => ({ ...a, urlXem: ve[a.duong_dan_anh] ?? null }))
    },
  })
}

interface ThemAnhMauNhap {
  file: File
  ten_mau: string
  loai: LoaiTrangPhuc
  mo_ta: string | null
  the_tag: string[]
}

export function useThemAnhMau() {
  return useMutation({
    mutationFn: async (nhap: ThemAnhMauNhap): Promise<void> => {
      const duongDan = await taiAnhLen(KHO_ANH.mau, nhap.file, nhap.loai)

      const { error } = await supabase.from('anh_mau').insert({
        ten_mau: nhap.ten_mau.trim(),
        loai: nhap.loai,
        duong_dan_anh: duongDan,
        mo_ta: nhap.mo_ta,
        the_tag: nhap.the_tag,
        nguoi_tao: await idNguoiDangNhap(),
      })

      // Nếu ghi vào bảng thất bại thì dọn luôn ảnh vừa tải lên,
      // tránh để lại rác trong kho.
      if (error) {
        await xoaAnh(KHO_ANH.mau, duongDan).catch(() => undefined)
        throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.anhMau })
    },
  })
}

export function useXoaAnhMau() {
  return useMutation({
    mutationFn: async (anh: AnhMau): Promise<void> => {
      const { error } = await supabase.from('anh_mau').delete().eq('id', anh.id)
      if (error) throw error
      await xoaAnh(KHO_ANH.mau, anh.duong_dan_anh).catch(() => undefined)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.anhMau })
    },
  })
}
