/**
 * Cấu trúc dữ liệu, đặt tên KHỚP ĐÚNG với tên cột trong Supabase.
 * Nhờ vậy không cần lớp chuyển đổi trung gian, ít chỗ sai hơn.
 */

/* ----------------------------- Người dùng ----------------------------- */

export type VaiTro = 'quan_tri' | 'quan_ly' | 'nhan_vien'

export interface NguoiDung {
  id: string
  ho_ten: string
  email: string | null
  vai_tro: VaiTro
  anh_dai_dien: string | null
  dang_hoat_dong: boolean
  ngay_tao: string
}

/* ----------------------------- Khách hàng ----------------------------- */

export type GioiTinh = 'nam' | 'nu' | 'khac'

export interface KhachHang {
  id: string
  ma_khach: string
  ho_ten: string
  so_dien_thoai: string
  gioi_tinh: GioiTinh
  ngay_sinh: string | null
  dia_chi: string | null
  anh_dai_dien: string | null
  ghi_chu: string | null
  tim_kiem: string
  ngay_tao: string
  ngay_cap_nhat: string
  nguoi_tao: string | null
}

/** Dòng lấy từ view v_khach_hang, có thêm số liệu tổng hợp. */
export interface KhachHangDayDu extends KhachHang {
  tong_chi_tieu: number
  cong_no: number
  so_don: number
}

/** Dữ liệu khi thêm hoặc sửa khách hàng. */
export interface KhachHangNhap {
  ho_ten: string
  so_dien_thoai: string
  gioi_tinh: GioiTinh
  ngay_sinh: string | null
  dia_chi: string | null
  ghi_chu: string | null
  anh_dai_dien?: string | null
}

/* ------------------------------ Số đo ------------------------------ */

export interface ChiSoDo {
  ma: string
  ten: string
  donVi: 'cm' | 'kg'
}

export interface HoSoSoDo {
  id: string
  khach_hang_id: string
  ten_ho_so: string
  ngay_do: string
  nguoi_do: string | null
  so_do: Record<string, number>
  ghi_chu: string | null
  ngay_tao: string
}

export interface HoSoSoDoNhap {
  khach_hang_id: string
  ten_ho_so: string
  ngay_do: string
  nguoi_do: string | null
  so_do: Record<string, number>
  ghi_chu: string | null
}

/* --------------------------- Thư viện mẫu --------------------------- */

export type LoaiTrangPhuc = 'ao_so_mi' | 'quan_tay' | 'vest' | 'vay' | 'ao_dai' | 'khac'

export interface AnhMau {
  id: string
  ten_mau: string
  loai: LoaiTrangPhuc
  duong_dan_anh: string
  mo_ta: string | null
  the_tag: string[]
  ngay_tao: string
  nguoi_tao: string | null
}

/* ----------------------------- Đơn hàng ----------------------------- */

export type TrangThaiDonHang =
  | 'moi'
  | 'dang_may'
  | 'cho_thu'
  | 'hoan_thanh'
  | 'da_giao'
  | 'da_huy'

export interface DongSanPham {
  id: string
  don_hang_id: string
  ten_san_pham: string
  loai: LoaiTrangPhuc
  so_luong: number
  don_gia: number
  anh_mau_id: string | null
  ghi_chu: string | null
  thu_tu: number
  thanh_tien: number
}

/** Dòng sản phẩm đang soạn trên biểu mẫu, chưa lưu. */
export interface DongSanPhamNhap {
  id?: string
  ten_san_pham: string
  loai: LoaiTrangPhuc
  so_luong: number
  don_gia: number
  ghi_chu: string | null
}

export interface DonHang {
  id: string
  ma_don: string
  khach_hang_id: string
  ho_so_so_do_id: string | null
  ngay_nhan: string
  ngay_hen_giao: string
  ngay_giao_thuc_te: string | null
  trang_thai: TrangThaiDonHang
  giam_gia: number
  ghi_chu: string | null
  ngay_tao: string
}

/** Dòng lấy từ view v_don_hang. */
export interface DonHangDayDu extends DonHang {
  ten_khach: string
  sdt_khach: string
  ma_khach: string
  tong_tien_hang: number
  thanh_tien: number
  da_tra: number
  con_lai: number
  so_mon: number
}

export interface DonHangNhap {
  khach_hang_id: string
  ho_so_so_do_id: string | null
  ngay_nhan: string
  ngay_hen_giao: string
  trang_thai: TrangThaiDonHang
  giam_gia: number
  ghi_chu: string | null
}

/* ------------------------------ Kho ------------------------------ */

export type LoaiVatTu = 'vai' | 'phu_lieu'
export type LoaiGiaoDichKho = 'nhap' | 'xuat'

