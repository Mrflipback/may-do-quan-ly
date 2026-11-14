-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 11
--  MẬT KHẨU XOÁ — CHUYỂN TỪ TRÌNH DUYỆT XUỐNG MÁY CHỦ
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 01 → 08. Chạy lại nhiều lần cũng không hỏng gì.
--
--  ⚠️  SAU KHI CHẠY FILE NÀY, MẬT KHẨU XOÁ CŨ KHÔNG CÒN GIÁ TRỊ.
--      Vào Cài đặt đặt lại một lần. Lý do ở mục "Vì sao phải đặt lại"
--      bên dưới.
-- ---------------------------------------------------------------------
--  VẤN ĐỀ ĐANG SỬA:
--
--  Trước đây mật khẩu xoá được kiểm NGAY TRONG TRÌNH DUYỆT. Nghĩa là nó
--  chỉ là cái gờ giảm tốc, không phải ổ khoá — ai biết mở công cụ lập
--  trình của trình duyệt (F12) là bảo được đoạn mã "coi như đúng rồi",
--  không cần biết mật khẩu.
--
--  File này chuyển việc kiểm xuống máy chủ. Từ giờ muốn xoá thì phải
--  GỬI KÈM mật khẩu, máy chủ tự kiểm rồi mới xoá. Trình duyệt không còn
--  quyền quyết định gì nữa, nên F12 không lách được.
--
--  VÌ SAO PHẢI ĐẶT LẠI MẬT KHẨU:
--  Mật khẩu cũ được băm bằng một cách tự viết trong JavaScript. Dấu vân
--  tay cũ không đổi sang kiểu băm của máy chủ (bcrypt) được — băm là
--  đường một chiều. Nên bắt buộc phải đặt lại một lần.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. CÔNG CỤ BĂM MẬT KHẨU
--  pgcrypto cho dùng bcrypt — kiểu băm chuyên để giữ mật khẩu, cố tình
--  chạy chậm để người đoán mò không đoán nổi.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Kiểm ngay xem gọi được thật không. Câu "create extension if not exists"
-- ở trên không làm gì nếu pgcrypto đã cài sẵn ở MỘT LƯỢC ĐỒ KHÁC —
-- lúc đó extensions.crypt không tồn tại, mà phải đến lúc đặt mật khẩu
-- mới vỡ ra. Thà hỏng ngay tại đây, có câu chữ rõ ràng.
do $kt$
begin
  perform extensions.crypt('thu', extensions.gen_salt('bf', 4));
exception
  when undefined_function or invalid_schema_name then
    raise exception
      'KHONG GOI DUOC extensions.crypt. pgcrypto chua nam trong luoc do "extensions" cua du an nay. Bao lai cho nguoi lam phan mem.';
end $kt$;


-- =====================================================================
--  PHẦN 2. CHỖ CẤT DẤU VÂN TAY
-- ---------------------------------------------------------------------
--  Bảng này KHÔNG AI ĐỌC ĐƯỢC, kể cả Quản trị viên.
--
--  Đó là điểm mấu chốt. Nếu để dấu vân tay ở chỗ trình duyệt đọc được
--  (như bảng cai_dat trước đây), thì người ta tải nó về rồi ngồi đoán
--  mò thoải mái trên máy mình, không ai biết. Cất ở đây thì mỗi lần
--  đoán đều phải hỏi máy chủ, mà máy chủ thì đếm.
-- =====================================================================

create table if not exists public.khoa_xoa (
  -- Cột này ép bảng chỉ có ĐÚNG MỘT dòng: khoá chính là true, và
  -- check chặn không cho ghi false. Nên không bao giờ có hai mật khẩu.
  mot_dong   boolean primary key default true check (mot_dong),

  bam        text not null,
  ngay_dat   timestamptz not null default now(),
  nguoi_dat  uuid,

  -- Đếm số lần gõ sai liên tiếp, để khoá tạm khi có người đoán mò.
  lan_sai    integer not null default 0,
  khoa_den   timestamptz
);

