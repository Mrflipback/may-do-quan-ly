import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, idNguoiDangNhap, lamMoiTien, queryClient } from './chung'
import type {
  DongSanPham,
  DongSanPhamNhap,
  DonHangDayDu,
  DonHangNhap,
  TrangThaiDonHang,
} from '@/types'

export function useDanhSachDonHang(
  locTrangThai: TrangThaiDonHang | 'tat_ca' = 'tat_ca',
  khachHangId?: string | null,
) {
  return useQuery({
    queryKey: [...KHOA.donHang, 'ds', locTrangThai, khachHangId ?? ''],
    queryFn: async (): Promise<DonHangDayDu[]> => {
      let truyVan = supabase
        .from('v_don_hang')
        .select('*')
        .order('ngay_tao', { ascending: false })
        .limit(500)

      if (locTrangThai !== 'tat_ca') truyVan = truyVan.eq('trang_thai', locTrangThai)
      if (khachHangId) truyVan = truyVan.eq('khach_hang_id', khachHangId)

      const { data, error } = await truyVan
      if (error) throw error
      return (data ?? []) as DonHangDayDu[]
    },
  })
}

/** Đơn sắp tới hạn giao, dùng cho Bảng điều khiển. */
export function useDonSapToHan(soLuong = 8) {
  return useQuery({
    queryKey: [...KHOA.donHang, 'sap-to-han', soLuong],
    queryFn: async (): Promise<DonHangDayDu[]> => {
      const { data, error } = await supabase
        .from('v_don_hang')
        .select('*')
        .in('trang_thai', ['moi', 'dang_may', 'cho_thu', 'hoan_thanh'])
        .order('ngay_hen_giao', { ascending: true })
        .limit(soLuong)
      if (error) throw error
      return (data ?? []) as DonHangDayDu[]
    },
  })
}

export function useDonHang(id: string | null) {
  return useQuery({
    queryKey: [...KHOA.donHang, 'mot', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<DonHangDayDu | null> => {
      const { data, error } = await supabase
        .from('v_don_hang')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return (data as DonHangDayDu | null) ?? null
    },
  })
}

export function useDongSanPham(donHangId: string | null) {
  return useQuery({
    queryKey: [...KHOA.donHang, 'dong-sp', donHangId],
    enabled: Boolean(donHangId),
    queryFn: async (): Promise<DongSanPham[]> => {
      const { data, error } = await supabase
        .from('dong_san_pham')
        .select('*')
        .eq('don_hang_id', donHangId!)
        .order('thu_tu')
      if (error) throw error
      return (data ?? []) as DongSanPham[]
    },
  })
}

interface ThamSoLuuDon {
  id?: string | null
  don: DonHangNhap
  dongSanPham: DongSanPhamNhap[]
}

/**
 * Lưu đơn hàng cùng toàn bộ dòng sản phẩm.
 * Thêm mới hay sửa đều dùng chung hàm này.
 */
export function useLuuDonHang() {
  return useMutation({
    mutationFn: async ({ id, don, dongSanPham }: ThamSoLuuDon): Promise<string> => {
      if (dongSanPham.length === 0) {
        throw new Error('Đơn hàng phải có ít nhất một sản phẩm.')
      }

      let donId = id ?? null

      if (donId) {
        const { error } = await supabase.from('don_hang').update(don).eq('id', donId)
        if (error) throw error

        // Thay toàn bộ dòng sản phẩm bằng danh sách mới
        const { error: loiXoa } = await supabase
          .from('dong_san_pham')
          .delete()
          .eq('don_hang_id', donId)
        if (loiXoa) throw loiXoa
      } else {
        const { data, error } = await supabase
          .from('don_hang')
          .insert({ ...don, nguoi_tao: await idNguoiDangNhap() })
          .select('id')
          .single()
        if (error) throw error
        donId = (data as { id: string }).id
      }

      const cacDong = dongSanPham.map((sp, i) => ({
        don_hang_id: donId,
        ten_san_pham: sp.ten_san_pham.trim(),
        loai: sp.loai,
        so_luong: sp.so_luong,
        don_gia: sp.don_gia,
        ghi_chu: sp.ghi_chu,
        thu_tu: i,
      }))

      const { error: loiDong } = await supabase.from('dong_san_pham').insert(cacDong)
      if (loiDong) throw loiDong

      return donId
    },
    onSuccess: () => lamMoiTien(),
  })
}

export function useDoiTrangThaiDon() {
  return useMutation({
    mutationFn: async ({
      id,
      trangThai,
    }: {
      id: string
      trangThai: TrangThaiDonHang
    }): Promise<void> => {
      const capNhat: Record<string, unknown> = { trang_thai: trangThai }
      // Chuyển sang "Đã giao" thì ghi luôn ngày giao thực tế
      capNhat.ngay_giao_thuc_te =
        trangThai === 'da_giao' ? new Date().toISOString().slice(0, 10) : null

      const { error } = await supabase.from('don_hang').update(capNhat).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => lamMoiTien(),
  })
}

export function useXoaDonHang() {
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('don_hang').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      lamMoiTien()
      void queryClient.invalidateQueries({ queryKey: KHOA.giaoDichKho })
    },
  })
}
