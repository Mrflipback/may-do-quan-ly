-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 06
--  VAI TRÒ "QUẢN LÝ", XOÁ TÀI KHOẢN QUẢN TRỊ VIÊN, TÊN KHÔNG KÝ TỰ LẠ
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 01 → 05. Chạy lại nhiều lần cũng không hỏng dữ liệu.
--
--  FILE NÀY LÀM 4 VIỆC:
--    A. Thêm vai trò thứ ba: Quản lý (giữa Quản trị viên và Nhân viên)
--    B. Cho phép xoá tài khoản Quản trị viên, kể cả tài khoản của chính
--       mình — nhưng CHẶN xoá người Quản trị viên CUỐI CÙNG, để tiệm
--       không bao giờ bị khoá ngoài cửa
--    C. Chặn ký tự đặc biệt trong tên tài khoản
--    D. Giao quyền xoá dữ liệu và xem báo cáo cho Quản lý
-- =====================================================================


-- =====================================================================
--  A. VAI TRÒ THỨ BA: QUẢN LÝ
-- =====================================================================
--  quan_tri  — Quản trị viên: toàn quyền, kể cả tài khoản và cài đặt
--  quan_ly   — Quản lý: xem báo cáo doanh thu, được xoá dữ liệu nghiệp
--              vụ, NHƯNG không đụng được vào tài khoản và cài đặt tiệm
--  nhan_vien — Nhân viên: xem, thêm, sửa; không xoá, không xem báo cáo

alter table public.nguoi_dung
  drop constraint if exists nguoi_dung_vai_tro_check;

alter table public.nguoi_dung
  add constraint nguoi_dung_vai_tro_check
  check (vai_tro in ('quan_tri', 'quan_ly', 'nhan_vien'));


-- Hàm: người đang đăng nhập có quyền từ Quản lý trở lên không?
create or replace function public.la_quan_ly()
returns boolean
language sql
stable
security definer
set search_path = public
as $ham$
  select coalesce(
    (select vai_tro in ('quan_tri', 'quan_ly')
       from public.nguoi_dung
      where id = auth.uid()),
    false);
$ham$;


-- =====================================================================
--  C. TÊN TÀI KHOẢN KHÔNG ĐƯỢC CÓ KÝ TỰ ĐẶC BIỆT
-- =====================================================================
--  Cho phép: chữ (có dấu tiếng Việt), số, khoảng trắng, dấu chấm,
--            dấu gạch ngang, dấu nháy đơn  —  ví dụ: Nguyễn Văn An
--  Cấm:      < > @ # $ % ^ & * ( ) _ + = { } [ ] | \ / : ; " ` ~ ! ? ,
--
--  Cách kiểm: xoá hết ký tự cấm khỏi tên; nếu tên không đổi nghĩa là
--  tên sạch. Cách này không phụ thuộc bảng mã nên chữ có dấu luôn qua.
--
--  "not valid" = chỉ soi tên mới và tên sửa lại, không đụng tên cũ đã
--  có sẵn trong bảng, nên chạy file này không làm hỏng dữ liệu đang có.

alter table public.nguoi_dung
  drop constraint if exists ck_ho_ten_khong_ky_tu_la;

alter table public.nguoi_dung
  add constraint ck_ho_ten_khong_ky_tu_la
  check (ho_ten = translate(ho_ten, '<>@#$%^&*()_+={}[]|\/:;"`~!?,', ''))
  not valid;


-- Tài khoản mới đăng ký: tự gột sạch ký tự lạ trong tên trước khi lưu,
-- để người dùng không bao giờ bị lỗi khó hiểu lúc tạo tài khoản.
create or replace function public.xu_ly_nguoi_dung_moi()
returns trigger
language plpgsql
security definer
set search_path = public
as $ham$
declare
  so_nguoi_hien_co integer;
  ten_sach         text;