comment on table public.khoa_xoa is
  'Dấu vân tay của mật khẩu xoá. Không cấp quyền cho ai — chỉ các hàm đọc được.';

-- Bật RLS và KHÔNG tạo policy nào cả. Không có policy nghĩa là không ai
-- qua được. Các hàm bên dưới chạy ở chế độ security definer nên vẫn đọc
-- được, đó là cánh cửa duy nhất.
alter table public.khoa_xoa enable row level security;

-- File 01 có cấp quyền trên "mọi bảng trong public" cho tài khoản đã
-- đăng nhập. Câu đó chỉ cấp cho những bảng CÓ SẴN LÚC ĐÓ, nhưng thu hồi
-- lại cho chắc — mất công gõ thêm ba dòng còn hơn hở.
revoke all on table public.khoa_xoa from authenticated, anon, public;


-- =====================================================================
--  PHẦN 3. HÀM KIỂM NỘI BỘ
-- ---------------------------------------------------------------------
--  KHÔNG CẤP QUYỀN GỌI CHO AI. Chỉ các hàm ở phần 4 và 5 gọi được.
--  Cấp cho người dùng là tặng không một cái máy thử mật khẩu.
--
--  Trả về chuỗi rỗng nghĩa là đúng. Sai thì trả về mã lý do.
--
--  ⚠️  HÀM NÀY KHÔNG ĐƯỢC "raise exception" KHI SAI MẬT KHẨU.
--  Postgres cuộn ngược mọi thứ khi có lỗi — kể cả câu lệnh vừa tăng
--  số lần gõ sai. Báo lỗi là mất luôn cái đếm, người đoán mò gõ bao
--  nhiêu lần cũng không bị khoá. Nên ở đây TRẢ VỀ mã lý do, để giao
--  dịch được ghi nhận, rồi hàm gọi nó mới quyết định nói gì với người
--  dùng.
-- =====================================================================

create or replace function public.kiem_khoa_xoa_noi_bo(mk text)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  r public.khoa_xoa%rowtype;
  con_phut integer;
begin
  select * into r from public.khoa_xoa limit 1;

  if not found then
    return 'chua_dat';
  end if;

  -- Đang bị khoá tạm vì gõ sai nhiều lần
  if r.khoa_den is not null and r.khoa_den > now() then
    con_phut := greatest(1, ceil(extract(epoch from (r.khoa_den - now())) / 60)::integer);
    return 'bi_khoa:' || con_phut;
  end if;

  -- bcrypt: băm lại chữ vừa gõ bằng đúng cái muối nằm sẵn trong dấu vân
  -- tay cũ, rồi so. Không bao giờ giải ngược được mật khẩu từ dấu vân tay.
  if r.bam = extensions.crypt(coalesce(mk, ''), r.bam) then
    update public.khoa_xoa set lan_sai = 0, khoa_den = null where mot_dong;
    return '';
  end if;

  update public.khoa_xoa
     set lan_sai  = r.lan_sai + 1,
         khoa_den = case when r.lan_sai + 1 >= 5
                         then now() + interval '15 minutes'
                         else null end
   where mot_dong;

  if r.lan_sai + 1 >= 5 then
    return 'bi_khoa:15';
  end if;
  return 'sai:' || (5 - (r.lan_sai + 1));
end $$;

revoke all on function public.kiem_khoa_xoa_noi_bo(text) from public, anon, authenticated;


