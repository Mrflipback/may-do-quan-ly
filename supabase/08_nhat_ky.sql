-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 08
--  NHẬT KÝ HOẠT ĐỘNG — AI ĐÃ LÀM GÌ, LÚC NÀO, SỐ TIỀN BAO NHIÊU
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 01 → 07. Chạy lại nhiều lần cũng không hỏng dữ liệu.
--
--  Ý TƯỞNG:
--  Nhật ký được ghi ở TẦNG CƠ SỞ DỮ LIỆU, không phải trong phần mềm
--  chạy trên trình duyệt. Nghĩa là mọi đường đi tới dữ liệu đều bị ghi
--  lại — kể cả khi ai đó dùng công cụ lập trình của trình duyệt, hay
--  sửa thẳng trên trang Supabase. Không có cửa sau.
--
--  KHÔNG AI SỬA HAY XOÁ ĐƯỢC TỪNG DÒNG NHẬT KÝ, kể cả Quản trị viên.
--  Chỉ có một cách duy nhất là dọn nhật ký CŨ theo ngày (hàm ở cuối
--  file), và chính việc dọn đó cũng bị ghi lại một dòng.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. BẢNG NHẬT KÝ
-- =====================================================================

create table if not exists public.nhat_ky (
  id          bigint generated always as identity primary key,
  thoi_diem   timestamptz not null default now(),

  -- Ghi lại luôn TÊN và VAI TRÒ lúc đó, không chỉ lưu mã người dùng.
  -- Vì sau này người đó bị xoá khỏi tiệm thì vẫn phải biết ai đã làm.
  nguoi_id    uuid,
  ten_nguoi   text not null default 'Không rõ',
  vai_tro     text not null default '',

  bang        text not null,
  hanh_dong   text not null check (hanh_dong in ('them', 'sua', 'xoa')),
  ban_ghi_id  text,

  -- Chữ để người đọc nhận ra ngay: mã đơn, tên khách, tên vật tư…
  nhan        text not null default '',
  mo_ta       text not null default '',

  -- Số tiền liên quan. Để phần mềm tô màu và cộng tổng cho dễ soi.
  tien_truoc  numeric(14,2),
  tien_sau    numeric(14,2),

  -- Chi tiết từng cột đã đổi: {"so_tien": {"truoc": 500000, "sau": 300000}}
  thay_doi    jsonb not null default '{}'::jsonb
);

comment on table public.nhat_ky is
  'Nhật ký hoạt động. Chỉ ghi thêm, không sửa, không xoá từng dòng.';

create index if not exists idx_nhat_ky_thoi_diem on public.nhat_ky (thoi_diem desc);
create index if not exists idx_nhat_ky_nguoi on public.nhat_ky (nguoi_id, thoi_diem desc);
create index if not exists idx_nhat_ky_bang on public.nhat_ky (bang, thoi_diem desc);
create index if not exists idx_nhat_ky_tien on public.nhat_ky (thoi_diem desc)
  where tien_sau is not null or tien_truoc is not null;


-- =====================================================================
--  PHẦN 2. HÀM GHI NHẬT KÝ
-- =====================================================================
--  Một hàm dùng chung cho mọi bảng. Tuỳ bảng mà lấy ra cái nhãn dễ đọc
--  và con số tiền tương ứng.

create or replace function public.ghi_nhat_ky()
returns trigger
language plpgsql
security definer
set search_path = public
as $ham$
declare
  v_ten      text;
  v_vai      text;
  v_cu       jsonb;
  v_moi      jsonb;
  v_doi      jsonb := '{}'::jsonb;
  v_nhan     text := '';
  v_mo_ta    text := '';
  v_t_truoc  numeric(14,2);
  v_t_sau    numeric(14,2);
  v_id       text;
  v_dong     record;
