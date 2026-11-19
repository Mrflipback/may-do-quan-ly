-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 17
--  THỢ MAY · CHI PHÍ · CÔNG NỢ NHÀ CUNG CẤP · BÁO CÁO LÃI LỖ
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 01. Chạy lại nhiều lần cũng không hỏng dữ liệu.
-- ---------------------------------------------------------------------
--  BA LỖ HỔNG ĐANG VÁ
--
--  1. BIẾT THU BAO NHIÊU, KHÔNG BIẾT LÃI BAO NHIÊU
--     Báo cáo cũ chỉ cộng tiền khách trả. File này thêm giá vốn vải và
--     chi phí chung, rồi trừ ra.
--
--  2. KHÔNG BIẾT AI MAY ĐƠN NÀO
--     Bảng don_hang chỉ có nguoi_tao — người NHẬP đơn vào máy, không
--     phải người MAY. Thêm danh sách thợ và gắn thợ vào từng đơn.
--
--  3. CÔNG NỢ MỘT CHIỀU
--     Theo dõi kỹ khách nợ mình, nhưng mình nợ ai thì không. Thêm sổ nợ
--     nhà cung cấp, làm giống hệt cách đang theo dõi khách nợ.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. THỢ MAY
-- ---------------------------------------------------------------------
--  Bảng RIÊNG, không dùng lại nguoi_dung.
--
--  Vì sao: thợ may thường KHÔNG cần tài khoản đăng nhập. Bắt mỗi thợ
--  phải có tài khoản chỉ để được gắn tên vào đơn là vừa phiền vừa mở
--  thêm cửa vào phần mềm một cách không cần thiết.
-- =====================================================================

create table if not exists public.tho_may (
  id             uuid primary key default gen_random_uuid(),
  ho_ten         text not null check (length(trim(ho_ten)) > 0),
  so_dien_thoai  text not null default '',
  ghi_chu        text,

  -- Nghỉ việc thì tắt, không xoá — đơn cũ vẫn phải tra được ai may.
  dang_lam_viec  boolean not null default true,

  ngay_tao       timestamptz not null default now()
);

comment on table public.tho_may is
  'Danh sách thợ may. Tách khỏi nguoi_dung vì thợ không cần tài khoản đăng nhập.';

create index if not exists idx_tho_may_dang_lam
  on public.tho_may (dang_lam_viec, ho_ten);

-- Gắn thợ vào đơn hàng.
-- on delete set null: lỡ xoá thợ thì đơn vẫn còn, chỉ mất tên người may.
alter table public.don_hang
  add column if not exists tho_may_id uuid references public.tho_may(id) on delete set null;

create index if not exists idx_don_hang_tho
  on public.don_hang (tho_may_id, ngay_nhan desc);


-- =====================================================================
--  PHẦN 2. NHÀ CUNG CẤP VÀ SỔ NỢ
-- =====================================================================

create table if not exists public.nha_cung_cap (
  id             uuid primary key default gen_random_uuid(),
  ten            text not null check (length(trim(ten)) > 0),
  so_dien_thoai  text not null default '',
  dia_chi        text,
  ghi_chu        text,
  dang_hop_tac   boolean not null default true,
  ngay_tao       timestamptz not null default now()
);

create index if not exists idx_ncc_ten on public.nha_cung_cap (ten);

-- Mỗi lần NHẬP vải là một lần ghi nợ. Gắn vào nhà cung cấp nào.
--
-- Để trống cũng được: những lần nhập từ trước file này không có thông
-- tin đó, và báo cáo sẽ nói rõ là có bao nhiêu tiền chưa gắn.
alter table public.giao_dich_kho
  add column if not exists nha_cung_cap_id uuid
    references public.nha_cung_cap(id) on delete set null;

create index if not exists idx_gdk_ncc
  on public.giao_dich_kho (nha_cung_cap_id, ngay desc);

-- Mỗi lần TRẢ TIỀN cho nhà cung cấp.
-- Làm giống hệt bảng thanh_toan của khách, để người dùng quen tay ngay.
create table if not exists public.tra_nha_cung_cap (
  id               uuid primary key default gen_random_uuid(),
  nha_cung_cap_id  uuid not null references public.nha_cung_cap(id) on delete cascade,
  so_tien          numeric(14,2) not null check (so_tien > 0),
  hinh_thuc        text not null default 'tien_mat'
                   check (hinh_thuc in ('tien_mat','chuyen_khoan','the','vi_dien_tu')),
  ngay             date not null default current_date,
  ghi_chu          text,
  ngay_tao         timestamptz not null default now(),
  nguoi_tao        uuid references public.nguoi_dung(id) on delete set null
);

