-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 14
--  TỰ CHỤP MỘT BẢN LƯU KHI CÓ DẤU HIỆU NẶNG VỀ TIỀN
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 08. Chạy lại nhiều lần cũng không hỏng gì.
-- ---------------------------------------------------------------------
--  LÀM GÌ
--
--  Khi có người làm một việc nặng về tiền, cơ sở dữ liệu TỰ chụp lại
--  một bản lưu toàn bộ sổ sách ngay tại thời điểm đó, cất ngay trong
--  Supabase. Sau này nếu phát hiện ra chuyện, bạn còn bản trước đó để
--  đối chiếu.
--
--  BA VIỆC LÀM NỔ:
--     · Xoá một khoản khách đã trả
--     · Sửa một khoản tiền THẤP XUỐNG
--     · Xoá từ ba thứ trở lên trong mười phút, bởi cùng một người
--
--  CỐ Ý KHÔNG tính "làm lúc tiệm đóng cửa" và "địa chỉ mạng lạ" — hai
--  dấu đó nổ suốt khi chủ tiệm ngồi muộn hay đổi từ wifi sang 4G.
--
--  VÌ SAO CẤT Ở MÁY CHỦ, KHÔNG TẢI VỀ MÁY AI:
--  File sao lưu chứa TOÀN BỘ khách hàng, đơn hàng, thanh toán và công
--  nợ. Đẩy nó về máy mọi người là mỗi nhân viên có một bản đầy đủ sổ
--  sách của tiệm — kể cả người không được xem báo cáo doanh thu. Thêm
--  nữa, trình duyệt chặn tải file tự động khi không có ai bấm, và máy
--  đang tắt thì không nhận được gì.
--
--  Cất ở đây thì không phụ thuộc máy ai đang mở, và chủ tiệm vào tải
--  về lúc nào cũng được.
--
--  VÌ SAO LÀM Ở TẦNG CƠ SỞ DỮ LIỆU:
--  Để không ai tắt được. Phần mềm chạy trong trình duyệt thì người ngồi
--  trước máy tắt được; cơ sở dữ liệu thì không.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. CHỖ CẤT BẢN CHỤP
-- =====================================================================

create table if not exists public.ban_chup_khan (
  id            bigint generated always as identity primary key,
  thoi_diem     timestamptz not null default now(),

  -- Vì sao bản này được chụp
  ly_do         text not null,

  -- Ai gây ra. Giữ luôn TÊN, vì sau này người đó bị xoá khỏi tiệm thì
  -- vẫn phải biết là ai.
  nguoi_gay_ra  uuid,
  ten_nguoi     text not null default 'Không rõ',

  so_dong       integer not null default 0,
  du_lieu       jsonb not null
);

comment on table public.ban_chup_khan is
  'Bản lưu tự chụp khi có việc nặng về tiền. Chỉ Quản trị viên đọc được.';

create index if not exists idx_ban_chup_thoi_diem
  on public.ban_chup_khan (thoi_diem desc);

-- Bật RLS và KHÔNG tạo policy nào. Không ai đọc thẳng được; chỉ đi qua
-- hàm ở phần 4, mà hàm đó hỏi quyền Quản trị viên.
alter table public.ban_chup_khan enable row level security;
revoke all on table public.ban_chup_khan from authenticated, anon, public;


-- =====================================================================
--  PHẦN 2. HÀM CHỤP
-- ---------------------------------------------------------------------
--  GIỮ TỐI ĐA 10 BẢN và MỖI 30 PHÚT CHỈ CHỤP MỘT LẦN.
--
--  Không chặn như vậy thì một đợt dọn sổ sách bình thường cũng sinh ra
--  vài chục bản chụp, mỗi bản là toàn bộ sổ sách — đầy chỗ rất nhanh,
--  mà gói Supabase miễn phí thì có hạn.
-- =====================================================================

