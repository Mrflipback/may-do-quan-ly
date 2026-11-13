-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — GIAI ĐOẠN 2: CƠ SỞ DỮ LIỆU
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor" ở menu bên trái
--    3. Bấm "New query", dán TOÀN BỘ file này vào
--    4. Bấm "Run" (hoặc Ctrl + Enter)
--    5. Chạy tiếp file 02_storage.sql
--
--  File này chạy lại được nhiều lần mà không hỏng dữ liệu.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. NGƯỜI DÙNG VÀ PHÂN QUYỀN
-- =====================================================================

create table if not exists public.nguoi_dung (
  id            uuid primary key references auth.users(id) on delete cascade,
  ho_ten        text not null default 'Người dùng mới',
  email         text,
  vai_tro       text not null default 'nhan_vien'
                check (vai_tro in ('quan_tri', 'nhan_vien')),
  anh_dai_dien  text,
  dang_hoat_dong boolean not null default true,
  ngay_tao      timestamptz not null default now()
);

comment on table public.nguoi_dung is
  'Hồ sơ nhân sự. Mỗi dòng gắn với một tài khoản đăng nhập trong auth.users.';


-- Hàm kiểm tra người đang đăng nhập có phải quản trị viên không.
-- SECURITY DEFINER để không bị kẹt vòng lặp khi kiểm tra quyền.
create or replace function public.la_quan_tri()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select vai_tro = 'quan_tri'
       from public.nguoi_dung
      where id = auth.uid()),
    false);
$$;

create or replace function public.da_dang_nhap()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null;
$$;


-- Khi có tài khoản mới đăng ký, tự tạo hồ sơ nhân sự tương ứng.
-- Người đăng ký ĐẦU TIÊN tự động là Quản trị viên.
create or replace function public.xu_ly_nguoi_dung_moi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  so_nguoi_hien_co integer;
begin
  select count(*) into so_nguoi_hien_co from public.nguoi_dung;

  insert into public.nguoi_dung (id, ho_ten, email, vai_tro)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'ho_ten'), ''), split_part(new.email, '@', 1)),
    new.email,
    case when so_nguoi_hien_co = 0 then 'quan_tri' else 'nhan_vien' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists tg_nguoi_dung_moi on auth.users;
create trigger tg_nguoi_dung_moi
  after insert on auth.users
  for each row execute function public.xu_ly_nguoi_dung_moi();


-- =====================================================================
--  PHẦN 2. KHÁCH HÀNG
-- =====================================================================

create sequence if not exists public.seq_ma_khach start 1;

create table if not exists public.khach_hang (
  id             uuid primary key default gen_random_uuid(),
  ma_khach       text unique not null default 'KH' || lpad(nextval('public.seq_ma_khach')::text, 5, '0'),
  ho_ten         text not null check (length(trim(ho_ten)) > 0),
  so_dien_thoai  text not null default '',
  gioi_tinh      text not null default 'nam' check (gioi_tinh in ('nam', 'nu', 'khac')),
  ngay_sinh      date,
  dia_chi        text,
  anh_dai_dien   text,
  ghi_chu        text,
  -- Chuỗi không dấu do phần mềm tự điền, dùng để tìm kiếm tiếng Việt
  tim_kiem       text not null default '',
  ngay_tao       timestamptz not null default now(),
  ngay_cap_nhat  timestamptz not null default now(),
  nguoi_tao      uuid references public.nguoi_dung(id) on delete set null
);

create index if not exists idx_khach_hang_tim_kiem on public.khach_hang (tim_kiem text_pattern_ops);
create index if not exists idx_khach_hang_ngay_tao on public.khach_hang (ngay_tao desc);


-- =====================================================================
--  PHẦN 3. HỒ SƠ SỐ ĐO (một khách có nhiều lần đo)
-- =====================================================================

create table if not exists public.ho_so_so_do (
  id             uuid primary key default gen_random_uuid(),
  khach_hang_id  uuid not null references public.khach_hang(id) on delete cascade,
  ten_ho_so      text not null default 'Lần đo mới',
  ngay_do        date not null default current_date,
  nguoi_do       text,
  -- Các chỉ số lưu dạng {"vong_nguc": 92, "dai_tay": 58}
  so_do          jsonb not null default '{}'::jsonb,
  ghi_chu        text,
  ngay_tao       timestamptz not null default now()
);