create index if not exists idx_tra_ncc
  on public.tra_nha_cung_cap (nha_cung_cap_id, ngay desc);


-- =====================================================================
--  PHẦN 3. CHI PHÍ CHUNG
-- ---------------------------------------------------------------------
--  Tiền vải đã có trong kho rồi. Đây là những khoản KHÁC: thuê nhà,
--  điện nước, lương thợ, mua sắm máy móc...
-- =====================================================================

create table if not exists public.chi_phi (
  id         uuid primary key default gen_random_uuid(),
  ngay       date not null default current_date,
  loai       text not null default 'khac'
             check (loai in ('thue_nha','dien_nuoc','luong','mua_sam','van_chuyen','khac')),
  so_tien    numeric(14,2) not null check (so_tien > 0),
  ghi_chu    text,
  ngay_tao   timestamptz not null default now(),
  nguoi_tao  uuid references public.nguoi_dung(id) on delete set null
);

create index if not exists idx_chi_phi_ngay on public.chi_phi (ngay desc);


-- =====================================================================
--  PHẦN 4. QUY TẮC AI ĐƯỢC LÀM GÌ
--  Dùng đúng bộ quy tắc của mấy bảng nghiệp vụ khác ở file 01:
--  đăng nhập rồi thì xem/thêm/sửa được, chỉ Quản trị viên được xoá.
-- =====================================================================

do $$
declare
  ten_bang text;
begin
  foreach ten_bang in array array[
    'tho_may', 'nha_cung_cap', 'tra_nha_cung_cap', 'chi_phi'
  ]
  loop
    execute format('alter table public.%I enable row level security', ten_bang);

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

    execute format($f$
      create policy p_%1$s_xoa on public.%1$s
        for delete to authenticated using (public.la_quan_tri())
    $f$, ten_bang);
  end loop;
end;
$$;

grant select, insert, update, delete
  on public.tho_may, public.nha_cung_cap, public.tra_nha_cung_cap, public.chi_phi
  to authenticated;


-- =====================================================================
--  PHẦN 5. CÔNG NỢ NHÀ CUNG CẤP
-- ---------------------------------------------------------------------
--  Nợ = tổng tiền hàng đã NHẬP  −  tổng tiền đã TRẢ.
--  Đúng công thức đang dùng cho khách nợ tiệm, chỉ ngược chiều.
-- =====================================================================

create or replace view public.v_cong_no_ncc as
select
  n.id,
  n.ten,
  n.so_dien_thoai,
  n.dia_chi,
  n.dang_hop_tac,
  coalesce(mua.tien_hang, 0)  as tien_hang,
  coalesce(tra.da_tra, 0)     as da_tra,
  coalesce(mua.tien_hang, 0) - coalesce(tra.da_tra, 0) as con_no,
  mua.lan_nhap_gan_nhat,
  tra.lan_tra_gan_nhat
from public.nha_cung_cap n
left join (
  select
    g.nha_cung_cap_id as id,
    -- Không khai đơn giá lúc nhập thì lấy giá nhập đang đặt của vật tư
    sum(g.so_luong * coalesce(g.don_gia, v.gia_nhap)) as tien_hang,
    max(g.ngay) as lan_nhap_gan_nhat
  from public.giao_dich_kho g
  join public.vat_tu v on v.id = g.vat_tu_id
  where g.loai = 'nhap' and g.nha_cung_cap_id is not null
  group by 1
) mua on mua.id = n.id
left join (
  select nha_cung_cap_id as id, sum(so_tien) as da_tra, max(ngay) as lan_tra_gan_nhat
  from public.tra_nha_cung_cap
  group by 1
) tra on tra.id = n.id;

comment on view public.v_cong_no_ncc is
  'Mỗi nhà cung cấp: đã nhập bao nhiêu tiền hàng, đã trả bao nhiêu, còn nợ bao nhiêu.';

grant select on public.v_cong_no_ncc to authenticated;


