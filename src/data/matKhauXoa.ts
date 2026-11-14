import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, queryClient } from './chung'
import type { KetQuaMatKhau } from '@/lib/matKhauXoa'

/**
 * MẬT KHẨU XOÁ — PHẦN NÓI CHUYỆN VỚI MÁY CHỦ
 * ------------------------------------------------------------------
 * Mọi việc kiểm đều nằm ở máy chủ (supabase/11_khoa_xoa_tren_may_chu.sql).
 * Trình duyệt chỉ gửi chữ người dùng gõ đi và đọc câu trả lời.
 *
 * ĐIỀU DỄ NHẦM NHẤT Ở ĐÂY: sai mật khẩu KHÔNG phải là lỗi.
 *
 * Máy chủ trả về `{ ok: false, loi: '...' }` chứ không báo lỗi, vì
 * Postgres cuộn ngược mọi thứ khi có lỗi — kể cả câu lệnh vừa đếm thêm
 * một lần gõ sai. Báo lỗi là mất cái đếm, người đoán mò gõ bao nhiêu
 * lần cũng không bị khoá.
 *
 * Nên đừng bao giờ viết `if (error) throw` rồi coi như xong. Phải đọc
 * `kq.ok`.
 */

const KHOA_CO = [...KHOA.caiDat, 'co-mat-khau-xoa'] as const

/** Tiệm đã đặt mật khẩu xoá chưa. */
export function useCoMatKhauXoa() {
  return useQuery({
    queryKey: KHOA_CO,
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('co_mat_khau_xoa')
      if (error) throw error
      return Boolean(data)
    },
  })
}

function lamMoiCo() {
  void queryClient.invalidateQueries({ queryKey: KHOA_CO })
}

/** Đặt, đổi và gỡ mật khẩu xoá. */
export function useMatKhauXoa() {
  const co = useCoMatKhauXoa()

  const dat = useMutation({
    mutationFn: async ({
      mkMoi,
      mkCu,
    }: {
      mkMoi: string
      mkCu: string
    }): Promise<KetQuaMatKhau> => {
      const { data, error } = await supabase.rpc('dat_mat_khau_xoa', {
        mk_moi: mkMoi,
        mk_cu: mkCu || null,
      })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: (kq) => {
      if (kq.ok) lamMoiCo()
    },
  })

  const go = useMutation({
    mutationFn: async (mkHienTai: string): Promise<KetQuaMatKhau> => {
      const { data, error } = await supabase.rpc('go_mat_khau_xoa', {
        mk_hien_tai: mkHienTai,
      })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: (kq) => {
      if (kq.ok) lamMoiCo()
    },
  })

  return {
    dangTai: co.isLoading,
    daDat: co.data ?? false,
    dangLuu: dat.isPending || go.isPending,
    dat: (mkMoi: string, mkCu: string) => dat.mutateAsync({ mkMoi, mkCu }),
    go: (mkHienTai: string) => go.mutateAsync(mkHienTai),
  }
}

/**
 * Chỉ hỏi máy chủ xem mật khẩu có đúng không, chưa xoá gì cả.
 *
 * Dùng cho lúc khôi phục kiểu "xoá sạch rồi nạp": phải biết mật khẩu
 * đúng TRƯỚC đã, rồi mới cất bản sao lưu của dữ liệu hiện tại xuống máy,
 * rồi mới xoá. Gõ sai mà máy đã tải về một file thì kỳ.
 *
 * Dùng chung cái đếm số lần gõ sai với hai hàm xoá, nên không mở thêm
 * đường cho người đoán mò.
 */
export async function kiemMatKhauXoa(matKhau: string): Promise<KetQuaMatKhau> {
  const { data, error } = await supabase.rpc('kiem_mat_khau_xoa', { mk: matKhau })
  if (error) throw error
  return (data ?? { ok: false }) as KetQuaMatKhau
}

/**
 * Xoá một tài khoản nhân sự. Máy chủ kiểm mật khẩu rồi mới xoá.
 *
 * Trả về `{ ok: false, loi }` khi sai mật khẩu — KHÔNG ném lỗi.
 */
export function useXoaTaiKhoan() {
  return useMutation({
    mutationFn: async ({
      id,
      matKhau,
    }: {
      id: string
      matKhau: string
    }): Promise<KetQuaMatKhau> => {
      const { data, error } = await supabase.rpc('xoa_tai_khoan', {
        nguoi: id,
        mk_xoa: matKhau,
      })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: (kq) => {
      if (kq.ok) void queryClient.invalidateQueries({ queryKey: KHOA.nguoiDung })
    },
  })
}