create index if not exists idx_so_do_khach on public.ho_so_so_do (khach_hang_id, ngay_do desc);


-- =====================================================================
--  PHẦN 4. THƯ VIỆN ẢNH MẪU
-- =====================================================================

create table if not exists public.anh_mau (
  id             uuid primary key default gen_random_uuid(),
  ten_mau        text not null check (length(trim(ten_mau)) > 0),
  loai           text not null default 'khac'
                 check (loai in ('ao_so_mi','quan_tay','vest','vay','ao_dai','khac')),
  duong_dan_anh  text not null,
  mo_ta          text,
  the_tag        text[] not null default '{}',
  ngay_tao       timestamptz not null default now(),
  nguoi_tao      uuid references public.nguoi_dung(id) on delete set null
);

create index if not exists idx_anh_mau_loai on public.anh_mau (loai, ngay_tao desc);


-- =====================================================================
--  PHẦN 5. ĐƠN HÀNG
-- =====================================================================

create sequence if not exists public.seq_ma_don start 1;

create table if not exists public.don_hang (
  id               uuid primary key default gen_random_uuid(),
  ma_don           text unique not null default 'DH' || lpad(nextval('public.seq_ma_don')::text, 5, '0'),
  khach_hang_id    uuid not null references public.khach_hang(id) on delete restrict,
  ho_so_so_do_id   uuid references public.ho_so_so_do(id) on delete set null,
  ngay_nhan        date not null default current_date,
  ngay_hen_giao    date not null default (current_date + 14),
  ngay_giao_thuc_te date,
  trang_thai       text not null default 'moi'
                   check (trang_thai in ('moi','dang_may','cho_thu','hoan_thanh','da_giao','da_huy')),
  giam_gia         numeric(14,2) not null default 0 check (giam_gia >= 0),
  ghi_chu          text,
  ngay_tao         timestamptz not null default now(),
  ngay_cap_nhat    timestamptz not null default now(),
  nguoi_tao        uuid references public.nguoi_dung(id) on delete set null,

  constraint ck_ngay_giao_hop_le check (ngay_hen_giao >= ngay_nhan)
);

create index if not exists idx_don_hang_khach on public.don_hang (khach_hang_id, ngay_tao desc);
create index if not exists idx_don_hang_trang_thai on public.don_hang (trang_thai, ngay_hen_giao);


create table if not exists public.dong_san_pham (
  id            uuid primary key default gen_random_uuid(),
  don_hang_id   uuid not null references public.don_hang(id) on delete cascade,
  ten_san_pham  text not null check (length(trim(ten_san_pham)) > 0),
  loai          text not null default 'khac'
                check (loai in ('ao_so_mi','quan_tay','vest','vay','ao_dai','khac')),
  so_luong      integer not null default 1 check (so_luong > 0),
  don_gia       numeric(14,2) not null default 0 check (don_gia >= 0),
  anh_mau_id    uuid references public.anh_mau(id) on delete set null,
  ghi_chu       text,
  thu_tu        integer not null default 0,
  thanh_tien    numeric(14,2) generated always as (so_luong * don_gia) stored
);

create index if not exists idx_dong_sp_don on public.dong_san_pham (don_hang_id, thu_tu);


-- =====================================================================
--  PHẦN 6. THANH TOÁN
-- =====================================================================

create table if not exists public.thanh_toan (
  id              uuid primary key default gen_random_uuid(),
  don_hang_id     uuid not null references public.don_hang(id) on delete cascade,
  so_tien         numeric(14,2) not null check (so_tien > 0),
  hinh_thuc       text not null default 'tien_mat'
                  check (hinh_thuc in ('tien_mat','chuyen_khoan','the','vi_dien_tu')),
  la_tien_coc     boolean not null default false,
  ngay_thanh_toan date not null default current_date,
  ghi_chu         text,
  ngay_tao        timestamptz not null default now(),
  nguoi_tao       uuid references public.nguoi_dung(id) on delete set null
);

