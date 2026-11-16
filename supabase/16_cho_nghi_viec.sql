-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 16
--  CHO MỘT NGƯỜI NGHỈ VIỆC VÀ XOÁ HẲN TÀI KHOẢN
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 11 và 12. Chạy lại nhiều lần cũng không hỏng gì.
-- ---------------------------------------------------------------------
--  VẤN ĐỀ ĐANG SỬA
--
--  Trước đây xoá tài khoản chỉ xoá HỒ SƠ trong bảng nguoi_dung. Email
--  đăng nhập VẪN CÒN trong phần Authentication của Supabase. Người đó
--  vẫn đăng nhập được — chỉ là vào xong không thấy gì, vì không còn hồ
--  sơ. Muốn xoá hẳn thì chủ tiệm phải tự vào trang Supabase xoá tay.
--
--  Hàm ở đây xoá cả hai: hồ sơ lẫn email đăng nhập.
--
--  LÀM ĐƯỢC CẢ VỚI QUẢN TRỊ VIÊN. Chỉ còn đúng một chốt: không xoá được
--  Quản trị viên CUỐI CÙNG — cái cò tg_giu_lai_mot_quan_tri ở file 06
--  canh việc đó, và hàm này KHÔNG qua mặt được nó, vì cái cò chạy ở
--  tầng bảng.
-- =====================================================================

create or replace function public.cho_nghi_viec(nguoi uuid, mk_xoa text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  ma            text;
  ten           text;
  vai           text;
  xoa_dang_nhap boolean := false;
  dem           integer;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi cho nguoi khac nghi viec duoc.';
  end if;

  -- Sai mật khẩu KHÔNG được "raise exception": Postgres cuộn ngược mọi
  -- thứ khi có lỗi, kể cả câu lệnh vừa tăng số lần gõ sai.
  ma := public.kiem_khoa_xoa_noi_bo(mk_xoa);
  if ma <> '' then
    return public.loi_khoa_xoa_noi_bo(ma);
  end if;

  select ho_ten, vai_tro into ten, vai from public.nguoi_dung where id = nguoi;
  if ten is null then
    return jsonb_build_object('ok', false, 'ly_do', 'khong_thay',
      'loi', 'Không tìm thấy tài khoản này. Có thể ai đó vừa xoá rồi.');
  end if;

  -- Đánh dấu nghỉ việc TRƯỚC khi xoá.
  --
  -- Nhìn thì thừa, vì ngay sau đó dòng này biến mất. Nhưng cái cò ghi
  -- nhật ký ở file 08 sẽ ghi lại một dòng "đổi dang_hoat_dong" — nên
  -- trong sổ có đúng thứ tự: cho nghỉ việc, rồi mới xoá. Đọc lại sau
  -- này dễ hiểu hơn là chỉ thấy mỗi một dòng xoá trống không.
  update public.nguoi_dung set dang_hoat_dong = false where id = nguoi;

  -- Xoá luôn email đăng nhập trong Supabase.
  --
  -- Bọc trong lớp bắt lỗi vì bảng auth.users KHÔNG thuộc quyền mình:
  -- tuỳ dự án Supabase mà chủ cơ sở dữ liệu có được xoá hay không. Hỏng
  -- thì vẫn xoá hồ sơ như cũ và BÁO LẠI cho người dùng biết là email
  -- còn đó — chứ không lặng lẽ để họ tưởng đã xoá sạch.
  begin
    delete from auth.users where id = nguoi;
    get diagnostics dem = row_count;
    xoa_dang_nhap := dem > 0;
  exception when others then
    xoa_dang_nhap := false;
  end;

  -- Xoá auth.users thì hồ sơ tự đi theo (khoá ngoại on delete cascade).
  -- Không xoá được thì phải tự xoá hồ sơ ở đây.
  delete from public.nguoi_dung where id = nguoi;

  return jsonb_build_object(
    'ok', true,
    'ten', ten,
    'vai_tro', coalesce(vai, ''),
    'da_xoa_dang_nhap', xoa_dang_nhap
  );
end $$;

comment on function public.cho_nghi_viec(uuid, text) is
  'Cho một người nghỉ việc: xoá hồ sơ và xoá luôn email đăng nhập. Chỉ Quản trị viên, phải có mật khẩu xoá.';

revoke all on function public.cho_nghi_viec(uuid, text) from public, anon;
grant execute on function public.cho_nghi_viec(uuid, text) to authenticated;


-- =====================================================================
--  TẠM NGƯNG, KHÔNG XOÁ
-- ---------------------------------------------------------------------
--  Nhẹ hơn: giữ nguyên hồ sơ, chỉ tắt quyền vào phần mềm. Dùng khi
--  người ta nghỉ tạm, hoặc khi bạn chưa muốn xoá hẳn.
--
--  Quan trọng với phiếu khôi phục cài đặt (file 15): phiếu đó đếm theo
--  tài khoản ĐANG HOẠT ĐỘNG, nên tắt một người đi là phiếu không bị kẹt
--  vì chờ chữ ký của người đã nghỉ.
-- =====================================================================

create or replace function public.doi_dang_hoat_dong(nguoi uuid, bat boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  dem integer;
begin
  if not public.la_quan_tri() then
    raise exception 'Chi Quan tri vien moi tam ngung tai khoan duoc.';
  end if;

  -- Không tự tắt chính mình: tắt xong là mất quyền ngay, mà chính mình
  -- lại là người duy nhất bật lại được -> tự khoá mình ngoài cửa.
  if nguoi = auth.uid() and not bat then
    return jsonb_build_object('ok', false, 'ly_do', 'tu_tat',
      'loi', 'Không tự tạm ngưng tài khoản của chính mình được — tắt xong sẽ không ai bật lại.');
  end if;

  update public.nguoi_dung set dang_hoat_dong = bat where id = nguoi;
  get diagnostics dem = row_count;

  if dem = 0 then
    return jsonb_build_object('ok', false, 'ly_do', 'khong_thay',
      'loi', 'Không tìm thấy tài khoản này.');
  end if;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.doi_dang_hoat_dong(uuid, boolean) from public, anon;
grant execute on function public.doi_dang_hoat_dong(uuid, boolean) to authenticated;


-- =====================================================================
--  XONG.
--
--  Đọc kết quả:
--     so_ham_da_tao      phải bằng 2
--     nguoi_la_goi_duoc  phải bằng 0
--     con_cai_co_giu_quan_tri  phải bằng 1 — chốt chặn Quản trị viên
--                              cuối cùng vẫn còn nguyên
-- =====================================================================
select
  (select count(*)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('cho_nghi_viec', 'doi_dang_hoat_dong')) as so_ham_da_tao,
  (select count(*)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('cho_nghi_viec', 'doi_dang_hoat_dong')
      and has_function_privilege('anon', p.oid, 'EXECUTE')) as nguoi_la_goi_duoc,
  (select count(*) from pg_trigger
    where tgname = 'tg_giu_lai_mot_quan_tri' and not tgisinternal)
    as con_cai_co_giu_quan_tri;