-- =====================================================================
--  PHẦN 6. BÁO CÁO LÃI LỖ
-- ---------------------------------------------------------------------
--  ĐỌC KỸ CHỖ NÀY TRƯỚC KHI TIN CON SỐ LÃI
--
--  Giá vốn vải tính theo số vải ĐÃ XUẤT cho đơn, không phải số vải đã
--  mua. Mua vải về để đấy là tiền nằm trong kho, chưa phải chi phí —
--  tính vào là lỗ giả.
--
--  Nhưng xuất vải mà KHÔNG chọn đơn hàng thì không biết nó thuộc đơn
--  nào. Phần mềm vẫn cho xuất như vậy (vải dùng chung, vải hỏng...),
--  nên báo cáo tách riêng hai con số:
--
--     vai_gan_don     — tiền vải đã biết thuộc đơn nào
--     vai_chua_gan    — tiền vải chưa gắn đơn
--
--  Cả hai đều bị trừ vào lãi, nhưng tách ra để bạn biết con số lãi
--  đáng tin tới đâu. vai_chua_gan càng lớn thì lãi theo TỪNG ĐƠN càng
--  kém chính xác — lãi toàn tiệm thì vẫn đúng.
-- =====================================================================

create or replace function public.bao_cao_lai_lo(
  tu_ngay  date default (current_date - 29),
  den_ngay date default current_date
)
returns table (
  doanh_thu     numeric,
  vai_gan_don   numeric,
  vai_chua_gan  numeric,
  chi_phi_chung numeric,
  lai           numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.la_quan_ly() then
    raise exception 'Chi Quan ly tro len moi xem duoc bao cao lai lo.';
  end if;

  return query
  with thu as (
    select coalesce(sum(so_tien), 0)::numeric as v
      from public.thanh_toan
     where ngay_thanh_toan between tu_ngay and den_ngay
  ),
  vai as (
    select
      coalesce(sum(case when g.don_hang_id is not null
                        then g.so_luong * coalesce(g.don_gia, v.gia_nhap) end), 0)::numeric as co,
      coalesce(sum(case when g.don_hang_id is null
                        then g.so_luong * coalesce(g.don_gia, v.gia_nhap) end), 0)::numeric as khong
    from public.giao_dich_kho g
    join public.vat_tu v on v.id = g.vat_tu_id
    where g.loai = 'xuat' and g.ngay between tu_ngay and den_ngay
  ),
  cp as (
    select coalesce(sum(so_tien), 0)::numeric as v
      from public.chi_phi
     where ngay between tu_ngay and den_ngay
  )
  select
    thu.v, vai.co, vai.khong, cp.v,
    (thu.v - vai.co - vai.khong - cp.v)::numeric
  from thu, vai, cp;
end $$;

revoke all on function public.bao_cao_lai_lo(date, date) from public, anon;
grant execute on function public.bao_cao_lai_lo(date, date) to authenticated;


-- --- Lãi của TỪNG ĐƠN ------------------------------------------------
-- Chỉ tính được phần vải đã gắn đơn. Đơn nào chưa gắn vải thì giá vốn
-- bằng 0, và con số lãi của riêng đơn đó là ảo — phần mềm nói rõ điều
-- này ngay trên màn hình.
create or replace view public.v_lai_lo_don as
select
  d.id,
  d.ma_don,
  d.khach_hang_id,
  d.ngay_nhan,
  d.trang_thai,
  d.tho_may_id,
  coalesce(sp.tien_hang, 0)  as tien_hang,
  coalesce(d.giam_gia, 0)    as giam_gia,
  coalesce(tt.da_thu, 0)     as da_thu,
  coalesce(vai.gia_von, 0)   as gia_von,
  coalesce(tt.da_thu, 0) - coalesce(vai.gia_von, 0) as lai_tam_tinh,
  vai.gia_von is null        as chua_gan_vai
from public.don_hang d
left join (
  select don_hang_id, sum(thanh_tien) as tien_hang
    from public.dong_san_pham group by 1
) sp on sp.don_hang_id = d.id
left join (
  select don_hang_id, sum(so_tien) as da_thu
    from public.thanh_toan group by 1
) tt on tt.don_hang_id = d.id
left join (
  select g.don_hang_id, sum(g.so_luong * coalesce(g.don_gia, v.gia_nhap)) as gia_von
    from public.giao_dich_kho g
    join public.vat_tu v on v.id = g.vat_tu_id
   where g.loai = 'xuat' and g.don_hang_id is not null
   group by 1
) vai on vai.don_hang_id = d.id;

grant select on public.v_lai_lo_don to authenticated;


-- --- Thống kê theo thợ -----------------------------------------------
create or replace function public.thong_ke_tho(
  tu_ngay  date default (current_date - 29),
  den_ngay date default current_date
)
returns table (
  tho_may_id    uuid,
  ho_ten        text,
  dang_lam_viec boolean,
  so_don        integer,
  dang_may      integer,
  tre_hen       integer,
  tien_hang     numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.da_dang_nhap() then
    raise exception 'Phai dang nhap moi xem duoc.';
  end if;

  return query
  select
    t.id,
    t.ho_ten,
    t.dang_lam_viec,
    count(d.id)::integer,
    count(d.id) filter (where d.trang_thai in ('dang_may','cho_thu'))::integer,
    count(d.id) filter (
      where d.trang_thai not in ('da_giao','da_huy') and d.ngay_hen_giao < current_date
    )::integer,
    coalesce(sum(sp.tien_hang), 0)::numeric
  from public.tho_may t
  left join public.don_hang d
    on d.tho_may_id = t.id and d.ngay_nhan between tu_ngay and den_ngay
  left join (
    select don_hang_id, sum(thanh_tien) as tien_hang
      from public.dong_san_pham group by 1
  ) sp on sp.don_hang_id = d.id
  group by t.id, t.ho_ten, t.dang_lam_viec
  order by count(d.id) desc, t.ho_ten;
end $$;

revoke all on function public.thong_ke_tho(date, date) from public, anon;
grant execute on function public.thong_ke_tho(date, date) to authenticated;


-- =====================================================================
--  PHẦN 6b. DỰNG LẠI KHUNG NHÌN ĐƠN HÀNG, KÈM TÊN THỢ
-- ---------------------------------------------------------------------
--  Màn hình danh sách đơn đọc v_don_hang. Thêm cột tho_may_id và ten_tho
--  vào đây thì danh sách hiện được tên thợ mà không phải hỏi thêm lượt
--  nào nữa.
--
--  Giữ NGUYÊN THỨ TỰ mấy cột cũ và chỉ thêm vào CUỐI — "create or
--  replace view" của PostgreSQL không cho đổi hay chèn cột giữa chừng.
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
  coalesce(sp.so_mon, 0)                                           as so_mon,
  -- Hai cột mới, thêm ở CUỐI
  d.tho_may_id,
  tm.ho_ten as ten_tho
from public.don_hang d
join public.khach_hang k on k.id = d.khach_hang_id
left join public.tho_may tm on tm.id = d.tho_may_id
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

grant select on public.v_don_hang to authenticated;


-- =====================================================================
--  PHẦN 7. GHI NHẬT KÝ CHO MẤY BẢNG MỚI
-- ---------------------------------------------------------------------
--  chi_phi và tra_nha_cung_cap là TIỀN RA. Không ghi nhật ký thì sửa
--  một khoản chi phí xong không ai biết — đúng cái lỗ hổng mà file 08
--  sinh ra để bịt, nhưng chỉ bịt cho mấy bảng có sẵn lúc đó.
--
--  Dùng lại hàm ghi_nhat_ky() của file 08. Chưa chạy file 08 thì đoạn
--  này bỏ qua lặng lẽ, không làm hỏng việc cài đặt.
-- =====================================================================

do $$
declare
  ten_bang text;
begin
  if to_regproc('public.ghi_nhat_ky') is null then
    raise warning 'Chua chay 08_nhat_ky.sql nen khong gan duoc nhat ky cho bang moi.';
    return;
  end if;

  foreach ten_bang in array array[
    'chi_phi',           -- tiền chi ra
    'tra_nha_cung_cap',  -- tiền trả nhà cung cấp
    'tho_may',           -- thêm, sửa, cho nghỉ
    'nha_cung_cap'
  ]
  loop
    execute format('drop trigger if exists tg_nhat_ky on public.%I', ten_bang);
    execute format(
      'create trigger tg_nhat_ky after insert or update or delete on public.%I
         for each row execute function public.ghi_nhat_ky()', ten_bang);
  end loop;
end $$;

-- =====================================================================
--  PHẦN 8. ĐƯA MẤY BẢNG MỚI VÀO BẢN CHỤP KHẨN
-- ---------------------------------------------------------------------
--  File 14 chụp sổ sách khi có việc nặng về tiền. Lúc viết file đó chưa
--  có chi_phi và tra_nha_cung_cap — hai bảng tiền ra. Không thêm vào
--  thì bản chụp thiếu đúng phần dễ bị sửa nhất.
--
--  Chưa chạy file 14 thì đoạn này bỏ qua lặng lẽ.
-- =====================================================================

do $cp$
begin
  if to_regproc('public.chup_ban_luu_khan') is null then
    return;
  end if;

  create or replace function public.chup_ban_luu_khan(ly text, ai uuid, ten text)
  returns void
  language plpgsql
  volatile
  security definer
  set search_path = public
  as $ham$
  declare
    goi jsonb;
    dem integer;
  begin
    if exists (
      select 1 from public.ban_chup_khan
       where thoi_diem > now() - interval '30 minutes'
    ) then
      return;
    end if;

    select jsonb_build_object(
      'khach_hang',       coalesce((select jsonb_agg(to_jsonb(t)) from public.khach_hang t), '[]'::jsonb),
      'ho_so_so_do',      coalesce((select jsonb_agg(to_jsonb(t)) from public.ho_so_so_do t), '[]'::jsonb),
      'don_hang',         coalesce((select jsonb_agg(to_jsonb(t)) from public.don_hang t), '[]'::jsonb),
      'dong_san_pham',    coalesce((select jsonb_agg(to_jsonb(t)) from public.dong_san_pham t), '[]'::jsonb),
      'thanh_toan',       coalesce((select jsonb_agg(to_jsonb(t)) from public.thanh_toan t), '[]'::jsonb),
      'vat_tu',           coalesce((select jsonb_agg(to_jsonb(t)) from public.vat_tu t), '[]'::jsonb),
      'giao_dich_kho',    coalesce((select jsonb_agg(to_jsonb(t)) from public.giao_dich_kho t), '[]'::jsonb),
      'cai_dat',          coalesce((select jsonb_agg(to_jsonb(t)) from public.cai_dat t), '[]'::jsonb),
      'tho_may',          coalesce((select jsonb_agg(to_jsonb(t)) from public.tho_may t), '[]'::jsonb),
      'nha_cung_cap',     coalesce((select jsonb_agg(to_jsonb(t)) from public.nha_cung_cap t), '[]'::jsonb),
      'tra_nha_cung_cap', coalesce((select jsonb_agg(to_jsonb(t)) from public.tra_nha_cung_cap t), '[]'::jsonb),
      'chi_phi',          coalesce((select jsonb_agg(to_jsonb(t)) from public.chi_phi t), '[]'::jsonb)
    ) into goi;

    select coalesce(sum(jsonb_array_length(v)), 0) into dem
      from jsonb_each(goi) as e(k, v);

    insert into public.ban_chup_khan (ly_do, nguoi_gay_ra, ten_nguoi, so_dong, du_lieu)
    values (ly, ai, coalesce(ten, 'Không rõ'), dem, goi);

    delete from public.ban_chup_khan
     where id not in (
       select id from public.ban_chup_khan order by thoi_diem desc limit 10
     );
  end $ham$;
end $cp$;

-- =====================================================================
--  XONG.
--
--  Đọc kết quả — phải ra MỘT dòng, tất cả true và số 0 ở cuối:
--     du_4_bang         true
--     co_cot_tho        true
--     co_cot_ncc        true
--     du_2_khung_nhin   true
--     nguoi_la_goi_duoc 0
-- =====================================================================
select
  (select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in ('tho_may','nha_cung_cap','tra_nha_cung_cap','chi_phi')) = 4
    as du_4_bang,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'don_hang'
      and column_name = 'tho_may_id') = 1 as co_cot_tho,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'giao_dich_kho'
      and column_name = 'nha_cung_cap_id') = 1 as co_cot_ncc,
  (select count(*) from information_schema.views
    where table_schema = 'public'
      and table_name in ('v_cong_no_ncc','v_lai_lo_don')) = 2 as du_2_khung_nhin,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('bao_cao_lai_lo','thong_ke_tho')
      and has_function_privilege('anon', p.oid, 'EXECUTE')) as nguoi_la_goi_duoc;