create or replace function public.chup_ban_luu_khan(ly text, ai uuid, ten text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  goi jsonb;
  dem integer;
begin
  -- Vừa chụp xong thì thôi
  if exists (
    select 1 from public.ban_chup_khan
     where thoi_diem > now() - interval '30 minutes'
  ) then
    return;
  end if;

  select jsonb_build_object(
    'khach_hang',    coalesce((select jsonb_agg(to_jsonb(t)) from public.khach_hang t), '[]'::jsonb),
    'ho_so_so_do',   coalesce((select jsonb_agg(to_jsonb(t)) from public.ho_so_so_do t), '[]'::jsonb),
    'don_hang',      coalesce((select jsonb_agg(to_jsonb(t)) from public.don_hang t), '[]'::jsonb),
    'dong_san_pham', coalesce((select jsonb_agg(to_jsonb(t)) from public.dong_san_pham t), '[]'::jsonb),
    'thanh_toan',    coalesce((select jsonb_agg(to_jsonb(t)) from public.thanh_toan t), '[]'::jsonb),
    'vat_tu',        coalesce((select jsonb_agg(to_jsonb(t)) from public.vat_tu t), '[]'::jsonb),
    'giao_dich_kho', coalesce((select jsonb_agg(to_jsonb(t)) from public.giao_dich_kho t), '[]'::jsonb),
    'cai_dat',       coalesce((select jsonb_agg(to_jsonb(t)) from public.cai_dat t), '[]'::jsonb)
  ) into goi;

  select coalesce(sum(jsonb_array_length(v)), 0) into dem
    from jsonb_each(goi) as e(k, v);

  insert into public.ban_chup_khan (ly_do, nguoi_gay_ra, ten_nguoi, so_dong, du_lieu)
  values (ly, ai, coalesce(ten, 'Không rõ'), dem, goi);

  -- Dọn bản cũ, chỉ giữ 10 bản gần nhất
  delete from public.ban_chup_khan
   where id not in (
     select id from public.ban_chup_khan order by thoi_diem desc limit 10
   );
end $$;

revoke all on function public.chup_ban_luu_khan(text, uuid, text) from public, anon, authenticated;


-- =====================================================================
--  PHẦN 3. CÁI CÒ — GẮN VÀO SỔ NHẬT KÝ
-- ---------------------------------------------------------------------
--  ⚠️  ĐIỀU QUAN TRỌNG NHẤT TRONG FILE NÀY
--
--  Cái cò này chạy BÊN TRONG giao dịch của người dùng. Nghĩa là nếu nó
--  báo lỗi, việc người dùng đang làm cũng hỏng theo.
--
--  Nhân viên xoá một khoản thanh toán nhầm, rồi vì bản chụp hỏng mà cả
--  thao tác xoá bị chặn lại — người đó sẽ không hiểu chuyện gì xảy ra.
--
--  Nên toàn bộ phần chụp được bọc trong "exception when others then
--  null": hỏng thì BỎ QUA LẶNG LẼ, không bao giờ làm hỏng việc của
--  người dùng. Bản chụp là thứ thêm vào, không phải thứ bắt buộc.
-- =====================================================================

create or replace function public.co_chup_ban_luu()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  ly     text := null;
  so_xoa integer;
begin
  -- Xoá một khoản khách đã trả
  if new.bang = 'thanh_toan' and new.hanh_dong = 'xoa' then
    ly := 'Xoá một khoản khách đã trả';

  -- Sửa tiền THẤP XUỐNG. Sửa lên thì không tính — không ai ăn bớt bằng
  -- cách cộng thêm.
  elsif new.bang = 'thanh_toan' and new.hanh_dong = 'sua'
        and new.tien_truoc is not null and new.tien_sau is not null
        and new.tien_sau < new.tien_truoc then
    ly := 'Sửa một khoản tiền thấp xuống';

  -- Xoá nhiều thứ liên tiếp
  elsif new.hanh_dong = 'xoa' then
    select count(*) into so_xoa
      from public.nhat_ky
     where hanh_dong = 'xoa'
       and nguoi_id is not distinct from new.nguoi_id
       and thoi_diem > now() - interval '10 minutes';
    if so_xoa >= 3 then
      ly := 'Xoá nhiều thứ liên tiếp trong mười phút';
    end if;
  end if;

  if ly is null then
    return new;
  end if;

  begin
    perform public.chup_ban_luu_khan(ly, new.nguoi_id, new.ten_nguoi);
  exception when others then
    -- Chụp hỏng thì thôi. TUYỆT ĐỐI không làm hỏng việc của người dùng.
    null;
  end;

  return new;
end $$;

drop trigger if exists tr_chup_ban_luu on public.nhat_ky;
create trigger tr_chup_ban_luu
  after insert on public.nhat_ky
  for each row execute function public.co_chup_ban_luu();


-- =====================================================================
--  PHẦN 4. ĐỌC DANH SÁCH VÀ TẢI VỀ
-- =====================================================================

-- Danh sách bản chụp, KHÔNG kèm dữ liệu (dữ liệu nặng, chỉ tải khi cần).
create or replace function public.danh_sach_ban_chup()
returns table (
  id          bigint,
  thoi_diem   timestamptz,
  ly_do       text,
  ten_nguoi   text,
  vai_tro     text,
  so_dong     integer,
  co_bao_nhieu_kb integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi xem duoc ban chup khan.';
  end if;

  return query
  select
    b.id, b.thoi_diem, b.ly_do, b.ten_nguoi,
    coalesce(u.vai_tro, '')::text,
    b.so_dong,
    (pg_column_size(b.du_lieu) / 1024)::integer
  from public.ban_chup_khan b
  left join public.nguoi_dung u on u.id = b.nguoi_gay_ra
  order by b.thoi_diem desc;
end $$;

revoke all on function public.danh_sach_ban_chup() from public, anon;
grant execute on function public.danh_sach_ban_chup() to authenticated;


-- Lấy nguyên một bản chụp để tải về máy.
create or replace function public.lay_ban_chup(ma bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  kq jsonb;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi tai duoc ban chup khan.';
  end if;

  select jsonb_build_object(
    'phan_mem', 'MAY DO QUAN LY PRO',
    'phien_ban_sao_luu', 1,
    'ngay_tao', b.thoi_diem,
    'ly_do_chup', b.ly_do,
    'nguoi_gay_ra', b.ten_nguoi,
    'du_lieu', b.du_lieu
  ) into kq
  from public.ban_chup_khan b
  where b.id = ma;

  if kq is null then
    raise exception 'Khong tim thay ban chup so %.', ma;
  end if;
  return kq;
end $$;

revoke all on function public.lay_ban_chup(bigint) from public, anon;
grant execute on function public.lay_ban_chup(bigint) to authenticated;


-- =====================================================================
--  XONG.
--
--  Đọc kết quả:
--     co_bang       true
--     co_cai_co     true
--     nguoi_la_doc_duoc  0
--     so_ban_dang_co     thường là 0 lúc mới chạy
-- =====================================================================
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'ban_chup_khan') = 1 as co_bang,
  (select count(*) from pg_trigger
    where tgname = 'tr_chup_ban_luu' and not tgisinternal) = 1 as co_cai_co,
  (select count(*) from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'ban_chup_khan'
      and grantee in ('authenticated', 'anon', 'PUBLIC')) as nguoi_la_doc_duoc,
  (select count(*) from public.ban_chup_khan) as so_ban_dang_co;
