-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 07
--  KHÔI PHỤC DỮ LIỆU TỪ FILE SAO LƯU
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 01 → 06. Chạy lại nhiều lần cũng không hỏng dữ liệu.
--
--  FILE NÀY LÀM 2 VIỆC:
--    A. Cho Quản trị viên nạp lại đơn đặt online từ bản sao lưu
--    B. Chỉnh lại "số đếm" sau khi khôi phục — việc BẮT BUỘC, nếu
--       không thì khách mới sẽ trùng mã với khách cũ
-- =====================================================================


-- =====================================================================
--  A. CHO PHÉP NẠP LẠI ĐƠN ĐẶT ONLINE
-- =====================================================================
--  File 05 chỉ mở đúng một cửa cho khách vãng lai: gửi phiếu mới, trạng
--  thái bắt buộc là 'moi'. Khi khôi phục thì phải nạp lại cả phiếu đã xử
--  lý, nên cần thêm một cửa riêng cho Quản trị viên.

do $khoi$
begin
  if to_regclass('public.don_online') is not null then
    drop policy if exists p_online_them_quan_tri on public.don_online;
    create policy p_online_them_quan_tri on public.don_online
      for insert to authenticated
      with check (public.la_quan_tri());
  end if;
end;
$khoi$;


-- =====================================================================
--  B. CHỈNH LẠI SỐ ĐẾM SAU KHI KHÔI PHỤC
-- =====================================================================
--  Mã khách KH00001, mã đơn DH00001, mã phiếu DM261114-0001 đều do một
--  "số đếm" trong cơ sở dữ liệu sinh ra. Khi nạp dữ liệu cũ vào, số đếm
--  vẫn đang ở 0 trong khi dữ liệu đã có tới KH00250 — khách tiếp theo sẽ
--  được cấp mã KH00001, trùng với khách cũ, và phần mềm báo lỗi trùng mã.
--
--  Hàm này dò mã lớn nhất đang có rồi kéo số đếm lên cho khớp.
--  Phần mềm tự gọi hàm này ngay sau khi khôi phục xong.

create or replace function public.dong_bo_so_dem()
returns jsonb
language plpgsql
security definer
set search_path = public
as $ham$
declare
  n_khach  bigint := 0;
  n_don    bigint := 0;
  n_phieu  bigint := 0;
begin
  if not public.la_quan_tri() then
    raise exception 'Chỉ Quản trị viên mới được chỉnh số đếm.'
      using errcode = '42501';
  end if;

  -- KH00250 -> 250
  select coalesce(max(nullif(regexp_replace(ma_khach, '[^0-9]', '', 'g'), '')::bigint), 0)
    into n_khach
    from public.khach_hang;
  perform setval('public.seq_ma_khach', greatest(n_khach, 1), n_khach > 0);

  -- DH00412 -> 412
  select coalesce(max(nullif(regexp_replace(ma_don, '[^0-9]', '', 'g'), '')::bigint), 0)
    into n_don
    from public.don_hang;
  perform setval('public.seq_ma_don', greatest(n_don, 1), n_don > 0);

  -- DM261114-0007 -> 7  (chỉ lấy phần sau dấu gạch)
  if to_regclass('public.don_online') is not null then
    select coalesce(max(nullif(regexp_replace(split_part(ma_phieu, '-', 2), '[^0-9]', '', 'g'), '')::bigint), 0)
      into n_phieu
      from public.don_online;
    perform setval('public.seq_ma_phieu', greatest(n_phieu, 1), n_phieu > 0);
  end if;

  return jsonb_build_object(
    'seq_ma_khach', n_khach,
    'seq_ma_don',   n_don,
    'seq_ma_phieu', n_phieu
  );
end;
$ham$;

revoke all on function public.dong_bo_so_dem() from public, anon;
grant execute on function public.dong_bo_so_dem() to authenticated;


-- =====================================================================
--  XONG.
--  Vào phần mềm > Cài đặt > thẻ "Khôi phục dữ liệu" để nạp file sao lưu.
-- =====================================================================