begin
  -- Ai đang làm việc này
  select ho_ten, vai_tro into v_ten, v_vai
    from public.nguoi_dung where id = auth.uid();

  if v_ten is null then
    if auth.uid() is null then
      v_ten := 'Khách đặt online';
      v_vai := 'khach';
    else
      v_ten := 'Tài khoản đã bị xoá';
      v_vai := '';
    end if;
  end if;

  v_cu  := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_moi := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_dong := case when tg_op = 'DELETE' then old else new end;

  -- Khoá chính: cai_dat dùng cột "khoa", còn lại dùng "id"
  if tg_table_name = 'cai_dat' then
    v_id := coalesce(v_moi, v_cu) ->> 'khoa';
  else
    v_id := coalesce(v_moi, v_cu) ->> 'id';
  end if;

  -- Những cột đã đổi (chỉ xét khi SỬA). Bỏ qua mấy cột máy tự đổi,
  -- nếu không nhật ký sẽ đầy rác không ai đọc.
  if tg_op = 'UPDATE' then
    select coalesce(
             jsonb_object_agg(a.key, jsonb_build_object('truoc', a.value, 'sau', b.value)),
             '{}'::jsonb)
      into v_doi
      from jsonb_each(v_cu) a
      join jsonb_each(v_moi) b on b.key = a.key
     where a.value is distinct from b.value
       and a.key not in ('ngay_cap_nhat', 'tim_kiem', 'thanh_tien');

    -- Không có gì đáng kể thay đổi thì thôi, không ghi
    if v_doi = '{}'::jsonb then
      return null;
    end if;
  elsif tg_op = 'INSERT' then
    v_doi := v_moi;
  else
    v_doi := v_cu;
  end if;

  -- Nhãn dễ đọc và số tiền, tuỳ từng bảng
  case tg_table_name

    when 'thanh_toan' then
      select 'Đơn ' || d.ma_don into v_nhan
        from public.don_hang d
       where d.id = (coalesce(v_moi, v_cu) ->> 'don_hang_id')::uuid;
      v_t_truoc := (v_cu  ->> 'so_tien')::numeric;
      v_t_sau   := (v_moi ->> 'so_tien')::numeric;
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Ghi nhận một khoản khách trả'
                   when 'UPDATE' then 'Sửa lại khoản khách trả'
                   else 'XOÁ một khoản khách đã trả'
                 end;

    when 'don_hang' then
      v_nhan := 'Đơn ' || coalesce(v_moi ->> 'ma_don', v_cu ->> 'ma_don', '');
      v_t_truoc := (v_cu  ->> 'giam_gia')::numeric;
      v_t_sau   := (v_moi ->> 'giam_gia')::numeric;
      -- Chỉ coi là chuyện tiền khi giảm giá thật sự đổi
      if tg_op = 'UPDATE' and not (v_doi ? 'giam_gia') then
        v_t_truoc := null;
        v_t_sau := null;
      end if;
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Tạo đơn hàng mới'
                   when 'UPDATE' then
                     case when v_doi ? 'trang_thai'
                          then 'Đổi trạng thái đơn hàng'
                          when v_doi ? 'giam_gia'
                          then 'Đổi mức giảm giá của đơn'
                          else 'Sửa thông tin đơn hàng' end
                   else 'XOÁ đơn hàng'
                 end;

    when 'dong_san_pham' then
      select coalesce(v_moi ->> 'ten_san_pham', v_cu ->> 'ten_san_pham', '')
             || ' — đơn ' || d.ma_don
        into v_nhan
        from public.don_hang d
       where d.id = (coalesce(v_moi, v_cu) ->> 'don_hang_id')::uuid;
      v_t_truoc := (v_cu  ->> 'so_luong')::numeric * (v_cu  ->> 'don_gia')::numeric;
      v_t_sau   := (v_moi ->> 'so_luong')::numeric * (v_moi ->> 'don_gia')::numeric;
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Thêm món vào đơn hàng'
                   when 'UPDATE' then
                     case when v_doi ? 'so_luong' and v_doi ? 'don_gia'
                          then 'Đổi số lượng và đơn giá'
                          when v_doi ? 'so_luong' then 'Đổi SỐ LƯỢNG'
                          when v_doi ? 'don_gia'  then 'Đổi ĐƠN GIÁ'
                          else 'Sửa món trong đơn' end
                   else 'XOÁ món khỏi đơn hàng'
                 end;

    when 'giao_dich_kho' then
      select v.ten_vat_tu into v_nhan
        from public.vat_tu v
       where v.id = (coalesce(v_moi, v_cu) ->> 'vat_tu_id')::uuid;
      v_t_truoc := (v_cu  ->> 'so_luong')::numeric * coalesce((v_cu  ->> 'don_gia')::numeric, 0);
      v_t_sau   := (v_moi ->> 'so_luong')::numeric * coalesce((v_moi ->> 'don_gia')::numeric, 0);
      v_mo_ta := case tg_op
                   when 'INSERT' then
                     case when v_moi ->> 'loai' = 'nhap' then 'Nhập kho' else 'Xuất kho' end
                   when 'UPDATE' then 'Sửa phiếu kho'
                   else 'XOÁ phiếu kho'
                 end;

    when 'vat_tu' then
      v_nhan := coalesce(v_moi ->> 'ten_vat_tu', v_cu ->> 'ten_vat_tu', '');
      v_t_truoc := (v_cu  ->> 'gia_nhap')::numeric;
      v_t_sau   := (v_moi ->> 'gia_nhap')::numeric;
      if tg_op = 'UPDATE' and not (v_doi ? 'gia_nhap') then
        v_t_truoc := null;
        v_t_sau := null;
      end if;
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Thêm vật tư vào kho'
                   when 'UPDATE' then
                     case when v_doi ? 'gia_nhap' then 'Đổi GIÁ NHẬP vật tư'
                          else 'Sửa thông tin vật tư' end
                   else 'XOÁ vật tư khỏi kho'
                 end;

    when 'khach_hang' then
      v_nhan := coalesce(v_moi ->> 'ho_ten', v_cu ->> 'ho_ten', '');
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Thêm khách hàng mới'
                   when 'UPDATE' then 'Sửa hồ sơ khách hàng'
                   else 'XOÁ khách hàng'
                 end;

    when 'nguoi_dung' then
      v_nhan := coalesce(v_moi ->> 'ho_ten', v_cu ->> 'ho_ten', '');
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Tài khoản mới vào tiệm'
                   when 'UPDATE' then
                     case when v_doi ? 'vai_tro' then 'ĐỔI QUYỀN tài khoản'
                          else 'Sửa hồ sơ tài khoản' end
                   else 'XOÁ tài khoản khỏi tiệm'
                 end;

    when 'cai_dat' then
      v_nhan := coalesce(v_moi ->> 'khoa', v_cu ->> 'khoa', '');
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Thêm một mục cài đặt'
                   when 'UPDATE' then 'Đổi cài đặt tiệm'
                   else 'Xoá một mục cài đặt'
                 end;

    when 'don_online' then
      v_nhan := 'Phiếu ' || coalesce(v_moi ->> 'ma_phieu', v_cu ->> 'ma_phieu', '');
      v_mo_ta := case tg_op
                   when 'INSERT' then 'Khách gửi phiếu đặt may online'
                   when 'UPDATE' then 'Xử lý phiếu đặt online'
                   else 'XOÁ phiếu đặt online'
                 end;

    else
      v_nhan := '';
      v_mo_ta := tg_op;
  end case;

  insert into public.nhat_ky
    (nguoi_id, ten_nguoi, vai_tro, bang, hanh_dong, ban_ghi_id,
     nhan, mo_ta, tien_truoc, tien_sau, thay_doi)
  values
    (auth.uid(), v_ten, coalesce(v_vai, ''), tg_table_name,
     case tg_op when 'INSERT' then 'them' when 'UPDATE' then 'sua' else 'xoa' end,
     v_id, coalesce(v_nhan, ''), v_mo_ta, v_t_truoc, v_t_sau, v_doi);

  return null; -- trigger AFTER, giá trị trả về không dùng tới
