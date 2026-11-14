-- ===================================================================
--  09. DỌN DẸP SAU KHI BỎ BỐN CHỨC NĂNG
-- ===================================================================
--  Phần mềm đã gỡ hẳn bốn thứ sau khỏi mã nguồn:
--      · Đơn đặt may online (khách tự gửi phiếu qua web)
--      · Thư viện ảnh mẫu
--      · Phiếu đặt may
--      · Mục "mẫu tiệm đã may"
--
--  NHƯNG dữ liệu cũ VẪN CÒN NGUYÊN trong Supabase. Phần mềm chỉ là
--  không đụng tới nữa thôi. Để nguyên như vậy cũng không sao: nó không
--  làm chậm, không làm sai gì cả, chỉ chiếm một ít chỗ.
--
--  CHẠY FILE NÀY LÀ XOÁ THẬT, KHÔNG LẤY LẠI ĐƯỢC.
--  Hãy tải một bản sao lưu về máy trước (mục Cài đặt → Sao lưu dữ liệu),
--  rồi mới chạy.
--
--  Cách chạy: mở Supabase → SQL Editor → dán cả file này → Run.
-- ===================================================================


-- -------------------------------------------------------------------
--  BƯỚC 0 — XEM TRƯỚC CÓ BAO NHIÊU DÒNG SẼ MẤT
--  Chạy RIÊNG đoạn này trước. Nếu con số là 0 cả hai thì bạn chẳng
--  mất gì, cứ chạy tiếp cho gọn. Nếu có số, hãy cân nhắc.
-- -------------------------------------------------------------------
select
  (select count(*) from public.don_online) as so_phieu_khach_tung_gui,
  (select count(*) from public.anh_mau)    as so_anh_mau_trong_danh_muc;


-- -------------------------------------------------------------------
--  BƯỚC 1 — GỠ CỘT anh_mau_id KHỎI BẢNG DÒNG SẢN PHẨM
--  Cột này trỏ sang bảng ảnh mẫu. Phải gỡ trước, không thì bước 2
--  sẽ bị chặn vì còn ràng buộc khoá ngoại.
--  Cột này hiện KHÔNG chứa gì có ích — phần mềm chưa bao giờ ghi
--  vào đó ngoài lúc chọn ảnh mẫu.
-- -------------------------------------------------------------------
alter table public.dong_san_pham drop column if exists anh_mau_id;


-- -------------------------------------------------------------------
--  BƯỚC 2 — XOÁ HAI BẢNG
--  Xoá bảng là xoá luôn mọi dòng bên trong, cùng với các quy tắc
--  RLS, trigger và chỉ mục gắn vào nó.
-- -------------------------------------------------------------------
drop table if exists public.don_online cascade;
drop table if exists public.anh_mau    cascade;


-- -------------------------------------------------------------------
--  BƯỚC 3 — GỠ HAI BẢNG NÀY KHỎI SỔ NHẬT KÝ
--  File 08_nhat_ky.sql có gắn trigger ghi nhật ký lên nhiều bảng.
--  Bảng đã xoá thì trigger cũng đi theo, nhưng những dòng nhật ký
--  CŨ nói về hai bảng đó thì vẫn nằm lại. Giữ cũng được (đó là lịch
--  sử thật), mà muốn dọn thì bỏ dấu chú thích ở hai dòng dưới.
-- -------------------------------------------------------------------
-- delete from public.nhat_ky where bang in ('don_online', 'anh_mau');


-- -------------------------------------------------------------------
--  BƯỚC 4 — KHO ẢNH 'anh-mau' TRONG MỤC STORAGE
--  Đây là nơi chứa ẢNH THẬT, không phải chứa tên ảnh. Xoá là mất file
--  ảnh luôn, SQL không lấy lại được.
--
--  Muốn xoá thì vào Supabase → Storage → chọn kho 'anh-mau' →
--  nút Delete bucket. Làm bằng tay cho chắc, tôi để đây hai dòng
--  phòng khi bạn muốn làm bằng lệnh — NHỚ BỎ DẤU CHÚ THÍCH thì nó
--  mới chạy.
-- -------------------------------------------------------------------
-- delete from storage.objects where bucket_id = 'anh-mau';
-- delete from storage.buckets where id = 'anh-mau';


-- -------------------------------------------------------------------
--  BƯỚC 5 — SỬA LẠI QUY TẮC KHO ẢNH
--  File 02_storage.sql viết quy tắc cho CẢ HAI kho một lượt
--  ('anh-khach', 'anh-mau'). Nếu bạn đã xoá kho 'anh-mau' ở bước 4,
--  bỏ dấu chú thích đoạn dưới để viết lại cho gọn, chỉ còn kho khách.
--  Không chạy cũng không sao — quy tắc trỏ vào kho không tồn tại thì
--  nó chỉ đơn giản là không khớp với gì cả.
-- -------------------------------------------------------------------
-- drop policy if exists p_anh_xem on storage.objects;
-- drop policy if exists p_anh_tai on storage.objects;
-- drop policy if exists p_anh_sua on storage.objects;
-- drop policy if exists p_anh_xoa on storage.objects;
--
-- create policy p_anh_xem on storage.objects
--   for select to authenticated
--   using (bucket_id = 'anh-khach');
--
-- create policy p_anh_tai on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'anh-khach');
--
-- create policy p_anh_sua on storage.objects
--   for update to authenticated
--   using (bucket_id = 'anh-khach')
--   with check (bucket_id = 'anh-khach');
--
-- create policy p_anh_xoa on storage.objects
--   for delete to authenticated
--   using (bucket_id = 'anh-khach' and public.la_quan_tri());


-- -------------------------------------------------------------------
--  XONG. Chạy lại đoạn này để chắc là hai bảng đã biến mất.
--  Kết quả đúng là: KHÔNG CÓ DÒNG NÀO.
-- -------------------------------------------------------------------
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('don_online', 'anh_mau');
