import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { boDau } from '@/lib/utils'
import { NHAN_LOAI_TRANG_PHUC } from '@/lib/constants'
import { KHOA, idNguoiDangNhap, lamMoiTien, queryClient } from './chung'
import type {
  DonOnline,
  DonOnlineNhap,
  DongBangGia,
  TrangThaiDonOnline,
} from '@/types'

/* ===================================================================
   1. TRANG CÔNG KHAI — ai cũng gọi được, kể cả chưa đăng nhập
   =================================================================== */

export interface ThongTinTiem {
  ten: string
  khauHieu: string
  gioiThieu: string
  dienThoai: string
  diaChi: string
  gioMoCua: string
  bangGia: DongBangGia[]
  ghiChuGia: string
}

/** Bảng giá mẫu, dùng khi tiệm chưa tự nhập bảng giá của mình. */
export const BANG_GIA_MAU: DongBangGia[] = [
  { trang_phuc: 'Áo dài truyền thống', cong_may: 'May tay, có lót', gia_tu: '900.000 đ', thoi_gian: '7–10 ngày' },
  { trang_phuc: 'Vest / Blazer', cong_may: 'Có dựng, có lót', gia_tu: '2.200.000 đ', thoi_gian: '10–14 ngày' },
  { trang_phuc: 'Sơ mi', cong_may: 'Cổ đức hoặc cổ tàu', gia_tu: '450.000 đ', thoi_gian: '3–5 ngày' },
  { trang_phuc: 'Quần âu', cong_may: 'Ống côn hoặc ống đứng', gia_tu: '550.000 đ', thoi_gian: '3–5 ngày' },
  { trang_phuc: 'Váy / Đầm', cong_may: 'May theo ảnh mẫu', gia_tu: '700.000 đ', thoi_gian: '5–7 ngày' },
  { trang_phuc: 'Sửa quần áo', cong_may: 'Lên lai, bóp eo, thay khoá', gia_tu: '50.000 đ', thoi_gian: '1–2 ngày' },
]

/** Dùng khi chưa chạy file SQL hoặc mạng chưa trả lời: trang vẫn đọc được. */
export const TIEM_MAC_DINH: ThongTinTiem = {
  ten: 'Tiệm may đo',
  khauHieu: 'May đo theo số đo riêng',
  gioiThieu: '',
  dienThoai: '',
  diaChi: '',
  gioMoCua: '',
  bangGia: BANG_GIA_MAU,
  ghiChuGia: 'Giá trên là công may, chưa gồm tiền vải. Tiệm báo giá chính xác sau khi xem mẫu và chọn vải.',
}

function docBangGia(thoChuoi: string | undefined): DongBangGia[] {
  if (!thoChuoi) return BANG_GIA_MAU
  try {
    const d = JSON.parse(thoChuoi)
    if (!Array.isArray(d) || d.length === 0) return BANG_GIA_MAU
    return d
      .filter((r) => r && typeof r.trang_phuc === 'string' && r.trang_phuc.trim())
      .map((r) => ({
        trang_phuc: String(r.trang_phuc ?? ''),
        cong_may: String(r.cong_may ?? ''),
        gia_tu: String(r.gia_tu ?? ''),
        thoi_gian: String(r.thoi_gian ?? ''),
      }))
  } catch {
    return BANG_GIA_MAU
  }
}

/**
 * Thông tin tiệm cho trang công khai.
 * Đọc khung nhìn v_thong_tin_tiem (chỉ gồm các khóa được phép công khai),
 * nên chạy được cả khi người xem chưa đăng nhập.
 */
export function useThongTinTiemCongKhai() {
  return useQuery({
    queryKey: [...KHOA.caiDat, 'cong-khai'],
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async (): Promise<ThongTinTiem> => {
      const { data, error } = await supabase.from('v_thong_tin_tiem').select('khoa, gia_tri')
      if (error) throw error

      const m: Record<string, string> = {}
      for (const d of (data ?? []) as { khoa: string; gia_tri: string }[]) m[d.khoa] = d.gia_tri

      return {
        ten: m.ten_tiem?.trim() || 'Tiệm may đo',
        khauHieu: m.khau_hieu?.trim() || 'May đo theo số đo riêng',
        gioiThieu: m.gioi_thieu?.trim() || '',
        dienThoai: m.dien_thoai?.trim() || '',
        diaChi: m.dia_chi?.trim() || '',
        gioMoCua: m.gio_mo_cua?.trim() || '',
        bangGia: docBangGia(m.bang_gia),
        ghiChuGia: m.ghi_chu_gia?.trim() || '',
      }
    },
  })
}

/**
 * Mã phiếu do chính trang web sinh ra.
 *
 * Phần đuôi là chữ-và-số để không đụng mã do cơ sở dữ liệu sinh (toàn số).
 */
