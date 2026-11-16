import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { KHOA, queryClient } from './chung'
import type { KetQuaMatKhau } from '@/lib/matKhauXoa'

/**
 * KHÔI PHỤC CÀI ĐẶT HỆ THỐNG
 * ------------------------------------------------------------------
 * Ba lớp chặn, phải qua đủ cả ba:
 *
 *   1. Mật khẩu ĐĂNG NHẬP của chính người bấm — hỏi thẳng Supabase
 *   2. Mật khẩu KHÔI PHỤC riêng, do chủ tiệm tự đặt — máy chủ kiểm
 *   3. MỌI tài khoản đang hoạt động đều đã bấm đồng ý
 *
 * Xem supabase/15_dat_lai_cai_dat.sql.
 *
 * NHƯ MỌI CHỖ DÙNG MẬT KHẨU TRONG PHẦN MỀM NÀY: sai mật khẩu KHÔNG
 * phải là lỗi. Máy chủ trả về { ok: false } chứ không báo lỗi, vì báo
 * lỗi là Postgres cuộn ngược giao dịch và mất luôn cái đếm số lần gõ
 * sai. Phải đọc `kq.ok`.
 */

const KHOA_PHIEU = [...KHOA.caiDat, 'phieu-dat-lai'] as const
const KHOA_CO_MK = [...KHOA.caiDat, 'co-mat-khau-dat-lai'] as const

export interface PhieuDatLai {
  id: number
  ly_do: string
  thoi_diem: string
  han_den: string
  ten_nguoi_yeu_cau: string
  /** Tổng số tài khoản đang hoạt động trong tiệm. */
  tong_tai_khoan: number
  /** Đã có bao nhiêu người bấm đồng ý. */
  da_duyet: number
  /** Chính tôi đã ký chưa. */
  toi_da_ky: boolean
  /** Tên những người chưa ký, để màn hình nhắc đích danh. */
  ai_chua_ky: string[]
}

/** Phiếu đang chờ duyệt, hoặc null nếu không có phiếu nào. */
export function usePhieuDatLai() {
  return useQuery({
    queryKey: KHOA_PHIEU,
    staleTime: 10_000,
    retry: false,
    queryFn: async (): Promise<PhieuDatLai | null> => {
      const { data, error } = await supabase.rpc('phieu_dat_lai_dang_cho')
      if (error) throw error
      const ds = (Array.isArray(data) ? data : []) as PhieuDatLai[]
      return ds.length > 0 ? ds[0] : null
    },
  })
}

export function useCoMatKhauDatLai() {
  return useQuery({
    queryKey: KHOA_CO_MK,
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('co_mat_khau_dat_lai')
      if (error) throw error
      return Boolean(data)
    },
  })
}

function lamMoi() {
  void queryClient.invalidateQueries({ queryKey: KHOA_PHIEU })
  void queryClient.invalidateQueries({ queryKey: KHOA_CO_MK })
}

/** Đặt hoặc đổi mật khẩu khôi phục. */
export function useMatKhauDatLai() {
  const co = useCoMatKhauDatLai()

  const dat = useMutation({
    mutationFn: async ({ mkMoi, mkCu }: { mkMoi: string; mkCu: string }) => {
      const { data, error } = await supabase.rpc('dat_mat_khau_dat_lai', {
        mk_moi: mkMoi,
        mk_cu: mkCu || null,
      })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: (kq) => {
      if (kq.ok) lamMoi()
    },
  })

  return {
    dangTai: co.isLoading,
    daDat: co.data ?? false,
    dangLuu: dat.isPending,
    dat: (mkMoi: string, mkCu: string) => dat.mutateAsync({ mkMoi, mkCu }),
  }
}

/* ------------------------------------------------------------------ */
/*  Phiếu: tạo, ký, huỷ, chạy                                          */
/* ------------------------------------------------------------------ */

export function useTaoPhieu() {
  return useMutation({
    mutationFn: async (lyDo: string) => {
      const { data, error } = await supabase.rpc('tao_yeu_cau_dat_lai', { ly_do: lyDo })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: lamMoi,
  })
}

export function useKyPhieu() {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase.rpc('duyet_yeu_cau_dat_lai', { ma: id })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: lamMoi,
  })
}

export function useHuyPhieu() {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase.rpc('huy_yeu_cau_dat_lai', { ma: id })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: lamMoi,
  })
}

export function useChayDatLai() {
  return useMutation({
    mutationFn: async ({ id, matKhau }: { id: number; matKhau: string }) => {
      const { data, error } = await supabase.rpc('chay_dat_lai_cai_dat', {
        ma: id,
        mk_khoi_phuc: matKhau,
      })
      if (error) throw error
      return (data ?? { ok: false }) as KetQuaMatKhau
    },
    onSuccess: (kq) => {
      if (kq.ok) {
        lamMoi()
        // Cài đặt vừa bị xoá, màn hình phải đọc lại
        void queryClient.invalidateQueries({ queryKey: KHOA.caiDat })
      }
    },
  })
}

/* ------------------------------------------------------------------ */
/*  Bản chụp khẩn (file 14)                                            */
/* ------------------------------------------------------------------ */

export interface BanChup {
  id: number
  thoi_diem: string
  ly_do: string
  ten_nguoi: string
  vai_tro: string
  so_dong: number
  co_bao_nhieu_kb: number
}

export function useDanhSachBanChup() {
  return useQuery({
    queryKey: [...KHOA.caiDat, 'ban-chup'],
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<BanChup[]> => {
      const { data, error } = await supabase.rpc('danh_sach_ban_chup')
      if (error) throw error
      // Ham SQL tra ve mot BANG nen data luon la mang. Nhung neu may chu
      // tra ve thu khac (chay nham phien ban file SQL chang han) thi
      // .map() se no va CA TRANG TRANG TRON. Chan o day cho chac.
      return (Array.isArray(data) ? data : []) as BanChup[]
    },
  })
}

/** Tải một bản chụp về máy thành file .json. */
export async function taiBanChup(b: BanChup): Promise<void> {
  const { data, error } = await supabase.rpc('lay_ban_chup', { ma: b.id })
  if (error) throw error

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const ngay = new Date(b.thoi_diem).toISOString().slice(0, 19).replace(/[:T]/g, '-')
  a.download = `ban-chup-khan-${ngay}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
