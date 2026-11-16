-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 13
--  ĐÁNH DẤU IP LẠ TRONG NHẬT KÝ ĐĂNG NHẬP
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 10 và 12. Chạy lại nhiều lần cũng không hỏng gì.
--  File này KHÔNG đụng vào dữ liệu, chỉ viết lại một hàm chỉ-đọc.
-- ---------------------------------------------------------------------
--  LÀM GÌ
--
--  Thêm một cột `ip_la` vào nhật ký đăng nhập: lần vào này có phải là
--  LẦN ĐẦU TIÊN tài khoản đó xuất hiện từ địa chỉ mạng đó không.
--
--  VÌ SAO PHẢI TÍNH Ở MÁY CHỦ:
--  Phần mềm chỉ tải về vài trăm dòng gần nhất. Hỏi "IP này đã từng thấy
--  chưa" mà chỉ nhìn vài trăm dòng đó thì sai: một địa chỉ dùng suốt hai
--  năm nay vẫn bị báo là lạ, chỉ vì nó không nằm trong khoảng đang xem.
--  Câu hỏi này phải soi TOÀN BỘ lịch sử, nên phải làm ở đây.
--
--  MẤY DẤU HIỆU KHÁC (vào lúc nửa đêm, một người vào từ nhiều IP trong
--  một ngày) thì phần mềm tự tính lấy — chúng cần GIỜ ĐỊA PHƯƠNG của
--  tiệm, mà máy chủ Supabase chạy theo giờ quốc tế nên tính ở đây là
--  lệch múi giờ.
-- =====================================================================


-- Đổi kiểu trả về thì phải xoá hàm cũ trước. PostgreSQL không cho
-- "create or replace" khi danh sách cột trả về thay đổi.
drop function if exists public.nhat_ky_dang_nhap(date, date, uuid, text, integer);

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
  qua_quen_mk     boolean,
  ip_la           boolean
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
      nullif(btrim(coalesce(a.ip_address, '')), '') as ip
    from auth.audit_log_entries a
    where a.created_at >= tu_ngay::timestamptz
      and a.created_at <  (den_ngay + 1)::timestamptz
  ),
  -- LẦN ĐẦU TIÊN mỗi cặp (người, địa chỉ mạng) xuất hiện, tính trên
  -- TOÀN BỘ cuốn sổ chứ không riêng khoảng đang xem.
  --
  -- Gom một lượt như thế này thay vì hỏi đi hỏi lại cho từng dòng —
  -- cách kia cũng ra đúng kết quả nhưng quét lại cả bảng mấy trăm lần.
  lan_dau as (
    select
      nullif(e.payload ->> 'actor_id', '')::uuid as ai,
      nullif(btrim(coalesce(e.ip_address, '')), '') as ip,
      min(e.created_at) as luc_dau
    from auth.audit_log_entries e
    group by 1, 2
  ),
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
      ) as qua_quen,
      -- Lạ khi: đây là lần vào, CÓ bắt được địa chỉ mạng, và chính lần
      -- này là lần đầu cặp (người, địa chỉ) đó xuất hiện trong cả sổ.
      d.lsk = 'vao'
      and d.ip is not null
      and exists (
        select 1 from lan_dau l
         where l.ai is not distinct from d.ai
           and l.ip = d.ip
           and l.luc_dau = d.td
      ) as ip_moi_toanh
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
    coalesce(k.qua_quen, false),
    coalesce(k.ip_moi_toanh, false)
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
  'Đọc sổ đăng nhập sẵn có của Supabase, kèm cột ip_la. Chỉ đọc, chỉ Quản trị viên.';

-- Nhớ revoke TRƯỚC khi grant: hàm mới tạo thì mặc định ai cũng gọi được.
revoke all on function public.nhat_ky_dang_nhap(date, date, uuid, text, integer) from public, anon;
grant execute on function public.nhat_ky_dang_nhap(date, date, uuid, text, integer) to authenticated;


-- =====================================================================
--  XONG. Đoạn dưới không gọi hàm nào cần quyền.
--
--  Đọc kết quả — phải ra MỘT dòng, với:
--     co_cot_ip_la       true
--     nguoi_la_goi_duoc  0
--     tra_ve             một danh sách cột, trong đó có "ip_la boolean"
--
--  Không ra dòng nào nghĩa là hàm chưa được tạo — chạy lại cả file.
-- =====================================================================
select
  position('ip_la' in pg_get_function_result(p.oid)) > 0  as co_cot_ip_la,
  (select count(*)
     from pg_proc q join pg_namespace m on m.oid = q.pronamespace
    where m.nspname = 'public' and q.proname = 'nhat_ky_dang_nhap'
      and has_function_privilege('anon', q.oid, 'EXECUTE')
  ) as nguoi_la_goi_duoc,
  pg_get_function_result(p.oid) as tra_ve
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'nhat_ky_dang_nhap';
