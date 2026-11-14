import type {
  ChiSoDo,
  HinhThucThanhToan,
  LoaiTrangPhuc,
  TrangThaiDonHang,
  VaiTro,
} from '@/types'

/* ------------------------- Nhãn hiển thị tiếng Việt ------------------------- */

export const NHAN_TRANG_THAI: Record<TrangThaiDonHang, string> = {
  moi: 'Mới nhận',
  dang_may: 'Đang may',
  cho_thu: 'Chờ thử đồ',
  hoan_thanh: 'Hoàn thành',
  da_giao: 'Đã giao',
  da_huy: 'Đã hủy',
}

/** Màu sắc của thẻ trạng thái đơn hàng. */
export const MAU_TRANG_THAI: Record<TrangThaiDonHang, string> = {
  moi: 'bg-sky-100 text-sky-800 ring-sky-600/20',
  dang_may: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  cho_thu: 'bg-violet-100 text-violet-800 ring-violet-600/20',
  hoan_thanh: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  da_giao: 'bg-slate-200 text-slate-700 ring-slate-500/20',
  da_huy: 'bg-rose-100 text-rose-800 ring-rose-600/20',
}

export const NHAN_LOAI_TRANG_PHUC: Record<LoaiTrangPhuc, string> = {
  ao_so_mi: 'Áo sơ mi',
  quan_tay: 'Quần tây',
  vest: 'Vest',
  vay: 'Váy / Đầm',
  ao_dai: 'Áo dài',
  khac: 'Khác',
}

export const NHAN_HINH_THUC_TT: Record<HinhThucThanhToan, string> = {
  tien_mat: 'Tiền mặt',
  chuyen_khoan: 'Chuyển khoản',
  the: 'Quẹt thẻ',
  vi_dien_tu: 'Ví điện tử',
}

export const NHAN_VAI_TRO: Record<VaiTro, string> = {
  quan_tri: 'Quản trị viên',
  quan_ly: 'Quản lý',
  nhan_vien: 'Nhân viên',
}

/** Một câu ngắn giải thích mỗi vai trò làm được gì, hiện trong Cài đặt. */
export const MO_TA_VAI_TRO: Record<VaiTro, string> = {
  quan_tri: 'Toàn quyền: quản lý tài khoản, cài đặt tiệm, xem báo cáo, xoá dữ liệu.',
  quan_ly: 'Xem báo cáo doanh thu và xoá được dữ liệu, nhưng không đụng vào tài khoản và cài đặt tiệm.',
  nhan_vien: 'Xem, thêm và sửa dữ liệu. Không xoá được, không xem được báo cáo doanh thu.',
}

/** Thứ tự từ thấp đến cao, dùng để so quyền. */
export const THU_BAC_VAI_TRO: Record<VaiTro, number> = {
  nhan_vien: 1,
  quan_ly: 2,
  quan_tri: 3,
}

/* ----------------------------- Bộ chỉ số đo ----------------------------- */

export const NHOM_SO_DO: { tieuDe: string; chiSo: ChiSoDo[] }[] = [
  {
    tieuDe: 'Thông số chung',
    chiSo: [
      { ma: 'chieu_cao', ten: 'Chiều cao', donVi: 'cm' },
      { ma: 'can_nang', ten: 'Cân nặng', donVi: 'kg' },
    ],
  },
  {
    tieuDe: 'Phần thân trên',
    chiSo: [
      { ma: 'vong_co', ten: 'Vòng cổ', donVi: 'cm' },
      { ma: 'vong_nguc', ten: 'Vòng ngực', donVi: 'cm' },
      { ma: 'vong_eo', ten: 'Vòng eo', donVi: 'cm' },
      { ma: 'rong_vai', ten: 'Rộng vai', donVi: 'cm' },
      { ma: 'dai_ao', ten: 'Dài áo', donVi: 'cm' },
      { ma: 'dai_tay', ten: 'Dài tay', donVi: 'cm' },
      { ma: 'vong_bap_tay', ten: 'Vòng bắp tay', donVi: 'cm' },
      { ma: 'vong_cua_tay', ten: 'Vòng cửa tay', donVi: 'cm' },
      { ma: 'ha_nguc', ten: 'Hạ ngực', donVi: 'cm' },
      { ma: 'ha_eo', ten: 'Hạ eo', donVi: 'cm' },
    ],
  },
  {
    tieuDe: 'Phần thân dưới',
    chiSo: [
      { ma: 'vong_mong', ten: 'Vòng mông', donVi: 'cm' },
      { ma: 'vong_bung', ten: 'Vòng bụng', donVi: 'cm' },
      { ma: 'dai_quan', ten: 'Dài quần', donVi: 'cm' },
      { ma: 'vong_dui', ten: 'Vòng đùi', donVi: 'cm' },
      { ma: 'vong_goi', ten: 'Vòng gối', donVi: 'cm' },
      { ma: 'vong_ong', ten: 'Vòng ống', donVi: 'cm' },
      { ma: 'ha_goi', ten: 'Hạ gối', donVi: 'cm' },
      { ma: 'day_quan', ten: 'Đáy quần', donVi: 'cm' },
    ],
  },
]

