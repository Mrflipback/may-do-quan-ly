-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 10
--  NHẬT KÝ ĐĂNG NHẬP — AI VÀO PHẦN MỀM, LÚC NÀO, TỪ ĐÂU
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 01 → 08. Chạy lại nhiều lần cũng không hỏng gì.
--
--  Ý TƯỞNG:
--  File này KHÔNG tạo bảng mới và KHÔNG ghi thêm dữ liệu nào cả.
--
--  Supabase vốn đã tự ghi sẵn một cuốn sổ đăng nhập ở tầng máy chủ, nằm
--  trong bảng auth.audit_log_entries. Mỗi lần có người đăng nhập, xin
--  đặt lại mật khẩu, đổi mật khẩu hay đăng xuất, nó đều ghi lại kèm
--  THỜI ĐIỂM và ĐỊA CHỈ IP. Phần mềm chạy trên trình duyệt không thể
--  biết IP của chính nó, nên đây là nguồn duy nhất đáng tin.
--
--  Cuốn sổ đó nằm trong lược đồ "auth", mà lược đồ này Supabase không
--  cho phần mềm đọc thẳng. File này mở đúng MỘT cánh cửa hẹp: một hàm
--  chỉ-đọc, chỉ Quản trị viên gọi được, chỉ trả về những cột cần thiết.
--
--  NGHĨA LÀ: bạn sẽ thấy được cả những lần đăng nhập TỪ TRƯỚC TỚI GIỜ,
--  chứ không phải bắt đầu đếm từ hôm nay.
-- =====================================================================


-- =====================================================================
--  PHẦN 0. KIỂM TRA TRƯỚC
--  Nếu Supabase đổi cấu trúc cuốn sổ của họ, phải biết NGAY tại đây,
--  chứ không phải để phần mềm hiện ra một trang trống rồi đoán già
--  đoán non.
-- =====================================================================

do $$
declare
  co_bang boolean;
  co_ip   boolean;
begin
  select exists (
    select 1 from information_schema.tables
     where table_schema = 'auth' and table_name = 'audit_log_entries'
  ) into co_bang;

  if not co_bang then
    raise exception
      'KHONG THAY bang auth.audit_log_entries. Du an Supabase nay khong co so dang nhap, hoac ban chua du quyen doc luoc do auth. Bao lai cho nguoi lam phan mem.';
  end if;

  select exists (
    select 1 from information_schema.columns
     where table_schema = 'auth' and table_name = 'audit_log_entries'
       and column_name = 'ip_address'
  ) into co_ip;

  if not co_ip then
    raise warning
      'Bang auth.audit_log_entries CO, nhung KHONG co cot ip_address. Nhat ky van chay, chi la cot IP se trong.';
  end if;
end $$;


-- =====================================================================
--  PHẦN 1. HÀM ĐỌC NHẬT KÝ ĐĂNG NHẬP
-- ---------------------------------------------------------------------
--  Vì sao phải là "security definer":
--  Lược đồ auth bị khoá với tài khoản thường. Hàm chạy ở chế độ này
--  mượn quyền của chủ cơ sở dữ liệu để đọc — nên DÒNG ĐẦU TIÊN trong
--  thân hàm phải là chốt chặn quyền, không có chốt đó thì ai đăng nhập
--  cũng xem được giờ giấc và IP của người khác.
-- =====================================================================