create index if not exists idx_thanh_toan_don on public.thanh_toan (don_hang_id);
create index if not exists idx_thanh_toan_ngay on public.thanh_toan (ngay_thanh_toan desc);


-- =====================================================================
--  PHẦN 7. KHO VẢI VÀ PHỤ LIỆU
-- =====================================================================

create table if not exists public.vat_tu (
  id             uuid primary key default gen_random_uuid(),
  ma_vat_tu      text unique not null,
  ten_vat_tu     text not null check (length(trim(ten_vat_tu)) > 0),
  loai           text not null default 'vai' check (loai in ('vai','phu_lieu')),
  don_vi_tinh    text not null default 'mét',
  ton_toi_thieu  numeric(12,2) not null default 0 check (ton_toi_thieu >= 0),
  gia_nhap       numeric(14,2) not null default 0 check (gia_nhap >= 0),
  nha_cung_cap   text,
  anh            text,
  tim_kiem       text not null default '',
  ngay_tao       timestamptz not null default now()
);

create table if not exists public.giao_dich_kho (
  id           uuid primary key default gen_random_uuid(),
  vat_tu_id    uuid not null references public.vat_tu(id) on delete cascade,
  loai         text not null check (loai in ('nhap','xuat')),
  so_luong     numeric(12,2) not null check (so_luong > 0),
  don_gia      numeric(14,2),
  don_hang_id  uuid references public.don_hang(id) on delete set null,
  ngay         date not null default current_date,
  ghi_chu      text,
  ngay_tao     timestamptz not null default now(),
  nguoi_tao    uuid references public.nguoi_dung(id) on delete set null
);

create index if not exists idx_gd_kho_vat_tu on public.giao_dich_kho (vat_tu_id, ngay desc);


-- =====================================================================
--  PHẦN 8. CÀI ĐẶT TIỆM (lưu dạng khóa - giá trị)
-- =====================================================================

create table if not exists public.cai_dat (
  khoa      text primary key,
  gia_tri   text not null default '',
  ngay_cap_nhat timestamptz not null default now()
);

insert into public.cai_dat (khoa, gia_tri) values
  ('ten_tiem',   'MAY ĐO QUẢN LÝ PRO'),
  ('khau_hieu',  'Nhà may cao cấp'),
  ('dia_chi',    ''),
  ('dien_thoai', '')
on conflict (khoa) do nothing;


-- =====================================================================
--  PHẦN 9. TỰ ĐỘNG CẬP NHẬT NGÀY SỬA
-- =====================================================================

create or replace function public.cap_nhat_ngay_sua()
returns trigger
language plpgsql
as $$
begin
  new.ngay_cap_nhat := now();
  return new;
end;
$$;

drop trigger if exists tg_khach_hang_sua on public.khach_hang;
create trigger tg_khach_hang_sua before update on public.khach_hang
  for each row execute function public.cap_nhat_ngay_sua();

drop trigger if exists tg_don_hang_sua on public.don_hang;
create trigger tg_don_hang_sua before update on public.don_hang
  for each row execute function public.cap_nhat_ngay_sua();


-- =====================================================================
--  PHẦN 10. CÁC BẢNG TỔNG HỢP (VIEW)
--  Tiền và tồn kho KHÔNG lưu sẵn mà tính lại từ chứng từ gốc,
--  nhờ vậy số liệu không bao giờ bị lệch.
-- =====================================================================

create or replace view public.v_don_hang as
select
  d.id,
  d.ma_don,
  d.khach_hang_id,
  d.ho_so_so_do_id,
  d.ngay_nhan,
  d.ngay_hen_giao,
  d.ngay_giao_thuc_te,
  d.trang_thai,
  d.giam_gia,
  d.ghi_chu,
  d.ngay_tao,
  k.ho_ten        as ten_khach,
  k.so_dien_thoai as sdt_khach,
  k.ma_khach,
  coalesce(sp.tong_hang, 0)                                        as tong_tien_hang,
  coalesce(sp.tong_hang, 0) - d.giam_gia                           as thanh_tien,
  coalesce(tt.da_tra, 0)                                           as da_tra,
  coalesce(sp.tong_hang, 0) - d.giam_gia - coalesce(tt.da_tra, 0)  as con_lai,
  coalesce(sp.so_mon, 0)                                           as so_mon
