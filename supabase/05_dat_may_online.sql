-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — GIAI ĐOẠN 3: TRANG KHÁCH ĐẶT MAY ONLINE
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor" ở menu bên trái
--    3. Bấm "New query", dán TOÀN BỘ file này vào
--    4. Bấm "Run" (hoặc Ctrl + Enter)
--
--  Chạy sau các file 01 → 04. Chạy lại nhiều lần không hỏng dữ liệu.
--
--  File này mở đúng MỘT cánh cửa cho khách vãng lai (chưa đăng nhập):
--  được GỬI phiếu đặt may, và chỉ vậy. Không đọc được bất cứ dữ liệu nào
--  của tiệm, kể cả phiếu của khách khác.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. BẢNG PHIẾU ĐẶT MAY ONLINE
-- =====================================================================

create sequence if not exists public.seq_ma_phieu start 1;

create table if not exists public.don_online (
  id               uuid primary key default gen_random_uuid(),
  ma_phieu         text unique not null
                   default 'DM' || to_char(now(), 'YYMMDD') || '-' ||
                           lpad(nextval('public.seq_ma_phieu')::text, 4, '0'),

  -- Khách tự khai
  ho_ten           text not null check (length(trim(ho_ten)) between 1 and 120),
  so_dien_thoai    text not null check (length(trim(so_dien_thoai)) between 8 and 20),
  loai_trang_phuc  text not null default 'khac'
                   check (loai_trang_phuc in ('ao_so_mi','quan_tay','vest','vay','ao_dai','khac')),
  mo_ta_trang_phuc text not null default '' check (length(mo_ta_trang_phuc) <= 150),
  so_luong         integer not null default 1 check (so_luong between 1 and 500),
  ngay_can_lay     date,
  nhan_hang        text not null default 'tai_tiem'
                   check (nhan_hang in ('tai_tiem','giao_tan_noi')),
  dia_chi          text not null default '' check (length(dia_chi) <= 300),
  -- Số đo khách tự khai, cùng dạng với ho_so_so_do.so_do: {"vong_nguc": "92"}
  so_do            jsonb not null default '{}'::jsonb,
  ghi_chu          text not null default '' check (length(ghi_chu) <= 1000),

  -- Phần của tiệm
  trang_thai       text not null default 'moi'
                   check (trang_thai in ('moi','da_lien_he','da_tao_don','huy')),
  ghi_chu_tiem     text not null default '' check (length(ghi_chu_tiem) <= 1000),
  khach_hang_id    uuid references public.khach_hang(id) on delete set null,
  don_hang_id      uuid references public.don_hang(id) on delete set null,

  ngay_gui         timestamptz not null default now(),
  ngay_cap_nhat    timestamptz not null default now()
);

comment on table public.don_online is
  'Phiếu khách tự đặt may trên trang web công khai. Khách vãng lai chỉ được thêm, không được đọc.';

create index if not exists idx_don_online_trang_thai
  on public.don_online (trang_thai, ngay_gui desc);
create index if not exists idx_don_online_sdt
  on public.don_online (so_dien_thoai);

drop trigger if exists tg_don_online_ngay_sua on public.don_online;
create trigger tg_don_online_ngay_sua
  before update on public.don_online
  for each row execute function public.cap_nhat_ngay_sua();


-- =====================================================================
--  PHẦN 2. QUYỀN TRUY CẬP
-- =====================================================================

alter table public.don_online enable row level security;

-- Khách vãng lai gửi phiếu: chỉ được THÊM, và chỉ được thêm phiếu "mới",
-- không được tự gán khách hàng / đơn hàng / ghi chú của tiệm.
drop policy if exists p_online_khach_gui on public.don_online;
create policy p_online_khach_gui on public.don_online
  for insert to anon, authenticated
  with check (
    trang_thai = 'moi'
    and khach_hang_id is null
    and don_hang_id is null
    and ghi_chu_tiem = ''
  );

-- Người của tiệm xem và xử lý
drop policy if exists p_online_xem on public.don_online;
create policy p_online_xem on public.don_online
  for select to authenticated using (public.da_dang_nhap());

drop policy if exists p_online_sua on public.don_online;
create policy p_online_sua on public.don_online
  for update to authenticated
  using (public.da_dang_nhap()) with check (public.da_dang_nhap());

drop policy if exists p_online_xoa on public.don_online;
create policy p_online_xoa on public.don_online
  for delete to authenticated using (public.la_quan_tri());

-- Quyền ở tầng bảng (RLS phía trên mới là thứ quyết định ai làm được gì)
grant insert on public.don_online to anon, authenticated;
grant select, update, delete on public.don_online to authenticated;
grant usage on sequence public.seq_ma_phieu to anon, authenticated;


-- =====================================================================
--  PHẦN 3. THÔNG TIN TIỆM HIỆN RA TRANG CÔNG KHAI
-- ---------------------------------------------------------------------
--  Trang web cần biết tên tiệm, số điện thoại, địa chỉ, giờ mở cửa và
--  bảng giá. Thay vì mở cả bảng cai_dat cho người lạ, ta mở một khung
--  nhìn chỉ gồm đúng những khóa được phép công khai.
-- =====================================================================

insert into public.cai_dat (khoa, gia_tri) values
  ('gio_mo_cua',  'Thứ 2 – Thứ 7: 8h00 – 19h00' || chr(10) || 'Chủ nhật: 8h00 – 12h00'),
  ('ghi_chu_gia', 'Giá trên là công may, chưa gồm tiền vải. Tiệm báo giá chính xác sau khi xem mẫu và chọn vải.'),
  ('gioi_thieu',  'Áo dài, vest, sơ mi, quần âu, váy đầm và đồng phục — cắt theo số đo riêng, thử mẫu trước khi hoàn thiện.'),
  ('bang_gia',    '[]')
on conflict (khoa) do nothing;

create or replace view public.v_thong_tin_tiem as
  select khoa, gia_tri
    from public.cai_dat
   where khoa in ('ten_tiem', 'khau_hieu', 'dia_chi', 'dien_thoai',
                  'gio_mo_cua', 'bang_gia', 'ghi_chu_gia', 'gioi_thieu');

comment on view public.v_thong_tin_tiem is
  'Chỉ những thông tin tiệm muốn cho cả người chưa đăng nhập xem. Trang đặt may online đọc khung nhìn này.';

grant select on public.v_thong_tin_tiem to anon, authenticated;


-- =====================================================================
--  XONG. Kiểm tra nhanh:
--    select count(*) from public.don_online;        -- phải chạy được
--    select * from public.v_thong_tin_tiem;         -- phải ra vài dòng
-- =====================================================================