export interface VatTu {
  id: string
  ma_vat_tu: string
  ten_vat_tu: string
  loai: LoaiVatTu
  don_vi_tinh: string
  ton_toi_thieu: number
  gia_nhap: number
  nha_cung_cap: string | null
  anh: string | null
  tim_kiem: string
  ngay_tao: string
}

/** Dòng lấy từ view v_vat_tu. */
export interface VatTuDayDu extends VatTu {
  ton_kho: number
  gia_tri_ton: number
}

export interface VatTuNhap {
  ma_vat_tu: string
  ten_vat_tu: string
  loai: LoaiVatTu
  don_vi_tinh: string
  ton_toi_thieu: number
  gia_nhap: number
  nha_cung_cap: string | null
}

export interface GiaoDichKho {
  id: string
  vat_tu_id: string
  loai: LoaiGiaoDichKho
  so_luong: number
  don_gia: number | null
  don_hang_id: string | null
  ngay: string
  ghi_chu: string | null
  ngay_tao: string
}

/* --------------------------- Thanh toán --------------------------- */

export type HinhThucThanhToan = 'tien_mat' | 'chuyen_khoan' | 'the' | 'vi_dien_tu'

export interface ThanhToan {
  id: string
  don_hang_id: string
  so_tien: number
  hinh_thuc: HinhThucThanhToan
  la_tien_coc: boolean
  ngay_thanh_toan: string
  ghi_chu: string | null
  ngay_tao: string
}

/** Dòng lấy từ view v_thanh_toan. */
export interface ThanhToanDayDu extends ThanhToan {
  ma_don: string
  khach_hang_id: string
  ten_khach: string
}

export interface ThanhToanNhap {
  don_hang_id: string
  so_tien: number
  hinh_thuc: HinhThucThanhToan
  la_tien_coc: boolean
  ngay_thanh_toan: string
  ghi_chu: string | null
}

/* ----------------------------- Báo cáo ----------------------------- */

export interface DiemDoanhThu {
  nhan: string
  moc: string
  doanh_thu: number
  so_don: number
}

export interface ThongKeTongQuan {
  doanhThuThang: number | null
  doanhThuThangTruoc: number | null
  soDonDangMay: number
  soDonTreHen: number
  khachHangMoiThang: number
  tongKhachHang: number
  tongCongNo: number
  soKhachNoQuaHan: number
  vatTuSapHet: number
}

/* ----------------------------- Cài đặt ----------------------------- */

export interface CaiDat {
  khoa: string
  gia_tri: string
}

/* --------------------- Đặt may online (trang web) --------------------- */

export type TrangThaiDonOnline = 'moi' | 'da_lien_he' | 'da_tao_don' | 'huy'
export type NhanHang = 'tai_tiem' | 'giao_tan_noi'

export interface DonOnline {
  id: string
  ma_phieu: string
  ho_ten: string
  so_dien_thoai: string
  loai_trang_phuc: LoaiTrangPhuc
  mo_ta_trang_phuc: string
  so_luong: number
  ngay_can_lay: string | null
  nhan_hang: NhanHang
  dia_chi: string
  /** Số đo khách tự khai, cùng dạng với HoSoSoDo.so_do */
  so_do: Record<string, string>
  ghi_chu: string
  trang_thai: TrangThaiDonOnline
  ghi_chu_tiem: string
  khach_hang_id: string | null
  don_hang_id: string | null
  ngay_gui: string
  ngay_cap_nhat: string
}

/** Phiếu khách gửi lên từ trang công khai. */
export interface DonOnlineNhap {
  ho_ten: string
  so_dien_thoai: string
  loai_trang_phuc: LoaiTrangPhuc
  mo_ta_trang_phuc: string
  so_luong: number
  ngay_can_lay: string | null
  nhan_hang: NhanHang
  dia_chi: string
  so_do: Record<string, string>
  ghi_chu: string
}

/** Một dòng trong bảng giá hiện trên trang công khai. */
export interface DongBangGia {
  trang_phuc: string
  cong_may: string
  gia_tu: string
  thoi_gian: string
}

/* ---------------------------- Nhật ký ---------------------------- */

export type HanhDongNhatKy = 'them' | 'sua' | 'xoa'

/** Một dòng nhật ký. Cơ sở dữ liệu tự ghi, phần mềm chỉ đọc. */
export interface NhatKy {
  id: number
  thoi_diem: string
  nguoi_id: string | null
  ten_nguoi: string
  vai_tro: string
  bang: string
  hanh_dong: HanhDongNhatKy
  ban_ghi_id: string | null
  nhan: string
  mo_ta: string
  tien_truoc: number | null
  tien_sau: number | null
  /** { ten_cot: { truoc, sau } } khi sửa; cả dòng khi thêm hoặc xoá. */
  thay_doi: Record<string, unknown>
}