function maPhieuMoi(): string {
  const d = new Date()
  const hai = (n: number) => String(n).padStart(2, '0')
  const ngay = String(d.getFullYear()).slice(2) + hai(d.getMonth() + 1) + hai(d.getDate())
  const duoi = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DM${ngay}-${duoi}`
}

/**
 * Khách gửi phiếu đặt may. Không cần đăng nhập.
 *
 * KHÔNG dùng .select() sau khi thêm: khách vãng lai chỉ có quyền GỬI, không có
 * quyền ĐỌC bảng này (để không ai xem trộm được phiếu của khách khác). Đòi cơ sở
 * dữ liệu trả về bản ghi vừa thêm sẽ bị chặn ngay. Nên trang tự sinh mã phiếu
 * rồi dựng lại phiếu từ đúng những gì khách vừa nhập.
 */
export function useGuiDonOnline() {
  return useMutation({
    mutationFn: async (nhap: DonOnlineNhap): Promise<DonOnline> => {
      const maPhieu = maPhieuMoi()
      const { error } = await supabase
        .from('don_online')
        .insert({
          ma_phieu: maPhieu,
          ho_ten: nhap.ho_ten.trim(),
          so_dien_thoai: nhap.so_dien_thoai.trim(),
          loai_trang_phuc: nhap.loai_trang_phuc,
          mo_ta_trang_phuc: nhap.mo_ta_trang_phuc.trim(),
          so_luong: nhap.so_luong,
          ngay_can_lay: nhap.ngay_can_lay || null,
          nhan_hang: nhap.nhan_hang,
          dia_chi: nhap.dia_chi.trim(),
          so_do: nhap.so_do,
          ghi_chu: nhap.ghi_chu.trim(),
        })
      if (error) throw error

      return {
        id: maPhieu,
        ma_phieu: maPhieu,
        ho_ten: nhap.ho_ten.trim(),
        so_dien_thoai: nhap.so_dien_thoai.trim(),
        loai_trang_phuc: nhap.loai_trang_phuc,
        mo_ta_trang_phuc: nhap.mo_ta_trang_phuc.trim(),
        so_luong: nhap.so_luong,
        ngay_can_lay: nhap.ngay_can_lay || null,
        nhan_hang: nhap.nhan_hang,
        dia_chi: nhap.dia_chi.trim(),
        so_do: nhap.so_do,
        ghi_chu: nhap.ghi_chu.trim(),
        trang_thai: 'moi',
        ghi_chu_tiem: '',
        khach_hang_id: null,
        don_hang_id: null,
        ngay_gui: new Date().toISOString(),
        ngay_cap_nhat: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.donOnline })
    },
  })
}

/* ===================================================================
   2. PHÍA TIỆM — phải đăng nhập
   =================================================================== */

export function useDanhSachDonOnline(trangThai: TrangThaiDonOnline | 'tat_ca' = 'tat_ca') {
  return useQuery({
    queryKey: [...KHOA.donOnline, 'ds', trangThai],
    queryFn: async (): Promise<DonOnline[]> => {
      let truyVan = supabase
        .from('don_online')
        .select('*')
        .order('ngay_gui', { ascending: false })
        .limit(300)
      if (trangThai !== 'tat_ca') truyVan = truyVan.eq('trang_thai', trangThai)

      const { data, error } = await truyVan
      if (error) throw error
      return (data ?? []) as DonOnline[]
    },
  })
}

/** Số phiếu mới chưa xử lý, để chấm đỏ trên menu. */
export function useSoDonOnlineMoi() {
  return useQuery({
    queryKey: [...KHOA.donOnline, 'dem-moi'],
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('don_online')
        .select('id', { count: 'exact', head: true })
        .eq('trang_thai', 'moi')
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useDoiTrangThaiDonOnline() {
  return useMutation({
    mutationFn: async ({
      id,
      trangThai,
      ghiChuTiem,
    }: {
      id: string
      trangThai: TrangThaiDonOnline
      ghiChuTiem?: string
    }): Promise<void> => {
      const capNhat: Record<string, unknown> = { trang_thai: trangThai }
      if (ghiChuTiem !== undefined) capNhat.ghi_chu_tiem = ghiChuTiem
      const { error } = await supabase.from('don_online').update(capNhat).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.donOnline })
    },
  })
}

/**
 * Xoá hẳn một phiếu online.
 *
 * Chỉ Quản trị viên xoá được (policy p_online_xoa). Nhân viên bấm thì cơ sở dữ
 * liệu lặng lẽ không xoá dòng nào, nên nơi gọi phải kiểm tra số dòng trả về.
 */
export function useXoaDonOnline() {
  return useMutation({
    mutationFn: async (id: string): Promise<number> => {
      const { data, error } = await supabase
        .from('don_online')
        .delete()
        .eq('id', id)
        .select('id')
      if (error) throw error
      return (data ?? []).length
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.donOnline })
    },
  })
}

/** Dọn một lượt mọi phiếu đã huỷ. Trả về số phiếu thực sự xoá được. */
export function useXoaPhieuDaHuy() {
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('don_online')
        .delete()
        .eq('trang_thai', 'huy')
        .select('id')
      if (error) throw error
      return (data ?? []).length
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.donOnline })
    },
  })
}

export interface KetQuaTaoDon {
  khachMoi: boolean
  maKhach: string
  maDon: string
  donHangId: string
}

/**
 * Biến một phiếu online thành khách hàng + đơn hàng thật.
 *
 * - Trùng số điện thoại thì dùng lại khách cũ, không tạo khách trùng.
 * - Khách có khai số đo thì tạo luôn một hồ sơ số đo gắn vào đơn.
 * - Đơn để đơn giá 0: tiệm chốt vải rồi tự điền.
 */
export function useTaoDonTuPhieu() {
  return useMutation({
    mutationFn: async (phieu: DonOnline): Promise<KetQuaTaoDon> => {
      const soSach = phieu.so_dien_thoai.replace(/[^0-9]/g, '')

      // 1. Khách cũ hay khách mới
      const { data: dsKhach, error: loiTim } = await supabase
        .from('khach_hang')
        .select('id, ma_khach, dia_chi')
        .eq('so_dien_thoai', phieu.so_dien_thoai.trim())
        .limit(1)
      if (loiTim) throw loiTim

      let khachId = (dsKhach ?? [])[0]?.id as string | undefined
      let maKhach = (dsKhach ?? [])[0]?.ma_khach as string | undefined
      const khachMoi = !khachId

      if (!khachId) {
        const { data: kh, error: loiThem } = await supabase
          .from('khach_hang')
          .insert({
            ho_ten: phieu.ho_ten.trim(),
            so_dien_thoai: phieu.so_dien_thoai.trim(),
            dia_chi: phieu.dia_chi || null,
            ghi_chu: `Khách đặt online, phiếu ${phieu.ma_phieu}`,
            tim_kiem: boDau(`${phieu.ho_ten} ${phieu.so_dien_thoai} ${soSach}`),
            nguoi_tao: await idNguoiDangNhap(),
          })
          .select('id, ma_khach')
          .single()
        if (loiThem) throw loiThem
        khachId = (kh as { id: string }).id
        maKhach = (kh as { ma_khach: string }).ma_khach
        // Mã khách do cơ sở dữ liệu sinh ra, bổ sung vào chuỗi tìm kiếm
        await supabase
          .from('khach_hang')
          .update({ tim_kiem: boDau(`${phieu.ho_ten} ${phieu.so_dien_thoai} ${soSach} ${maKhach}`) })
          .eq('id', khachId)
      }

      // 2. Hồ sơ số đo, nếu khách có khai
      let hoSoId: string | null = null
      const soDo = phieu.so_do ?? {}
      if (Object.keys(soDo).length > 0) {
        const { data: hs, error: loiHs } = await supabase
          .from('ho_so_so_do')
          .insert({
            khach_hang_id: khachId,
            ten_ho_so: `Khách tự khai khi đặt online (${phieu.ma_phieu})`,
            so_do: soDo,
            nguoi_do: 'Khách tự khai',
            ghi_chu: 'Số đo do khách gửi qua trang đặt may online, nên đo lại khi khách tới tiệm.',
          })
          .select('id')
          .single()
        if (loiHs) throw loiHs
        hoSoId = (hs as { id: string }).id
      }

      // 3. Đơn hàng
      const ghiChuDon = [
        `Phiếu online ${phieu.ma_phieu}`,
        phieu.ghi_chu,
        phieu.nhan_hang === 'giao_tan_noi' ? `Giao tận nơi: ${phieu.dia_chi}` : 'Khách đến tiệm lấy',
      ]
        .filter(Boolean)
        .join(' | ')

      const homNay = new Date().toISOString().slice(0, 10)
      const { data: don, error: loiDon } = await supabase
        .from('don_hang')
        .insert({
          khach_hang_id: khachId,
          ho_so_so_do_id: hoSoId,
          ngay_nhan: homNay,
          ngay_hen_giao: phieu.ngay_can_lay ?? homNay,
          trang_thai: 'moi',
          giam_gia: 0,
          ghi_chu: ghiChuDon,
          nguoi_tao: await idNguoiDangNhap(),
        })
        .select('id, ma_don')
        .single()
      if (loiDon) throw loiDon
      const donId = (don as { id: string }).id

      // 4. Một dòng sản phẩm, đơn giá để tiệm tự điền sau khi chốt vải
      const { error: loiSp } = await supabase.from('dong_san_pham').insert({
        don_hang_id: donId,
        ten_san_pham:
          phieu.mo_ta_trang_phuc.trim() || NHAN_LOAI_TRANG_PHUC[phieu.loai_trang_phuc],
        loai: phieu.loai_trang_phuc,
        so_luong: phieu.so_luong,
        don_gia: 0,
        ghi_chu: 'Khách đặt online, chưa chốt giá',
        thu_tu: 0,
      })
      if (loiSp) throw loiSp

      // 5. Đánh dấu phiếu đã xử lý
      const { error: loiPhieu } = await supabase
        .from('don_online')
        .update({
          trang_thai: 'da_tao_don',
          khach_hang_id: khachId,
          don_hang_id: donId,
        })
        .eq('id', phieu.id)
      if (loiPhieu) throw loiPhieu

      return {
        khachMoi,
        maKhach: maKhach ?? '',
        maDon: (don as { ma_don: string }).ma_don,
        donHangId: donId,
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA.donOnline })
      lamMoiTien()
    },
  })
}
