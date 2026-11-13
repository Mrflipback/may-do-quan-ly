-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — KHO ẢNH (SUPABASE STORAGE)
-- ---------------------------------------------------------------------
--  Chạy file này SAU file 01_schema.sql, cũng trong SQL Editor.
--
--  Tạo 2 kho ảnh RIÊNG TƯ (private):
--    · anh-khach : ảnh chân dung khách hàng
--    · anh-mau   : ảnh mẫu quần áo trong thư viện
--
--  Riêng tư nghĩa là: ai không đăng nhập thì dán thẳng đường dẫn ảnh
--  vào trình duyệt cũng KHÔNG xem được. Phần mềm tự xin "vé xem ảnh"
--  có hạn giờ cho từng tấm.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('anh-khach', 'anh-khach', false, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif']),
  ('anh-mau',   'anh-mau',   false, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- --- Quy tắc truy cập kho ảnh ----------------------------------------
drop policy if exists p_anh_xem   on storage.objects;
drop policy if exists p_anh_tai   on storage.objects;
drop policy if exists p_anh_sua   on storage.objects;
drop policy if exists p_anh_xoa   on storage.objects;

-- Đăng nhập rồi thì xem được ảnh
create policy p_anh_xem on storage.objects
  for select to authenticated
  using (bucket_id in ('anh-khach', 'anh-mau'));

-- Đăng nhập rồi thì tải ảnh lên được
create policy p_anh_tai on storage.objects
  for insert to authenticated
  with check (bucket_id in ('anh-khach', 'anh-mau'));

-- Ghi đè ảnh cũ
create policy p_anh_sua on storage.objects
  for update to authenticated
  using (bucket_id in ('anh-khach', 'anh-mau'))
  with check (bucket_id in ('anh-khach', 'anh-mau'));

-- Chỉ Quản trị viên được xóa ảnh
create policy p_anh_xoa on storage.objects
  for delete to authenticated
  using (bucket_id in ('anh-khach', 'anh-mau') and public.la_quan_tri());


-- =====================================================================
--  XONG. Quay lại phần mềm, điền 2 khóa vào file .env rồi chạy lại.
-- =====================================================================