from public.don_hang d
join public.khach_hang k on k.id = d.khach_hang_id
left join lateral (
  select sum(s.thanh_tien) as tong_hang, sum(s.so_luong) as so_mon
  from public.dong_san_pham s
  where s.don_hang_id = d.id
) sp on true
left join lateral (
  select sum(t.so_tien) as da_tra
  from public.thanh_toan t
  where t.don_hang_id = d.id
) tt on true;

alter view public.v_don_hang set (security_invoker = on);


create or replace view public.v_khach_hang as
select
  k.*,
  coalesce(d.tong_chi_tieu, 0) as tong_chi_tieu,
  coalesce(d.cong_no, 0)       as cong_no,
  coalesce(d.so_don, 0)        as so_don
from public.khach_hang k
left join lateral (
  select
    sum(v.thanh_tien)                             as tong_chi_tieu,
    sum(case when v.con_lai > 0 then v.con_lai else 0 end) as cong_no,
    count(*)                                      as so_don
  from public.v_don_hang v
  where v.khach_hang_id = k.id
    and v.trang_thai <> 'da_huy'
) d on true;

alter view public.v_khach_hang set (security_invoker = on);


create or replace view public.v_vat_tu as
select
  v.*,
  coalesce(g.ton_kho, 0) as ton_kho,
  coalesce(g.ton_kho, 0) * v.gia_nhap as gia_tri_ton
from public.vat_tu v
left join lateral (
  select sum(case when t.loai = 'nhap' then t.so_luong else -t.so_luong end) as ton_kho
  from public.giao_dich_kho t
  where t.vat_tu_id = v.id
) g on true;

alter view public.v_vat_tu set (security_invoker = on);


create or replace view public.v_thanh_toan as
select
  t.*,
  d.ma_don,
  d.khach_hang_id,
  k.ho_ten as ten_khach
from public.thanh_toan t
join public.don_hang d on d.id = t.don_hang_id
join public.khach_hang k on k.id = d.khach_hang_id;

alter view public.v_thanh_toan set (security_invoker = on);


-- =====================================================================
--  PHẦN 11. BÁO CÁO DOANH THU — CHỈ QUẢN TRỊ VIÊN GỌI ĐƯỢC
--  Chặn ngay tại cơ sở dữ liệu, không chỉ ẩn nút trên giao diện.
-- =====================================================================

