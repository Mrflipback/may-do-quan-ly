-- =====================================================================
--  XÓA SẠCH DỮ LIỆU ĐỂ BẮT ĐẦU DÙNG THẬT
-- ---------------------------------------------------------------------
--  CẢNH BÁO: file này xóa TOÀN BỘ khách hàng, số đo, đơn hàng, thanh
--  toán và kho. Tài khoản đăng nhập và cài đặt tiệm được giữ nguyên.
--
--  Chỉ chạy khi bạn đã thử xong và muốn nhập dữ liệu thật của tiệm.
--  NÊN tải một bản sao lưu trong mục Cài đặt trước khi chạy.
-- =====================================================================

begin;

delete from public.giao_dich_kho;
delete from public.thanh_toan;
delete from public.dong_san_pham;
delete from public.don_hang;
delete from public.ho_so_so_do;
delete from public.anh_mau;
delete from public.vat_tu;
delete from public.khach_hang;

-- Đánh số lại mã khách và mã đơn từ đầu
alter sequence public.seq_ma_khach restart with 1;
alter sequence public.seq_ma_don   restart with 1;

commit;

-- Ghi chú: ảnh đã tải lên Supabase Storage KHÔNG bị xóa bởi file này.
-- Muốn xóa ảnh, vào mục Storage trên trang Supabase và xóa thủ công.