/** Danh sách phẳng tất cả chỉ số, tiện tra cứu theo mã. */
export const TAT_CA_CHI_SO: ChiSoDo[] = NHOM_SO_DO.flatMap((n) => n.chiSo)

/* ------------------------- Thông tin tiệm (mẫu) ------------------------- */

export const THONG_TIN_TIEM = {
  ten: 'MAY ĐO QUẢN LÝ PRO',
  slogan: 'Nhà may cao cấp',
  diaChi: '— Cập nhật trong mục Cài đặt —',
  dienThoai: '— Cập nhật trong mục Cài đặt —',
}

/* --------------------------- Nhật ký --------------------------- */

/** Tên bảng -> chữ người đọc hiểu được. */
export const NHAN_BANG_NHAT_KY: Record<string, string> = {
  thanh_toan: 'Thanh toán',
  don_hang: 'Đơn hàng',
  dong_san_pham: 'Món trong đơn',
  giao_dich_kho: 'Xuất nhập kho',
  vat_tu: 'Vật tư',
  khach_hang: 'Khách hàng',
  nguoi_dung: 'Tài khoản',
  cai_dat: 'Cài đặt',
  nhat_ky: 'Nhật ký',
}

/** Những bảng dính tới tiền hoặc số lượng — lọc nhanh ở trang Nhật ký. */
export const BANG_LIEN_QUAN_TIEN = [
  'thanh_toan',
  'don_hang',
  'dong_san_pham',
  'giao_dich_kho',
  'vat_tu',
]

export const NHAN_HANH_DONG: Record<string, string> = {
  them: 'Thêm mới',
  sua: 'Sửa',
  xoa: 'Xoá',
}

export const MAU_HANH_DONG: Record<string, string> = {
  them: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  sua: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  xoa: 'bg-rose-100 text-rose-800 ring-rose-600/20',
}

/** Tên cột -> chữ dễ hiểu, dùng khi mở xem chi tiết một thay đổi. */
export const NHAN_COT: Record<string, string> = {
  so_tien: 'Số tiền',
  so_luong: 'Số lượng',
  don_gia: 'Đơn giá',
  giam_gia: 'Giảm giá',
  gia_nhap: 'Giá nhập',
  thanh_tien: 'Thành tiền',
  trang_thai: 'Trạng thái',
  vai_tro: 'Vai trò',
  ho_ten: 'Họ tên',
  so_dien_thoai: 'Số điện thoại',
  dia_chi: 'Địa chỉ',
  ghi_chu: 'Ghi chú',
  ten_san_pham: 'Tên sản phẩm',
  ten_vat_tu: 'Tên vật tư',
  ma_don: 'Mã đơn',
  ma_khach: 'Mã khách',
  ngay_hen_giao: 'Ngày hẹn giao',
  ngay_giao_thuc_te: 'Ngày giao thực tế',
  ngay_thanh_toan: 'Ngày thanh toán',
  hinh_thuc: 'Hình thức trả',
  la_tien_coc: 'Là tiền cọc',
  loai: 'Loại',
  gia_tri: 'Giá trị',
  khoa: 'Mục cài đặt',
  ghi_chu_tiem: 'Ghi chú của tiệm',
  ton_toi_thieu: 'Tồn tối thiểu',
  nha_cung_cap: 'Nhà cung cấp',
}

/** Cột nào là tiền thì hiện dạng tiền tệ. */
export const COT_LA_TIEN = ['so_tien', 'don_gia', 'giam_gia', 'gia_nhap', 'thanh_tien']