create or replace function public.nhat_ky_dang_nhap(
  tu_ngay   date    default (current_date - 29),
  den_ngay  date    default current_date,
  nguoi     uuid    default null,
  loai      text    default 'tat_ca',
  gioi_han  integer default 300
)
returns table (
  thoi_diem       timestamptz,
  nguoi_id        uuid,
  ten_nguoi       text,
  vai_tro         text,
  email           text,
  dia_chi_ip      text,
  loai_su_kien    text,
  qua_quen_mk     boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  n integer := least(greatest(coalesce(gioi_han, 300), 1), 2000);
begin
  -- CHỐT CHẶN QUYỀN. Phải đứng trước mọi thứ khác.
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi xem duoc nhat ky dang nhap.';
  end if;

  return query
  with tho as (
    select
      a.created_at as td,
      nullif(a.payload ->> 'actor_id', '')::uuid as ai,
      a.payload ->> 'actor_username' as mail,
      a.payload ->> 'action' as viec,
      -- Cột ip_address là varchar không cho null, nhưng có bản để chuỗi
      -- rỗng khi không bắt được IP. Đổi hết về null cho đồng nhất.
      nullif(btrim(coalesce(a.ip_address, '')), '') as ip
    from auth.audit_log_entries a
    where a.created_at >= tu_ngay::timestamptz
      and a.created_at <  (den_ngay + 1)::timestamptz
  ),
  -- Đặt tên tiếng Việt cho từng loại việc. Bỏ hẳn 'token_refreshed'
  -- vì trình duyệt tự làm việc đó vài tiếng một lần, không phải người
  -- làm — để vào thì nhật ký ngập rác.
  dat_ten as (
    select
      td, ai, mail, ip,
      case viec
        when 'login'                   then 'vao'
        when 'user_recovery_requested' then 'xin_doi_mk'
        when 'user_updated_password'   then 'doi_mk_xong'
        when 'user_modified'           then 'doi_mk_xong'
        when 'logout'                  then 'ra'
        else 'khac'
      end as lsk
    from tho
    where viec is not null
      and viec not in ('token_refreshed', 'token_revoked')
  ),
  -- "Vào bằng đường quên mật khẩu" nhận ra thế nào:
  -- ngay trước lần vào này, CHÍNH người đó vừa xin đặt lại mật khẩu
  -- trong vòng một tiếng. Đây là suy đoán theo dấu vết, không phải
  -- Supabase ghi thẳng ra — nên phần mềm gọi nó là "có vẻ như", và
  -- dòng "xin đặt lại mật khẩu" vẫn hiện riêng để bạn tự đối chiếu.
  danh_dau as (
    select
      d.*,
      d.lsk = 'vao'
      and exists (
        select 1 from dat_ten x
         where x.lsk = 'xin_doi_mk'
           and x.ai is not distinct from d.ai
           and x.td <= d.td
           and x.td >  d.td - interval '1 hour'
      ) as qua_quen
    from dat_ten d
  )
  select
    k.td,
    k.ai,
    coalesce(u.ho_ten, split_part(coalesce(k.mail, ''), '@', 1), 'Không rõ')::text,
    coalesce(u.vai_tro, '')::text,
    coalesce(u.email, k.mail, '')::text,
    k.ip::text,
    k.lsk::text,
    coalesce(k.qua_quen, false)
  from danh_dau k
  left join public.nguoi_dung u on u.id = k.ai
  where (nguoi is null or k.ai = nguoi)
    and (
      loai = 'tat_ca'
      or (loai = 'chi_vao' and k.lsk = 'vao')
      or (loai = 'chi_mat_khau' and k.lsk in ('xin_doi_mk', 'doi_mk_xong'))
      or loai = k.lsk
    )
  order by k.td desc
  limit n;
end $$;

comment on function public.nhat_ky_dang_nhap(date, date, uuid, text, integer) is
  'Đọc sổ đăng nhập sẵn có của Supabase (auth.audit_log_entries). Chỉ đọc, chỉ Quản trị viên.';

revoke all on function public.nhat_ky_dang_nhap(date, date, uuid, text, integer) from public, anon;
grant execute on function public.nhat_ky_dang_nhap(date, date, uuid, text, integer) to authenticated;


-- =====================================================================
--  PHẦN 2. MẤY CON SỐ TỔNG
--  Để phần mềm hiện được "30 ngày qua: 42 lần vào, 3 người, 5 địa chỉ
--  IP" mà không phải tải hết mọi dòng về máy rồi tự đếm.
-- =====================================================================

create or replace function public.tong_ket_dang_nhap(
  tu_ngay  date default (current_date - 29),
  den_ngay date default current_date
)
returns table (
  so_lan_vao    bigint,
  so_nguoi      bigint,
  so_ip         bigint,
  so_lan_quen   bigint,
  lan_gan_nhat  timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi xem duoc nhat ky dang nhap.';
  end if;

  return query
  select
    count(*) filter (where d.loai_su_kien = 'vao'),
    count(distinct d.nguoi_id) filter (where d.loai_su_kien = 'vao'),
    count(distinct d.dia_chi_ip) filter (where d.loai_su_kien = 'vao' and d.dia_chi_ip is not null),
    count(*) filter (where d.loai_su_kien = 'vao' and d.qua_quen_mk),
    max(d.thoi_diem) filter (where d.loai_su_kien = 'vao')
  from public.nhat_ky_dang_nhap(tu_ngay, den_ngay, null, 'tat_ca', 2000) d;
end $$;

revoke all on function public.tong_ket_dang_nhap(date, date) from public, anon;
grant execute on function public.tong_ket_dang_nhap(date, date) to authenticated;


-- =====================================================================
--  XONG. Đoạn dưới KHÔNG gọi hai hàm vừa tạo — cố ý như vậy.
--
--  Vì sao: trong SQL Editor, bạn đang là CHỦ cơ sở dữ liệu, không
--  phải một tài khoản đang đăng nhập trong phần mềm. Nên auth.uid()
--  rỗng, và chốt chặn quyền trong hàm sẽ chặn bạn lại ngay. Chặn như
--  vậy LÀ ĐÚNG — đó chính là thứ giữ cho Nhân viên không xem được IP
--  và giờ giấc của người khác.
--
--  Cách xem thật là mở phần mềm, đăng nhập bằng tài khoản Quản trị
--  viên, vào **Nhật ký › thẻ Đăng nhập**.
--
--  Ở đây chỉ đếm xem mọi thứ đã vào đúng chỗ chưa.
--  Đọc kết quả:
--     so_ham_da_tao     phải bằng 2. Bằng 0 là file chưa chạy xong.
--     so_dong_trong_so  số dòng đang có trong sổ đăng nhập của Supabase.
--                       Bằng 0 thì phần mềm cũng sẽ trống — đăng xuất rồi
--                       đăng nhập lại một lần, sẽ có dòng đầu tiên.
-- =====================================================================
select
  (select count(*)
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('nhat_ky_dang_nhap', 'tong_ket_dang_nhap')
  ) as so_ham_da_tao,
  (select count(*) from auth.audit_log_entries)      as so_dong_trong_so,
  (select max(created_at) from auth.audit_log_entries) as lan_gan_nhat;
