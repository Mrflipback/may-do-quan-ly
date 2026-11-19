import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ngayHomNay } from '@/lib/utils'
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

      // Giữ lại bộ dòng sản phẩm cũ để khôi phục nếu bước chèn mới hỏng
      // giữa chừng (rớt mạng, token hết hạn, vi phạm ràng buộc...).
      // Nếu không giữ, xoá xong mà chèn hỏng là MẤT SẠCH sản phẩm của đơn.
      let dongCuDeKhoiPhuc: Record<string, unknown>[] | null = null

      if (donId) {
        const { error } = await supabase.from('don_hang').update(don).eq('id', donId)
        if (error) throw error

        // Thay toàn bộ dòng sản phẩm bằng danh sách mới.
        //
        // QUAN TRỌNG: trong PostgreSQL, lệnh DELETE bị Row Level Security
        // chặn thì KHÔNG báo lỗi — nó chỉ khớp 0 dòng rồi trả về thành công.
        // Nếu cứ thế chèn tiếp thì dòng cũ còn nguyên, dòng mới cộng thêm,
        // và tiền của đơn bị nhân lên sau mỗi lần sửa.
        // Vì vậy phải ĐẾM số dòng thực sự xoá được, không chỉ bắt lỗi.
        const { data: dongCu, error: loiDoc } = await supabase
          .from('dong_san_pham')
          .select('don_hang_id, ten_san_pham, loai, so_luong, don_gia, ghi_chu, thu_tu')
          .eq('don_hang_id', donId)
        if (loiDoc) throw loiDoc

        const { data: daXoa, error: loiXoa } = await supabase
          .from('dong_san_pham')
          .delete()
          .eq('don_hang_id', donId)
          .select('ten_san_pham')
        if (loiXoa) throw loiXoa

        if ((daXoa?.length ?? 0) !== (dongCu?.length ?? 0)) {
          throw new Error(
            'Bạn không có quyền sửa danh sách sản phẩm của đơn này. ' +
              'Danh sách sản phẩm chưa bị thay đổi. ' +
              'Hãy nhờ Quản lý hoặc Quản trị viên sửa giúp.',
          )
        }

        dongCuDeKhoiPhuc = dongCu ?? []
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
      if (loiDong) {
        // Bộ cũ đã xoá rồi mà bộ mới chèn hỏng -> trả lại bộ cũ.
        // Không làm việc này thì đơn hàng còn 0 sản phẩm: thành tiền âm,
        // công nợ âm, phiếu in ra số âm, và không khôi phục được nữa.
        if (dongCuDeKhoiPhuc && dongCuDeKhoiPhuc.length > 0) {
          const { error: loiKhoiPhuc } = await supabase
            .from('dong_san_pham')
            .insert(dongCuDeKhoiPhuc)
          if (loiKhoiPhuc) {
            throw new Error(
              'Lưu đơn hàng thất bại VÀ không khôi phục lại được danh sách sản phẩm cũ. ' +
                'Hãy mở lại đơn này kiểm tra ngay. Lỗi gốc: ' +
                (loiDong.message || String(loiDong)),
            )
          }
        }
        throw loiDong
      }

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
        trangThai === 'da_giao' ? ngayHomNay() : null

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
