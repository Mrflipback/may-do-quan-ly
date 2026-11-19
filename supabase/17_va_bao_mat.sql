-- =====================================================================
--  17_va_bao_mat.sql  —  VÁ 4 LỖ HỔNG TÌM ĐƯỢC KHI KIỂM TRA AN TOÀN
--  Ngày tạo: 19/11/2026
--
--  CÁCH CHẠY:
--    Supabase Dashboard → SQL Editor → New query → dán TOÀN BỘ file này
--    → bấm Run. Chạy một lần là xong. Chạy lại nhiều lần cũng không sao.
--
--  File này vá:
--    Phần 1 — Nhân viên tự nâng mình lên Quản trị viên          (NGHIÊM TRỌNG)
--    Phần 2 — Người lạ đăng ký là đọc được dữ liệu khách        (NGHIÊM TRỌNG)
--    Phần 3 — Nút "Tạm ngưng" và "Cho nghỉ việc" không có hiệu lực (CAO)
--    Phần 4 — Nhân viên sửa đơn làm tiền đơn nhân đôi           (NGHIÊM TRỌNG)
--
--  ⚠️  PHẢI ĐỌC TRƯỚC KHI CHẠY:
--    Phần 3 làm cho cột "dang_hoat_dong" có hiệu lực thật. Từ lúc đó,
--    tài khoản nào bị tắt là KHÔNG vào được phần mềm nữa. Để không ai
--    bị khoá nhầm, Phần 3 tự bật lại mọi tài khoản đang có trước, rồi
--    mới siết. Nếu trong tiệm KHÔNG có Quản trị viên nào thì file này
--    sẽ tự dừng ngay ở Phần 0 và không sửa gì cả.
-- =====================================================================


-- =====================================================================
--  PHẦN 0. KIỂM TRA AN TOÀN — dừng ngay nếu tiệm chưa có Quản trị viên
-- =====================================================================
do $khoi$
declare
  so_quan_tri integer;
begin
  select count(*) into so_quan_tri
    from public.nguoi_dung
   where vai_tro = 'quan_tri';

  if so_quan_tri = 0 then
    raise exception
      'DỪNG LẠI: tiệm chưa có Quản trị viên nào. Chạy file này sẽ khoá tất cả mọi người ngoài cửa. Hãy tạo tài khoản Quản trị viên trước rồi chạy lại.'
      using errcode = '42501';
  end if;

  raise notice 'Phần 0 OK — tiệm đang có % Quản trị viên.', so_quan_tri;
end
$khoi$;


-- =====================================================================
--  PHẦN 1. CHẶN TỰ ĐỔI QUYỀN
--
--  Vì sao cần: policy "p_nd_sua" trong file 01 cho mỗi người sửa dòng
--  hồ sơ CỦA CHÍNH MÌNH. Nhưng RLS của PostgreSQL chỉ chặn được theo
--  DÒNG, không chặn được theo CỘT — nên cột "vai_tro" cũng nằm trong
--  phạm vi sửa được. Một nhân viên mở DevTools gõ một dòng là thành
--  Quản trị viên.
--
--  Trigger "tg_giu_lai_mot_quan_tri" ở file 06 KHÔNG đỡ được, vì nó
--  thoát ra ngay khi vai trò CŨ không phải 'quan_tri' — tức là nó chỉ
--  canh chiều đi xuống, còn chiều đi lên thì bỏ trống.
--
--  Cách vá: thêm một trigger canh chiều đi lên.
-- =====================================================================
create or replace function public.chan_tu_doi_quyen()
returns trigger
language plpgsql
security definer
set search_path = public
as $ham$
begin
  -- Quản trị viên vẫn đổi quyền người khác được như cũ.
  if public.la_quan_tri() then
    return new;
  end if;

  -- Người thường chỉ được sửa họ tên và ảnh đại diện của mình.
  if new.vai_tro        is distinct from old.vai_tro
  or new.dang_hoat_dong is distinct from old.dang_hoat_dong
  or new.email          is distinct from old.email
  or new.id             is distinct from old.id then
    raise exception
      'Bạn chỉ được sửa họ tên và ảnh đại diện của mình. Việc đổi vai trò phải do Quản trị viên làm.'
      using errcode = '42501';
  end if;

  return new;