begin
  select count(*) into so_nguoi_hien_co from public.nguoi_dung;

  ten_sach := translate(
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'ho_ten'), ''),
             split_part(new.email, '@', 1)),
    '<>@#$%^&*()_+={}[]|\/:;"`~!?,', '');
  ten_sach := nullif(trim(ten_sach), '');

  insert into public.nguoi_dung (id, ho_ten, email, vai_tro)
  values (
    new.id,
    coalesce(ten_sach, 'Người dùng mới'),
    new.email,
    case when so_nguoi_hien_co = 0 then 'quan_tri' else 'nhan_vien' end
  )
  on conflict (id) do nothing;

  return new;
end;
$ham$;


-- =====================================================================
--  B. XOÁ TÀI KHOẢN QUẢN TRỊ VIÊN — CÓ LƯỚI AN TOÀN
-- =====================================================================
--  Quy tắc mới:
--    · Quản trị viên xoá được BẤT KỲ tài khoản nào, kể cả Quản trị viên
--      khác và kể cả tài khoản của chính mình
--    · Ai cũng tự xoá được tài khoản của chính mình
--    · NHƯNG người Quản trị viên cuối cùng thì không xoá được, và cũng
--      không hạ quyền được — nếu không sẽ chẳng còn ai quản lý tiệm

create or replace function public.giu_lai_mot_quan_tri()
returns trigger
language plpgsql
security definer
set search_path = public
as $ham$
declare
  con_lai integer;
begin
  -- Chỉ cần lo khi đụng vào một Quản trị viên
  if old.vai_tro <> 'quan_tri' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  -- Sửa mà vẫn giữ nguyên vai trò Quản trị viên thì không sao
  if tg_op = 'UPDATE' and new.vai_tro = 'quan_tri' then
    return new;
  end if;

  select count(*) into con_lai
    from public.nguoi_dung
   where vai_tro = 'quan_tri' and id <> old.id;

  if con_lai = 0 then
    raise exception
      'Đây là Quản trị viên cuối cùng của tiệm nên không xoá hay hạ quyền được. Hãy cấp quyền Quản trị viên cho một người khác trước, rồi quay lại.'
      using errcode = 'P0001';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$ham$;

drop trigger if exists tg_giu_lai_mot_quan_tri on public.nguoi_dung;
create trigger tg_giu_lai_mot_quan_tri
  before delete or update of vai_tro on public.nguoi_dung
  for each row execute function public.giu_lai_mot_quan_tri();


-- Quy tắc xoá hồ sơ nhân sự: bỏ điều kiện "id <> auth.uid()" ở file 01,
-- nay tự xoá tài khoản của mình được. Lưới an toàn nằm ở trigger trên.
drop policy if exists p_nd_xoa on public.nguoi_dung;
create policy p_nd_xoa on public.nguoi_dung
  for delete to authenticated
  using (public.la_quan_tri() or id = auth.uid());


-- =====================================================================
--  D. QUẢN LÝ ĐƯỢC XOÁ DỮ LIỆU VÀ XEM BÁO CÁO
-- =====================================================================
--  Tài khoản và cài đặt tiệm vẫn CHỈ Quản trị viên đụng được.

do $khoi$
declare
  ten_bang text;
begin
  foreach ten_bang in array array[
    'khach_hang','ho_so_so_do','anh_mau','don_hang',
    'dong_san_pham','thanh_toan','vat_tu','giao_dich_kho'
  ]
  loop
    execute format('drop policy if exists p_%1$s_xoa on public.%1$s', ten_bang);
    execute format($f$
      create policy p_%1$s_xoa on public.%1$s
        for delete to authenticated using (public.la_quan_ly())
    $f$, ten_bang);
  end loop;
end;
$khoi$;


-- Đơn đặt online (file 05) cũng theo quy tắc đó, nếu bảng đã tồn tại
do $khoi$
begin
  if to_regclass('public.don_online') is not null then
    drop policy if exists p_online_xoa on public.don_online;
    create policy p_online_xoa on public.don_online
      for delete to authenticated using (public.la_quan_ly());
  end if;
