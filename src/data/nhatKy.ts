import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { mocCuoiNgay, mocDauNgay } from '@/lib/utils'
import { KHOA } from './chung'
import type { NhatKy } from '@/types'

/**
 * NHẬT KÝ HOẠT ĐỘNG
 * ------------------------------------------------------------------
 * Đọc lại những gì cơ sở dữ liệu đã tự ghi (xem supabase/08_nhat_ky.sql).
 * Ở đây chỉ có đọc — phần mềm không ghi thêm và không sửa được dòng nào,
 * đó là điểm mấu chốt làm nhật ký đáng tin.
 */

export interface BoLocNhatKy {
  /** yyyy-mm-dd */
  tuNgay: string
  denNgay: string
  /** Mã người dùng, chuỗi rỗng là tất cả mọi người. */
  nguoiId: string
  hanhDong: 'tat_ca' | 'them' | 'sua' | 'xoa'
  /** Tên bảng, chuỗi rỗng là tất cả. */
  bang: string
  /** Chỉ lấy những việc có dính tới tiền. */
  chiTien: boolean
}

const MOI_TRANG = 60

function apBoLoc(
  q: ReturnType<ReturnType<typeof supabase.from>['select']>,
  loc: BoLocNhatKy,
) {
  let t = q
    .gte('thoi_diem', mocDauNgay(loc.tuNgay))
    .lte('thoi_diem', mocCuoiNgay(loc.denNgay))
  if (loc.nguoiId) t = t.eq('nguoi_id', loc.nguoiId)
  if (loc.hanhDong !== 'tat_ca') t = t.eq('hanh_dong', loc.hanhDong)
  if (loc.bang) t = t.eq('bang', loc.bang)
  if (loc.chiTien) t = t.or('tien_truoc.not.is.null,tien_sau.not.is.null')
  return t
}

/** Danh sách nhật ký, mới nhất lên trước, chia trang. */
export function useNhatKy(loc: BoLocNhatKy, trang: number) {
  return useQuery({
    queryKey: [...KHOA.nhatKy, loc, trang],
    staleTime: 20_000,
    retry: false,
    queryFn: async (): Promise<{ ds: NhatKy[]; tong: number }> => {
      const tu = trang * MOI_TRANG
      const { data, error, count } = await apBoLoc(
        supabase.from('nhat_ky').select('*', { count: 'exact' }),
        loc,
      )
        .order('thoi_diem', { ascending: false })
        .range(tu, tu + MOI_TRANG - 1)

      if (error) throw error
      return { ds: (data ?? []) as NhatKy[], tong: count ?? 0 }
    },
  })
}

export const SO_DONG_MOI_TRANG = MOI_TRANG

/* ------------------------------------------------------------------ */
/*  Tổng kết                                                           */
/* ------------------------------------------------------------------ */

export interface TongKetNguoi {
  nguoiId: string | null
  tenNguoi: string
  vaiTro: string
  soViec: number
  soLanXoa: number
  tienDaXoa: number
}

export interface TongKetNhatKy {
  soViec: number
  tienThu: number
  /** Tiền đã bị xoá khỏi sổ — con số đáng soi nhất. */
  tienXoa: number
  soLanSuaTien: number
  soLanSuaSoLuong: number
  theoNguoi: TongKetNguoi[]
  /** Quá nhiều dòng nên chỉ tính trên một phần. */
  chiTinhMotPhan: boolean
}

const TRAN_TONG_KET = 3000

/**
 * Tính mấy con số tổng để chủ tiệm liếc một cái là thấy.
 *
 * Supabase không cộng hộ được qua đường này, nên phần mềm tải về rồi tự
 * cộng. Lấy tối đa 3000 dòng — quá số đó thì báo cho người dùng biết là
 * con số chỉ tính trên một phần, chứ không lặng lẽ đưa ra số sai.
 */