create or replace function public.bao_cao_doanh_thu(
  tu_ngay  date,
  den_ngay date,
  nhom     text default 'thang'   -- 'ngay' | 'thang' | 'nam'
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
as $$
begin
  if not public.la_quan_tri() then
    raise exception 'Chỉ Quản trị viên mới được xem báo cáo doanh thu.'
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
$$;


-- Số liệu cho Bảng điều khiển. Ai đăng nhập cũng gọi được,
-- nhưng doanh thu chỉ trả về khi là Quản trị viên.
create or replace function public.thong_ke_tong_quan()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
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
      case when public.la_quan_tri() then
        coalesce((select sum(so_tien) from public.thanh_toan
                   where ngay_thanh_toan >= dau_thang_nay), 0)
      else null end,
    'doanhThuThangTruoc',
      case when public.la_quan_tri() then
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
$$;


-- =====================================================================
--  PHẦN 12. BẬT ROW LEVEL SECURITY CHO TẤT CẢ CÁC BẢNG
--  Nguyên tắc:
--    · Chưa đăng nhập  -> không đọc, không ghi được gì
--    · Nhân viên       -> xem và thêm/sửa, KHÔNG được xóa
--    · Quản trị viên   -> toàn quyền
-- =====================================================================

alter table public.nguoi_dung    enable row level security;
alter table public.khach_hang    enable row level security;
alter table public.ho_so_so_do   enable row level security;
alter table public.anh_mau       enable row level security;
alter table public.don_hang      enable row level security;
alter table public.dong_san_pham enable row level security;
alter table public.thanh_toan    enable row level security;
alter table public.vat_tu        enable row level security;
alter table public.giao_dich_kho enable row level security;
alter table public.cai_dat       enable row level security;


-- --- nguoi_dung -------------------------------------------------------
drop policy if exists p_nd_xem    on public.nguoi_dung;
drop policy if exists p_nd_sua    on public.nguoi_dung;
drop policy if exists p_nd_them   on public.nguoi_dung;
drop policy if exists p_nd_xoa    on public.nguoi_dung;

create policy p_nd_xem on public.nguoi_dung
  for select to authenticated using (public.da_dang_nhap());

-- Tự sửa hồ sơ của mình; đổi vai trò người khác thì phải là quản trị viên
create policy p_nd_sua on public.nguoi_dung
  for update to authenticated
  using (id = auth.uid() or public.la_quan_tri())
  with check (id = auth.uid() or public.la_quan_tri());

create policy p_nd_them on public.nguoi_dung
  for insert to authenticated with check (public.la_quan_tri());

create policy p_nd_xoa on public.nguoi_dung
  for delete to authenticated using (public.la_quan_tri() and id <> auth.uid());


-- --- Các bảng nghiệp vụ dùng chung một bộ quy tắc ---------------------
do $$
declare
  ten_bang text;
begin
  foreach ten_bang in array array[
    'khach_hang','ho_so_so_do','anh_mau','don_hang',
    'dong_san_pham','thanh_toan','vat_tu','giao_dich_kho'
  ]
  loop
    execute format('drop policy if exists p_%1$s_xem  on public.%1$s', ten_bang);
    execute format('drop policy if exists p_%1$s_them on public.%1$s', ten_bang);
    execute format('drop policy if exists p_%1$s_sua  on public.%1$s', ten_bang);
    execute format('drop policy if exists p_%1$s_xoa  on public.%1$s', ten_bang);

    execute format($f$
      create policy p_%1$s_xem on public.%1$s
        for select to authenticated using (public.da_dang_nhap())
    $f$, ten_bang);

    execute format($f$
      create policy p_%1$s_them on public.%1$s
        for insert to authenticated with check (public.da_dang_nhap())
    $f$, ten_bang);

    execute format($f$
      create policy p_%1$s_sua on public.%1$s
        for update to authenticated
        using (public.da_dang_nhap()) with check (public.da_dang_nhap())
    $f$, ten_bang);

    -- Chỉ quản trị viên được xóa
    execute format($f$
      create policy p_%1$s_xoa on public.%1$s
        for delete to authenticated using (public.la_quan_tri())
    $f$, ten_bang);
  end loop;
end;
$$;


-- --- cai_dat: ai cũng đọc được, chỉ quản trị viên sửa ------------------
drop policy if exists p_cd_xem on public.cai_dat;
drop policy if exists p_cd_sua on public.cai_dat;
drop policy if exists p_cd_them on public.cai_dat;

create policy p_cd_xem on public.cai_dat
  for select to authenticated using (public.da_dang_nhap());
create policy p_cd_sua on public.cai_dat
  for update to authenticated
  using (public.la_quan_tri()) with check (public.la_quan_tri());
create policy p_cd_them on public.cai_dat
  for insert to authenticated with check (public.la_quan_tri());


-- =====================================================================
--  PHẦN 13. CHO PHÉP GỌI CÁC HÀM
-- =====================================================================

revoke all on function public.bao_cao_doanh_thu(date, date, text) from public, anon;
grant execute on function public.bao_cao_doanh_thu(date, date, text) to authenticated;

revoke all on function public.thong_ke_tong_quan() from public, anon;
grant execute on function public.thong_ke_tong_quan() to authenticated;

grant execute on function public.la_quan_tri()  to authenticated;
grant execute on function public.da_dang_nhap() to authenticated;

-- Cấp quyền thao tác trên bảng cho tài khoản đã đăng nhập.
-- Quyền thực sự vẫn do Row Level Security ở Phần 12 quyết định.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Người chưa đăng nhập không được đụng vào gì cả.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;


-- =====================================================================
--  XONG. Chạy tiếp file 02_storage.sql để tạo kho ảnh.
-- =====================================================================