-- Đổi mã lý do thành câu tiếng Việt cho người đọc.
create or replace function public.loi_khoa_xoa_noi_bo(ma text)
returns jsonb
language sql
immutable
as $$
  select case
    when ma = 'chua_dat' then jsonb_build_object(
      'ok', false, 'ly_do', 'chua_dat',
      'loi', 'Chưa đặt mật khẩu xoá. Vào Cài đặt đặt một mật khẩu trước đã.')
    when ma like 'bi_khoa:%' then jsonb_build_object(
      'ok', false, 'ly_do', 'bi_khoa',
      'phut', split_part(ma, ':', 2)::integer,
      'loi', 'Đã gõ sai quá nhiều lần. Thử lại sau ' || split_part(ma, ':', 2) || ' phút.')
    else jsonb_build_object(
      'ok', false, 'ly_do', 'sai_mat_khau',
      'con_lai', split_part(ma, ':', 2)::integer,
      'loi', 'Mật khẩu xoá không đúng. Còn ' || split_part(ma, ':', 2) ||
             ' lần nữa thì bị khoá tạm 15 phút.')
  end;
$$;

revoke all on function public.loi_khoa_xoa_noi_bo(text) from public, anon, authenticated;


-- =====================================================================
--  PHẦN 4. ĐẶT, ĐỔI, GỠ MẬT KHẨU
-- =====================================================================

-- Đã đặt mật khẩu chưa. Chỉ trả lời có/không, không lộ gì thêm.
create or replace function public.co_mat_khau_xoa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.khoa_xoa);
$$;

grant execute on function public.co_mat_khau_xoa() to authenticated;


-- Đặt mật khẩu lần đầu, hoặc đổi mật khẩu đang có.
-- Đã có mật khẩu thì BẮT BUỘC gõ đúng mật khẩu cũ.
create or replace function public.dat_mat_khau_xoa(mk_moi text, mk_cu text default null)
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
    raise exception 'Chi Quan tri vien moi dat duoc mat khau xoa.';
  end if;

  if mk_moi is null or length(mk_moi) < 6 then
    return jsonb_build_object('ok', false, 'ly_do', 'qua_ngan',
      'loi', 'Mật khẩu xoá phải có ít nhất 6 ký tự.');
  end if;
  if length(mk_moi) > 72 then
    -- bcrypt chỉ đọc 72 byte đầu, dài hơn là phần thừa bị bỏ lặng lẽ.
    return jsonb_build_object('ok', false, 'ly_do', 'qua_dai',
      'loi', 'Mật khẩu xoá quá dài, tối đa 72 ký tự.');
  end if;
  if btrim(mk_moi) = '' then
    return jsonb_build_object('ok', false, 'ly_do', 'trong',
      'loi', 'Mật khẩu xoá không được toàn khoảng trắng.');
  end if;

  -- Đang có mật khẩu thì phải gõ đúng cái cũ mới cho đổi
  if exists (select 1 from public.khoa_xoa) then
    ma := public.kiem_khoa_xoa_noi_bo(mk_cu);
    if ma <> '' then
      return public.loi_khoa_xoa_noi_bo(ma);
    end if;
  end if;

  insert into public.khoa_xoa (mot_dong, bam, ngay_dat, nguoi_dat, lan_sai, khoa_den)
  values (true, extensions.crypt(mk_moi, extensions.gen_salt('bf', 10)),
          now(), auth.uid(), 0, null)
  on conflict (mot_dong) do update
    set bam = excluded.bam, ngay_dat = now(), nguoi_dat = auth.uid(),
        lan_sai = 0, khoa_den = null;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.dat_mat_khau_xoa(text, text) to authenticated;


-- Gỡ bỏ mật khẩu xoá. Phải gõ đúng mật khẩu đang dùng.
create or replace function public.go_mat_khau_xoa(mk_hien_tai text)
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
    raise exception 'Chi Quan tri vien moi go duoc mat khau xoa.';
  end if;

  ma := public.kiem_khoa_xoa_noi_bo(mk_hien_tai);
  if ma <> '' then
    return public.loi_khoa_xoa_noi_bo(ma);
  end if;

  delete from public.khoa_xoa;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.go_mat_khau_xoa(text) to authenticated;