export function useTongKetNhatKy(loc: BoLocNhatKy) {
  return useQuery({
    queryKey: [...KHOA.nhatKy, 'tong-ket', loc],
    staleTime: 20_000,
    retry: false,
    queryFn: async (): Promise<TongKetNhatKy> => {
      const { data, error } = await apBoLoc(
        supabase
          .from('nhat_ky')
          .select('nguoi_id, ten_nguoi, vai_tro, bang, hanh_dong, tien_truoc, tien_sau'),
        loc,
      )
        .order('thoi_diem', { ascending: false })
        .limit(TRAN_TONG_KET)

      if (error) throw error

      const ds = (data ?? []) as Pick<
        NhatKy,
        'nguoi_id' | 'ten_nguoi' | 'vai_tro' | 'bang' | 'hanh_dong' | 'tien_truoc' | 'tien_sau'
      >[]

      const kq: TongKetNhatKy = {
        soViec: ds.length,
        tienThu: 0,
        tienXoa: 0,
        soLanSuaTien: 0,
        soLanSuaSoLuong: 0,
        theoNguoi: [],
        chiTinhMotPhan: ds.length >= TRAN_TONG_KET,
      }

      const bang = new Map<string, TongKetNguoi>()

      for (const d of ds) {
        if (d.bang === 'thanh_toan') {
          if (d.hanh_dong === 'them') kq.tienThu += Number(d.tien_sau ?? 0)
          if (d.hanh_dong === 'xoa') kq.tienXoa += Number(d.tien_truoc ?? 0)
          if (d.hanh_dong === 'sua') kq.soLanSuaTien += 1
        }
        if (d.bang === 'dong_san_pham' && d.hanh_dong === 'sua') kq.soLanSuaSoLuong += 1

        const khoa = d.nguoi_id ?? `ten:${d.ten_nguoi}`
        const cu = bang.get(khoa) ?? {
          nguoiId: d.nguoi_id,
          tenNguoi: d.ten_nguoi,
          vaiTro: d.vai_tro,
          soViec: 0,
          soLanXoa: 0,
          tienDaXoa: 0,
        }
        cu.soViec += 1
        if (d.hanh_dong === 'xoa') {
          cu.soLanXoa += 1
          cu.tienDaXoa += Number(d.tien_truoc ?? 0)
        }
        bang.set(khoa, cu)
      }

      kq.theoNguoi = [...bang.values()].sort((a, b) => b.soViec - a.soViec)
      return kq
    },
  })
}

/* ------------------------------------------------------------------ */
/*  Tải nhật ký ra file để lưu hoặc mở bằng Excel                      */
/* ------------------------------------------------------------------ */

function oCsv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

/** Tải toàn bộ nhật ký đang lọc ra file CSV (mở được bằng Excel). */
export async function taiNhatKyCsv(loc: BoLocNhatKy): Promise<number> {
  const { data, error } = await apBoLoc(supabase.from('nhat_ky').select('*'), loc)
    .order('thoi_diem', { ascending: false })
    .limit(20000)
  if (error) throw error

  const ds = (data ?? []) as NhatKy[]

  const dong = [
    ['Thời điểm', 'Người làm', 'Vai trò', 'Việc', 'Mục', 'Nội dung', 'Tiền trước', 'Tiền sau', 'Chi tiết']
      .map(oCsv)
      .join(','),
    ...ds.map((d) =>
      [
        new Date(d.thoi_diem).toLocaleString('vi-VN'),
        d.ten_nguoi,
        d.vai_tro,
        d.hanh_dong,
        d.nhan,
        d.mo_ta,
        d.tien_truoc ?? '',
        d.tien_sau ?? '',
        JSON.stringify(d.thay_doi),
      ]
        .map(oCsv)
        .join(','),
    ),
  ].join('\r\n')

  // Dấu BOM ở đầu để Excel hiểu đây là UTF-8, không thì chữ Việt thành rác
  const blob = new Blob([`﻿${dong}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nhat-ky-${loc.tuNgay}-den-${loc.denNgay}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return ds.length
}

/** Dọn nhật ký cũ hơn N ngày. Chỉ Quản trị viên. */
export async function donNhatKyCu(soNgay: number): Promise<number> {
  const { data, error } = await supabase.rpc('don_nhat_ky_cu', { so_ngay: soNgay })
  if (error) throw error
  return Number(data ?? 0)
}
