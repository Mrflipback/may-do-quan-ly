-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 15
--  KHÔI PHỤC CÀI ĐẶT HỆ THỐNG — CẦN CẢ TIỆM ĐỒNG Ý
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 11 và 12. Chạy lại nhiều lần cũng không hỏng gì.
-- ---------------------------------------------------------------------
--  BA LỚP CHẶN, PHẢI QUA ĐỦ CẢ BA
--
--    1. Mật khẩu ĐĂNG NHẬP của chính người bấm
--       (phần mềm hỏi Supabase, không tự so)
--    2. Mật khẩu KHÔI PHỤC CÀI ĐẶT — một mật khẩu riêng, tự đặt,
--       khác cả mật khẩu đăng nhập lẫn mật khẩu xoá
--    3. MỌI tài khoản đang hoạt động trong tiệm đều bấm đồng ý
--
--  KHÔI PHỤC NHỮNG GÌ:
--     · Khoá màn hình khi để không
--     · Nuốt phím tắt mở công cụ lập trình
--     · Giờ tiệm đóng cửa
--
--  KHÔNG ĐỤNG TỚI:
--     · Thông tin tiệm (tên, địa chỉ, điện thoại, bảng giá...)
--     · Khách hàng, đơn hàng, tiền nong — không mất một dòng nào
--     · Mật khẩu xoá và mật khẩu khôi phục
--
--  ⚠️  VÌ SAO KHÔNG XOÁ HAI MẬT KHẨU KIA:
--  Nếu khôi phục cài đặt mà xoá luôn mật khẩu xoá, thì đây thành CỬA
--  SAU: khôi phục một phát là mất chốt chặn, rồi xoá sạch dữ liệu mà
--  không cần biết mật khẩu nào cả. Hai mật khẩu đó nằm ở bảng riêng và
--  file này không đụng vào.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

do $kt$
begin
  perform extensions.crypt('thu', extensions.gen_salt('bf', 4));
exception
  when undefined_function or invalid_schema_name then
    raise exception
      'KHONG GOI DUOC extensions.crypt. pgcrypto chua nam trong luoc do "extensions". Bao lai cho nguoi lam phan mem.';
end $kt$;


-- =====================================================================
--  PHẦN 1. MẬT KHẨU KHÔI PHỤC
--  Cất giống hệt mật khẩu xoá: bảng riêng, không ai đọc được.
-- =====================================================================

create table if not exists public.khoa_dat_lai (
  mot_dong   boolean primary key default true check (mot_dong),
  bam        text not null,
  ngay_dat   timestamptz not null default now(),
  nguoi_dat  uuid,
  lan_sai    integer not null default 0,
  khoa_den   timestamptz
);

comment on table public.khoa_dat_lai is
  'Dấu vân tay của mật khẩu khôi phục cài đặt. Không cấp quyền cho ai.';

alter table public.khoa_dat_lai enable row level security;
revoke all on table public.khoa_dat_lai from authenticated, anon, public;


-- Hàm kiểm nội bộ. KHÔNG cấp quyền gọi cho ai.
--
-- Trả về chuỗi rỗng nghĩa là đúng. KHÔNG được "raise exception" khi sai
-- mật khẩu: Postgres cuộn ngược mọi thứ khi có lỗi, kể cả câu lệnh vừa
-- tăng số lần gõ sai — báo lỗi là mất luôn cái đếm.
create or replace function public.kiem_khoa_dat_lai_noi_bo(mk text)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  r public.khoa_dat_lai%rowtype;
  con_phut integer;
begin
  select * into r from public.khoa_dat_lai limit 1;
  if not found then
    return 'chua_dat';
  end if;

  if r.khoa_den is not null and r.khoa_den > now() then
    con_phut := greatest(1, ceil(extract(epoch from (r.khoa_den - now())) / 60)::integer);
    return 'bi_khoa:' || con_phut;
  end if;

  if r.bam = extensions.crypt(coalesce(mk, ''), r.bam) then
    update public.khoa_dat_lai set lan_sai = 0, khoa_den = null where mot_dong;
    return '';
  end if;

  update public.khoa_dat_lai
     set lan_sai  = r.lan_sai + 1,
         khoa_den = case when r.lan_sai + 1 >= 5
                         then now() + interval '15 minutes' else null end
   where mot_dong;

  if r.lan_sai + 1 >= 5 then
    return 'bi_khoa:15';
  end if;
  return 'sai:' || (5 - (r.lan_sai + 1));