-- =====================================================================
--  PHẦN 5. HAI VIỆC XOÁ PHẢI QUA MẬT KHẨU
-- ---------------------------------------------------------------------
--  Hai hàm này KHÔNG báo lỗi khi sai mật khẩu — xem lời giải thích ở
--  phần 3. Chúng trả về {"ok": false, ...} và phần mềm đọc cái đó.
-- =====================================================================

-- --- 5a. Xoá một tài khoản nhân sự ----------------------------------
create or replace function public.xoa_tai_khoan(nguoi uuid, mk_xoa text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  ma   text;
  dem  integer;
  ten  text;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi xoa duoc tai khoan.';
  end if;

  ma := public.kiem_khoa_xoa_noi_bo(mk_xoa);
  if ma <> '' then
    return public.loi_khoa_xoa_noi_bo(ma);
  end if;

  select ho_ten into ten from public.nguoi_dung where id = nguoi;

  -- Trigger giu_lai_mot_quan_tri (file 06) vẫn canh ở đây: không cho
  -- xoá người Quản trị viên cuối cùng. Hàm này KHÔNG qua mặt nó —
  -- trigger chạy ở tầng bảng nên security definer cũng phải chịu.
  delete from public.nguoi_dung where id = nguoi;
  get diagnostics dem = row_count;

  return jsonb_build_object('ok', true, 'so_dong', dem, 'ten', coalesce(ten, ''));
end $$;

grant execute on function public.xoa_tai_khoan(uuid, text) to authenticated;


-- --- 5-trước. Chỉ KIỂM mật khẩu, chưa xoá gì ----------------------
--
--  Vì sao cần: khi khôi phục kiểu "xoá sạch rồi nạp", phần mềm phải cất
--  một bản sao lưu của dữ liệu hiện tại xuống máy TRƯỚC khi xoá — đó là
--  đường lui duy nhất nếu nạp nhầm file. Nhưng cũng không nên tải một file
--  về máy khi người ta mới chỉ gõ sai mật khẩu. Nên tách ra: kiểm trước,
--  cất bản sao lưu, rồi mới xoá.
--
--  Hàm này DùNG CHUNG cái đếm số lần gõ sai với hai hàm xoá, nên nó
--  không mở thêm đường cho người đoán mò: năm lần sai là khoá tạm,
--  dù gõ ở đâu.
create or replace function public.kiem_mat_khau_xoa(mk text)
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
    raise exception 'Chi Quan tri vien moi dung duoc mat khau xoa.';
  end if;

  ma := public.kiem_khoa_xoa_noi_bo(mk);
  if ma <> '' then
    return public.loi_khoa_xoa_noi_bo(ma);
  end if;
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.kiem_mat_khau_xoa(text) to authenticated;


-- --- 5b. Xoá sạch dữ liệu nghiệp vụ (dùng khi khôi phục kiểu thay hết) ---
create or replace function public.xoa_sach_du_lieu(mk_xoa text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  ma    text;
  dem   jsonb := '{}'::jsonb;
  n     integer;
  bang  text;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi xoa sach duoc du lieu.';
  end if;

  ma := public.kiem_khoa_xoa_noi_bo(mk_xoa);
  if ma <> '' then
    return public.loi_khoa_xoa_noi_bo(ma);
  end if;

  -- Xoá con trước, cha sau — ngược với thứ tự nạp.
  --
  -- KHÔNG có nguoi_dung trong danh sách: xoá tài khoản là cả tiệm mất quyền
  -- vào phần mềm, kể cả chính người đang bấm nút.
  --
  -- CÓ cai_dat, vì khôi phục kiểu này là "quay về đúng nguyên trạng ngày
  -- sao lưu", mà cài đặt tiệm cũng là một phần của nguyên trạng đó.
  -- Mật khẩu xoá KHÔNG còn nằm trong cai_dat nữa (nó ở bảng khoa_xoa),
  -- nên xoá cai_dat không làm mất mật khẩu đang dùng.
  foreach bang in array array[
    'giao_dich_kho', 'thanh_toan', 'dong_san_pham',
    'don_hang', 'vat_tu', 'ho_so_so_do', 'khach_hang', 'cai_dat'
  ]
  loop
    -- Tên bảng lấy từ danh sách viết cứng ngay trên đây, không phải từ
    -- người dùng gửi lên — nên ghép chuỗi ở đây là an toàn.
    execute format('delete from public.%I', bang);
    get diagnostics n = row_count;
    dem := dem || jsonb_build_object(bang, n);
  end loop;

  return jsonb_build_object('ok', true, 'da_xoa', dem);
end $$;

grant execute on function public.xoa_sach_du_lieu(text) to authenticated;


-- =====================================================================
--  PHẦN 6. KHOÁ HẴN ĐƯỜNG XOÁ TÀI KHOẢN
-- ---------------------------------------------------------------------
--  ĐẶT HÀM Ở PHẦN 5 THÔI THÌ CHƯA ĐỦ.
--
--  Quy tắc RLS vẫn cho Quản trị viên xoá thẳng trong bảng nguoi_dung.
--  Nghĩa là người ngồi vào máy đang mở sẵn vẫn mở được cửa sổ lập trình
--  của trình duyệt và gõ một dòng để xoá, không cần biết mật khẩu — đúng
--  cái chuyện file này định chặn.
--
--  Nên thu hồi luôn quyền xoá trực tiếp. Từ giờ chỉ còn MỘT đường xoá
--  tài khoản: hàm xoa_tai_khoan() ở phần 5, mà hàm đó hỏi mật khẩu.
--
--  Hàm vẫn xoá được vì nó chạy ở chế độ security definer — mượn quyền
--  của chủ cơ sở dữ liệu, không phải quyền của người đang đăng nhập.
-- =====================================================================

revoke delete on table public.nguoi_dung from authenticated;


-- =====================================================================
--  PHẦN 7. DỌN MẬT KHẨU CŨ TRONG BẢNG cai_dat
--  Hai dòng này là dấu vân tay kiểu cũ, giờ vô dụng. Để lại chỉ tổ gây
--  hiểu nhầm là vẫn còn mật khẩu.
-- =====================================================================

delete from public.cai_dat where khoa in ('xoa_tk_muoi', 'xoa_tk_bam');


-- =====================================================================
--  XONG. Đoạn dưới không gọi hàm nào cần quyền, nên chạy được ngay
--  trong SQL Editor.
--
--  Đọc kết quả:
--     so_ham_da_tao    phải bằng 8
--     ai_doc_duoc_bam  phải bằng 0 — không ai đọc thẳng được dấu vân tay
--     da_dat_mat_khau  sẽ là false: đúng như vậy, bạn phải vào Cài đặt
--                      đặt lại mật khẩu xoá một lần.
--     con_xoa_thang_duoc phải bằng 0 — không còn đường xoá tài khoản nào
--                      khác ngoài hàm có hỏi mật khẩu.
-- =====================================================================
select
  (select count(*)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('kiem_khoa_xoa_noi_bo', 'loi_khoa_xoa_noi_bo',
                        'co_mat_khau_xoa', 'dat_mat_khau_xoa',
                        'go_mat_khau_xoa', 'xoa_tai_khoan',
                        'xoa_sach_du_lieu', 'kiem_mat_khau_xoa')
  ) as so_ham_da_tao,
  (select count(*)
     from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'khoa_xoa'
      and grantee in ('authenticated', 'anon', 'PUBLIC')
  ) as ai_doc_duoc_bam,
  (select exists (select 1 from public.khoa_xoa)) as da_dat_mat_khau,
  (select count(*)
     from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'nguoi_dung'
      and grantee = 'authenticated' and privilege_type = 'DELETE'
  ) as con_xoa_thang_duoc;