end;
$ham$;


-- =====================================================================
--  PHẦN 3. GẮN NHẬT KÝ VÀO CÁC BẢNG
-- =====================================================================
--  Ưu tiên đúng ý: tiền, doanh thu, số lượng. Kèm theo cả việc đổi
--  quyền và xoá tài khoản, vì đó là chuyện cần soi nhất.

do $khoi$
declare
  ten_bang text;
begin
  foreach ten_bang in array array[
    'thanh_toan',     -- tiền khách trả
    'don_hang',       -- đơn, giảm giá, trạng thái
    'dong_san_pham',  -- số lượng và đơn giá từng món
    'giao_dich_kho',  -- nhập xuất kho
    'vat_tu',         -- giá nhập vật tư
    'khach_hang',
    'nguoi_dung',     -- đổi quyền, xoá tài khoản
    'cai_dat',
    'don_online'
  ]
  loop
    if to_regclass('public.' || ten_bang) is null then
      continue;
    end if;
    execute format('drop trigger if exists tg_nhat_ky on public.%I', ten_bang);
    execute format(
      'create trigger tg_nhat_ky after insert or update or delete on public.%I
         for each row execute function public.ghi_nhat_ky()', ten_bang);
  end loop;
end;
$khoi$;


-- =====================================================================
--  PHẦN 4. AI ĐƯỢC XEM, AI ĐƯỢC SỬA
-- =====================================================================
--  Xem   : Quản trị viên và Quản lý
--  Sửa   : KHÔNG AI CẢ
--  Xoá   : KHÔNG AI CẢ (chỉ dọn theo ngày bằng hàm ở Phần 5)
--
--  Hàm ghi nhật ký chạy ở chế độ security definer nên vẫn ghi được,
--  dù bảng này không cấp quyền thêm dòng cho bất kỳ ai.

alter table public.nhat_ky enable row level security;

drop policy if exists p_nk_xem on public.nhat_ky;
create policy p_nk_xem on public.nhat_ky
  for select to authenticated using (public.la_quan_ly());

revoke all on public.nhat_ky from anon, authenticated;
grant select on public.nhat_ky to authenticated;
revoke all on sequence public.nhat_ky_id_seq from anon, authenticated;


-- =====================================================================
--  PHẦN 5. DỌN NHẬT KÝ CŨ
-- =====================================================================
--  Nhật ký để lâu sẽ phình to. Hàm này xoá những dòng cũ hơn số ngày
--  bạn chọn — và ghi lại chính việc dọn đó, để không ai lặng lẽ xoá
--  dấu vết. Giữ tối thiểu 30 ngày.

create or replace function public.don_nhat_ky_cu(so_ngay integer)
returns integer
language plpgsql
security definer
set search_path = public
as $ham$
declare
  v_xoa integer;
  v_ten text;
begin
  if not public.la_quan_tri() then
    raise exception 'Chỉ Quản trị viên mới được dọn nhật ký.'
      using errcode = '42501';
  end if;

  if so_ngay is null or so_ngay < 30 then
    raise exception 'Phải giữ nhật ký ít nhất 30 ngày.'
      using errcode = '22023';
  end if;

  delete from public.nhat_ky
   where thoi_diem < now() - make_interval(days => so_ngay);
  get diagnostics v_xoa = row_count;

  select ho_ten into v_ten from public.nguoi_dung where id = auth.uid();

  insert into public.nhat_ky
    (nguoi_id, ten_nguoi, vai_tro, bang, hanh_dong, nhan, mo_ta, thay_doi)
  values
    (auth.uid(), coalesce(v_ten, 'Không rõ'), 'quan_tri', 'nhat_ky', 'xoa',
     'Dọn nhật ký cũ',
     'Dọn nhật ký cũ hơn ' || so_ngay || ' ngày',
     jsonb_build_object('so_dong_da_xoa', v_xoa, 'giu_lai_ngay', so_ngay));

  return v_xoa;
end;
$ham$;

revoke all on function public.don_nhat_ky_cu(integer) from public, anon;
grant execute on function public.don_nhat_ky_cu(integer) to authenticated;


-- =====================================================================
--  XONG.
--  Vào phần mềm, menu bên trái > Nhật ký hoạt động.
--  Nhật ký bắt đầu ghi TỪ LÚC BẠN CHẠY FILE NÀY, không có dữ liệu cũ.
-- =====================================================================