end $$;

revoke all on function public.kiem_khoa_dat_lai_noi_bo(text) from public, anon, authenticated;


create or replace function public.co_mat_khau_dat_lai()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.khoa_dat_lai);
$$;

revoke all on function public.co_mat_khau_dat_lai() from public, anon;
grant execute on function public.co_mat_khau_dat_lai() to authenticated;


create or replace function public.dat_mat_khau_dat_lai(mk_moi text, mk_cu text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  ma text;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi dat duoc mat khau khoi phuc.';
  end if;

  if mk_moi is null or length(mk_moi) < 6 then
    return jsonb_build_object('ok', false, 'ly_do', 'qua_ngan',
      'loi', 'Mật khẩu khôi phục phải có ít nhất 6 ký tự.');
  end if;
  if length(mk_moi) > 72 then
    return jsonb_build_object('ok', false, 'ly_do', 'qua_dai',
      'loi', 'Mật khẩu khôi phục quá dài, tối đa 72 ký tự.');
  end if;
  if btrim(mk_moi) = '' then
    return jsonb_build_object('ok', false, 'ly_do', 'trong',
      'loi', 'Mật khẩu khôi phục không được toàn khoảng trắng.');
  end if;

  if exists (select 1 from public.khoa_dat_lai) then
    ma := public.kiem_khoa_dat_lai_noi_bo(mk_cu);
    if ma <> '' then
      return public.loi_khoa_xoa_noi_bo(ma);
    end if;
  end if;

  insert into public.khoa_dat_lai (mot_dong, bam, ngay_dat, nguoi_dat, lan_sai, khoa_den)
  values (true, extensions.crypt(mk_moi, extensions.gen_salt('bf', 10)),
          now(), auth.uid(), 0, null)
  on conflict (mot_dong) do update
    set bam = excluded.bam, ngay_dat = now(), nguoi_dat = auth.uid(),
        lan_sai = 0, khoa_den = null;

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.dat_mat_khau_dat_lai(text, text) from public, anon;
grant execute on function public.dat_mat_khau_dat_lai(text, text) to authenticated;


-- =====================================================================
--  PHẦN 2. PHIẾU XIN KHÔI PHỤC VÀ CHỮ KÝ ĐỒNG Ý
-- =====================================================================

create table if not exists public.yeu_cau_dat_lai (
  id            bigint generated always as identity primary key,
  nguoi_yeu_cau uuid not null,
  ly_do         text not null default '',
  thoi_diem     timestamptz not null default now(),

  -- Phiếu hết hạn sau 24 tiếng. Không để phiếu nằm chờ mãi: người ta
  -- quên mất là đang có phiếu, rồi một hôm ai đó bấm nốt chữ ký cuối
  -- cùng và cài đặt bay mất mà không ai hiểu vì sao.
  han_den       timestamptz not null default (now() + interval '24 hours'),

  trang_thai    text not null default 'cho_duyet'
                check (trang_thai in ('cho_duyet', 'da_chay', 'da_huy'))
);

create index if not exists idx_yeu_cau_dat_lai_tt
  on public.yeu_cau_dat_lai (trang_thai, thoi_diem desc);

create table if not exists public.duyet_dat_lai (
  yeu_cau_id  bigint not null references public.yeu_cau_dat_lai(id) on delete cascade,
  nguoi_duyet uuid not null,
  thoi_diem   timestamptz not null default now(),
  primary key (yeu_cau_id, nguoi_duyet)
);

alter table public.yeu_cau_dat_lai enable row level security;
alter table public.duyet_dat_lai   enable row level security;
revoke all on table public.yeu_cau_dat_lai from authenticated, anon, public;
revoke all on table public.duyet_dat_lai   from authenticated, anon, public;


-- --- Tạo phiếu -------------------------------------------------------
create or replace function public.tao_yeu_cau_dat_lai(ly_do text default '')
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  ma bigint;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi tao duoc phieu khoi phuc.';
  end if;

  -- Dọn phiếu quá hạn trước, để không vướng phiếu cũ
  update public.yeu_cau_dat_lai
     set trang_thai = 'da_huy'
   where trang_thai = 'cho_duyet' and han_den < now();

  if exists (select 1 from public.yeu_cau_dat_lai where trang_thai = 'cho_duyet') then
    return jsonb_build_object('ok', false, 'ly_do', 'dang_co_phieu',
      'loi', 'Đang có một phiếu chờ duyệt. Huỷ phiếu đó trước đã.');
  end if;

  insert into public.yeu_cau_dat_lai (nguoi_yeu_cau, ly_do)
  values (auth.uid(), coalesce(ly_do, ''))
  returning id into ma;

  -- Người tạo phiếu tự động tính là đã đồng ý
  insert into public.duyet_dat_lai (yeu_cau_id, nguoi_duyet)
  values (ma, auth.uid());

  return jsonb_build_object('ok', true, 'id', ma);
end $$;

revoke all on function public.tao_yeu_cau_dat_lai(text) from public, anon;
grant execute on function public.tao_yeu_cau_dat_lai(text) to authenticated;


-- --- Ký đồng ý -------------------------------------------------------
--
-- Ai cũng ký được cho CHÍNH MÌNH, kể cả Nhân viên — vì "cả tiệm đồng ý"
-- nghĩa là mọi tài khoản, không riêng Quản trị viên.
--
-- auth.uid() là bằng chứng danh tính, nên không ai ký hộ người khác
-- được. Phần mềm còn hỏi lại mật khẩu đăng nhập trước khi gọi hàm này,
-- để chặn người ngồi vào máy đang mở sẵn ký bừa.
create or replace function public.duyet_yeu_cau_dat_lai(ma bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r public.yeu_cau_dat_lai%rowtype;
begin
  if not public.da_dang_nhap() then
    raise exception 'Phai dang nhap moi ky duoc.';
  end if;

  select * into r from public.yeu_cau_dat_lai where id = ma;
  if not found then
    return jsonb_build_object('ok', false, 'loi', 'Không tìm thấy phiếu này.');
  end if;
  if r.trang_thai <> 'cho_duyet' then
    return jsonb_build_object('ok', false, 'loi', 'Phiếu này không còn chờ duyệt nữa.');
  end if;
  if r.han_den < now() then
    update public.yeu_cau_dat_lai set trang_thai = 'da_huy' where id = ma;
    return jsonb_build_object('ok', false, 'loi', 'Phiếu đã quá hạn 24 tiếng.');
  end if;

  insert into public.duyet_dat_lai (yeu_cau_id, nguoi_duyet)
  values (ma, auth.uid())
  on conflict do nothing;

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.duyet_yeu_cau_dat_lai(bigint) from public, anon;
grant execute on function public.duyet_yeu_cau_dat_lai(bigint) to authenticated;


-- --- Huỷ phiếu -------------------------------------------------------
create or replace function public.huy_yeu_cau_dat_lai(ma bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi huy duoc phieu.';
  end if;
  update public.yeu_cau_dat_lai set trang_thai = 'da_huy'
   where id = ma and trang_thai = 'cho_duyet';
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.huy_yeu_cau_dat_lai(bigint) from public, anon;
grant execute on function public.huy_yeu_cau_dat_lai(bigint) to authenticated;


-- --- Xem phiếu đang chờ ----------------------------------------------
create or replace function public.phieu_dat_lai_dang_cho()
returns table (
  id            bigint,
  ly_do         text,
  thoi_diem     timestamptz,
  han_den       timestamptz,
  ten_nguoi_yeu_cau text,
  tong_tai_khoan    integer,
  da_duyet          integer,
  toi_da_ky         boolean,
  ai_chua_ky        text[]
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
    r.id, r.ly_do, r.thoi_diem, r.han_den,
    coalesce(u.ho_ten, 'Không rõ')::text,
    (select count(*)::integer from public.nguoi_dung where dang_hoat_dong),
    (select count(*)::integer from public.duyet_dat_lai d
      join public.nguoi_dung n on n.id = d.nguoi_duyet and n.dang_hoat_dong
     where d.yeu_cau_id = r.id),
    exists (select 1 from public.duyet_dat_lai d
             where d.yeu_cau_id = r.id and d.nguoi_duyet = auth.uid()),
    coalesce((
      select array_agg(n.ho_ten order by n.ho_ten)
        from public.nguoi_dung n
       where n.dang_hoat_dong
         and not exists (select 1 from public.duyet_dat_lai d
                          where d.yeu_cau_id = r.id and d.nguoi_duyet = n.id)
    ), array[]::text[])
  from public.yeu_cau_dat_lai r
  left join public.nguoi_dung u on u.id = r.nguoi_yeu_cau
  where r.trang_thai = 'cho_duyet' and r.han_den > now()
  order by r.thoi_diem desc
  limit 1;
end $$;

revoke all on function public.phieu_dat_lai_dang_cho() from public, anon;
grant execute on function public.phieu_dat_lai_dang_cho() to authenticated;


-- =====================================================================
--  PHẦN 3. CHẠY KHÔI PHỤC
-- ---------------------------------------------------------------------
--  Không báo lỗi khi sai mật khẩu — trả về {"ok": false} để giao dịch
--  được ghi nhận, giữ lại cái đếm số lần gõ sai.
-- =====================================================================

create or replace function public.chay_dat_lai_cai_dat(ma bigint, mk_khoi_phuc text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  r     public.yeu_cau_dat_lai%rowtype;
  loi   text;
  tong  integer;
  ky    integer;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi chay duoc khoi phuc cai dat.';
  end if;

  select * into r from public.yeu_cau_dat_lai where id = ma;
  if not found or r.trang_thai <> 'cho_duyet' then
    return jsonb_build_object('ok', false, 'ly_do', 'khong_co_phieu',
      'loi', 'Không có phiếu nào đang chờ. Tạo phiếu mới đi.');
  end if;
  if r.han_den < now() then
    update public.yeu_cau_dat_lai set trang_thai = 'da_huy' where id = ma;
    return jsonb_build_object('ok', false, 'ly_do', 'qua_han',
      'loi', 'Phiếu đã quá hạn 24 tiếng. Tạo phiếu mới.');
  end if;

  -- Đủ chữ ký chưa
  select count(*)::integer into tong from public.nguoi_dung where dang_hoat_dong;
  select count(*)::integer into ky
    from public.duyet_dat_lai d
    join public.nguoi_dung n on n.id = d.nguoi_duyet and n.dang_hoat_dong
   where d.yeu_cau_id = ma;

  if ky < tong then
    return jsonb_build_object('ok', false, 'ly_do', 'thieu_chu_ky',
      'con_thieu', tong - ky,
      'loi', 'Còn ' || (tong - ky) || ' người chưa bấm đồng ý.');
  end if;

  -- Mật khẩu khôi phục
  loi := public.kiem_khoa_dat_lai_noi_bo(mk_khoi_phuc);
  if loi <> '' then
    return public.loi_khoa_xoa_noi_bo(loi);
  end if;

  -- CHỈ xoá mấy khoá cài đặt bảo mật và hành vi.
  -- KHÔNG đụng thông tin tiệm, KHÔNG đụng khoa_xoa / khoa_dat_lai.
  delete from public.cai_dat
   where khoa in ('khoa_man_hinh_phut', 'chan_devtools', 'gio_dem_tu', 'gio_dem_den');

  update public.yeu_cau_dat_lai set trang_thai = 'da_chay' where id = ma;

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.chay_dat_lai_cai_dat(bigint, text) from public, anon;
grant execute on function public.chay_dat_lai_cai_dat(bigint, text) to authenticated;


-- =====================================================================
--  XONG.
--
--  Đọc kết quả:
--     so_ham_da_tao      phải bằng 7
--     nguoi_la_doc_duoc  phải bằng 0
--     da_dat_mat_khau    false — vào Cài đặt đặt mật khẩu khôi phục
-- =====================================================================
select
  (select count(*)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('kiem_khoa_dat_lai_noi_bo', 'co_mat_khau_dat_lai',
                        'dat_mat_khau_dat_lai', 'tao_yeu_cau_dat_lai',
                        'duyet_yeu_cau_dat_lai', 'huy_yeu_cau_dat_lai',
                        'phieu_dat_lai_dang_cho')
  ) as so_ham_da_tao,
  (select count(*) from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('khoa_dat_lai', 'yeu_cau_dat_lai', 'duyet_dat_lai')
      and grantee in ('authenticated', 'anon', 'PUBLIC')) as nguoi_la_doc_duoc,
  (select exists (select 1 from public.khoa_dat_lai)) as da_dat_mat_khau;