end
$ham$;

drop trigger if exists tg_chan_tu_doi_quyen on public.nguoi_dung;
create trigger tg_chan_tu_doi_quyen
  before update on public.nguoi_dung
  for each row execute function public.chan_tu_doi_quyen();


-- =====================================================================
--  PHẦN 2. TÀI KHOẢN MỚI PHẢI ĐƯỢC QUẢN TRỊ VIÊN DUYỆT
--
--  Vì sao cần: trang đăng nhập luôn hiện nút "Tạo tài khoản mới", và
--  trigger cũ tự tạo hồ sơ 'nhan_vien' ĐANG HOẠT ĐỘNG cho mọi người
--  đăng ký. Mà 'nhan_vien' thì đọc được 100% dữ liệu khách hàng.
--
--  ⚠️  ĐÂY CHỈ LÀ LỚP THỨ HAI. Việc quan trọng nhất vẫn phải làm bằng tay:
--      Supabase Dashboard → Authentication → Sign In / Providers → Email
--      → TẮT "Allow new users to sign up"
--      → BẬT lại "Confirm email"
--      Lớp SQL này để phòng khi ai đó lỡ bật lại mục kia.
--
--  Sau khi chạy: người đăng ký mới sẽ có hồ sơ nhưng KHÔNG hoạt động.
--  Quản trị viên vào Cài đặt bật từng người lên.
-- =====================================================================
create or replace function public.xu_ly_nguoi_dung_moi()
returns trigger
language plpgsql
security definer
set search_path = public
as $ham$
declare
  so_nguoi_hien_co integer;
begin
  select count(*) into so_nguoi_hien_co from public.nguoi_dung;

  insert into public.nguoi_dung (id, ho_ten, email, vai_tro, dang_hoat_dong)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'ho_ten'), ''), split_part(new.email, '@', 1)),
    new.email,
    case when so_nguoi_hien_co = 0 then 'quan_tri' else 'nhan_vien' end,
    -- Người đầu tiên (chủ tiệm) vào được ngay.
    -- Từ người thứ hai trở đi phải chờ Quản trị viên bật lên.
    so_nguoi_hien_co = 0
  )
  on conflict (id) do nothing;

  return new;
end
$ham$;

drop trigger if exists tg_nguoi_dung_moi on auth.users;
create trigger tg_nguoi_dung_moi
  after insert on auth.users
  for each row execute function public.xu_ly_nguoi_dung_moi();


-- =====================================================================
--  PHẦN 3. CHO CỘT "dang_hoat_dong" CÓ HIỆU LỰC THẬT
--
--  Vì sao cần: hiện tại cột này không được kiểm ở bất kỳ đâu — không
--  trong RLS, không trong la_quan_tri(), không trong la_quan_ly().
--  Nên nút "Tạm ngưng tài khoản" bấm vào không có tác dụng gì, và
--  "Cho nghỉ việc" cũng không cắt quyền ngay như màn hình hứa.
--
--  Sửa đúng ba hàm nền này là mọi policy trong hệ thống tự kế thừa.
-- =====================================================================

-- 3a. Bật lại mọi tài khoản đang có, để không ai bị khoá nhầm.
--     (Cột này hiện chưa có tác dụng gì nên không mất hành vi nào cả.)
update public.nguoi_dung
   set dang_hoat_dong = true
 where dang_hoat_dong is distinct from true;

-- 3b. "Đã đăng nhập" = CÒN hồ sơ trong tiệm VÀ ĐANG hoạt động.
--     Trước đây chỉ là "có phiên đăng nhập bất kỳ".
create or replace function public.da_dang_nhap()
returns boolean
language sql
stable
security definer
set search_path = public
as $ham$
  select exists (
    select 1 from public.nguoi_dung
     where id = auth.uid()
       and dang_hoat_dong
  );
$ham$;

-- 3c. Quản trị viên bị tạm ngưng thì không còn là Quản trị viên.
create or replace function public.la_quan_tri()
returns boolean
language sql
stable
security definer
set search_path = public
as $ham$
  select coalesce(
    (select vai_tro = 'quan_tri' and dang_hoat_dong
       from public.nguoi_dung
      where id = auth.uid()),
    false);