end;
$khoi$;


-- Báo cáo doanh thu: mở cho Quản lý
create or replace function public.bao_cao_doanh_thu(
  tu_ngay  date,
  den_ngay date,
  nhom     text default 'thang'
)
returns table (
  nhan       text,
  moc        date,
  doanh_thu  numeric,
  so_don     bigint
)
language plpgsql
stable
security definer
set search_path = public
as $ham$
begin
  if not public.la_quan_ly() then
    raise exception 'Chỉ Quản trị viên và Quản lý mới được xem báo cáo doanh thu.'
      using errcode = '42501';
  end if;

  if nhom not in ('ngay', 'thang', 'nam') then
    raise exception 'Cách nhóm không hợp lệ: %', nhom using errcode = '22023';
  end if;

  return query
  select
    case nhom
      when 'ngay'  then to_char(date_trunc('day',   t.ngay_thanh_toan), 'DD/MM/YYYY')
      when 'thang' then to_char(date_trunc('month', t.ngay_thanh_toan), 'MM/YYYY')
      else              to_char(date_trunc('year',  t.ngay_thanh_toan), 'YYYY')
    end::text                                               as nhan,
    date_trunc(nhom, t.ngay_thanh_toan)::date               as moc,
    sum(t.so_tien)::numeric                                 as doanh_thu,
    count(distinct t.don_hang_id)::bigint                   as so_don
  from public.thanh_toan t
  where t.ngay_thanh_toan between tu_ngay and den_ngay
  group by 1, 2
  order by 2;
end;
$ham$;


-- Ô doanh thu trên Bảng điều khiển: mở cho Quản lý
create or replace function public.thong_ke_tong_quan()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $ham$
declare
  dau_thang_nay    date := date_trunc('month', current_date)::date;
  dau_thang_truoc  date := (date_trunc('month', current_date) - interval '1 month')::date;
  kq jsonb;
begin
  if not public.da_dang_nhap() then
    raise exception 'Bạn chưa đăng nhập.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'doanhThuThang',
      case when public.la_quan_ly() then
        coalesce((select sum(so_tien) from public.thanh_toan
                   where ngay_thanh_toan >= dau_thang_nay), 0)
      else null end,
    'doanhThuThangTruoc',
      case when public.la_quan_ly() then
        coalesce((select sum(so_tien) from public.thanh_toan
                   where ngay_thanh_toan >= dau_thang_truoc
                     and ngay_thanh_toan <  dau_thang_nay), 0)
      else null end,
    'soDonDangMay',
      (select count(*) from public.don_hang
        where trang_thai in ('moi','dang_may','cho_thu','hoan_thanh')),
    'soDonTreHen',
      (select count(*) from public.don_hang
        where trang_thai in ('moi','dang_may','cho_thu','hoan_thanh')
          and ngay_hen_giao < current_date),
    'khachHangMoiThang',
      (select count(*) from public.khach_hang where ngay_tao >= dau_thang_nay),
    'tongKhachHang',
      (select count(*) from public.khach_hang),
    'tongCongNo',
      coalesce((select sum(con_lai) from public.v_don_hang
                 where con_lai > 0 and trang_thai <> 'da_huy'), 0),
    'soKhachNoQuaHan',
      (select count(distinct khach_hang_id) from public.v_don_hang
        where con_lai > 0 and trang_thai <> 'da_huy' and ngay_hen_giao < current_date),
    'vatTuSapHet',
      (select count(*) from public.v_vat_tu where ton_kho < ton_toi_thieu)
  ) into kq;

  return kq;
end;
$ham$;


grant execute on function public.la_quan_ly() to authenticated;


-- =====================================================================
--  XONG.
--  Vào phần mềm, mục Cài đặt > Tài khoản & phân quyền, bạn sẽ thấy
--  thêm lựa chọn "Quản lý" trong ô vai trò.
-- =====================================================================