$ham$;

-- 3d. Tương tự cho Quản lý.
create or replace function public.la_quan_ly()
returns boolean
language sql
stable
security definer
set search_path = public
as $ham$
  select coalesce(
    (select vai_tro in ('quan_tri', 'quan_ly') and dang_hoat_dong
       from public.nguoi_dung
      where id = auth.uid()),
    false);
$ham$;


-- =====================================================================
--  PHẦN 4. CHO NHÂN VIÊN SỬA ĐƠN HÀNG MÀ KHÔNG LÀM NHÂN ĐÔI TIỀN
--
--  Vì sao cần: khi sửa đơn, phần mềm xoá hết dòng sản phẩm cũ rồi chèn
--  lại bộ mới. Nhưng quyền xoá "dong_san_pham" chỉ cấp cho Quản lý trở
--  lên. Mà trong PostgreSQL, lệnh DELETE bị RLS chặn thì KHÔNG báo lỗi —
--  nó chỉ khớp 0 dòng rồi trả về THÀNH CÔNG.
--  Kết quả: dòng cũ còn nguyên, dòng mới chèn thêm → đơn 5 triệu thành
--  10 triệu, sửa nữa thành 15 triệu, không có cảnh báo nào.
--
--  Cách vá ở đây: cho nhân viên được xoá dòng sản phẩm CỦA ĐƠN HÀNG
--  (chỉ bảng dong_san_pham, không đụng tới các bảng khác). Điều này
--  đúng với mô tả vai trò của phần mềm — nhân viên "được nhập liệu",
--  mà sửa lại danh sách món trong đơn chính là nhập liệu.
--  Quyền xoá khách hàng, đơn hàng, thanh toán, vật tư VẪN GIỮ NGUYÊN
--  như cũ (chỉ Quản lý trở lên).
--
--  NẾU BẠN KHÔNG MUỐN nhân viên sửa đơn: xoá bỏ cả Phần 4 này đi.
--  Khi đó bản vá trong file src/data/donHang.ts sẽ báo lỗi rõ ràng
--  "Bạn không có quyền sửa..." thay vì âm thầm tính sai tiền.
-- =====================================================================
drop policy if exists p_dong_san_pham_xoa on public.dong_san_pham;
create policy p_dong_san_pham_xoa on public.dong_san_pham
  for delete to authenticated
  using (public.da_dang_nhap());


-- =====================================================================
--  PHẦN 5. KIỂM TRA LẠI SAU KHI VÁ
-- =====================================================================
do $khoi$
declare
  so_quan_tri_hoat_dong integer;
  co_trigger            boolean;
begin
  select count(*) into so_quan_tri_hoat_dong
    from public.nguoi_dung
   where vai_tro = 'quan_tri' and dang_hoat_dong;

  select exists (
    select 1 from pg_trigger
     where tgname = 'tg_chan_tu_doi_quyen'
       and tgrelid = 'public.nguoi_dung'::regclass
  ) into co_trigger;

  if so_quan_tri_hoat_dong = 0 then
    raise exception 'CẢNH BÁO: sau khi vá không còn Quản trị viên nào đang hoạt động. Hãy chạy ngay: update public.nguoi_dung set dang_hoat_dong = true where vai_tro = ''quan_tri'';';
  end if;

  if not co_trigger then
    raise exception 'CẢNH BÁO: trigger chặn tự đổi quyền chưa được tạo. Hãy chạy lại Phần 1 của file này.';
  end if;

  raise notice '===================================================';
  raise notice ' VÁ XONG.';
  raise notice ' - Quản trị viên đang hoạt động: %', so_quan_tri_hoat_dong;
  raise notice ' - Trigger chặn tự đổi quyền: đã bật';
  raise notice '';
  raise notice ' CÒN MỘT VIỆC PHẢI LÀM BẰNG TAY:';
  raise notice ' Authentication > Sign In / Providers > Email';
  raise notice ' > TẮT "Allow new users to sign up"';
  raise notice '===================================================';
end
$khoi$;
