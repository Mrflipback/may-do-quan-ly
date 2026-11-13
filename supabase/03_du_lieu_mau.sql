-- =====================================================================
--  DỮ LIỆU MẪU (KHÔNG BẮT BUỘC)
-- ---------------------------------------------------------------------
--  Chạy file này nếu bạn muốn có sẵn vài khách hàng, đơn hàng và vật tư
--  để thử cho nhanh. Bỏ qua cũng được, phần mềm vẫn chạy bình thường.
--
--  Muốn xóa sạch dữ liệu mẫu, chạy file 04_xoa_du_lieu_mau.sql
-- =====================================================================

-- --- Khách hàng -------------------------------------------------------
insert into public.khach_hang (ho_ten, so_dien_thoai, gioi_tinh, dia_chi, ghi_chu, tim_kiem)
values
  ('Nguyễn Minh Tuấn',   '0901234567', 'nam', '12 Lê Lợi, Quận 1, TP.HCM',
   'Thích vest ôm, vai vuông.',            'nguyen minh tuan 0901234567'),
  ('Trần Thị Hồng Ánh',  '0912888345', 'nu',  '88 Nguyễn Huệ, Quận 1, TP.HCM',
   'Khách quen, may áo dài mỗi dịp Tết.',  'tran thi hong anh 0912888345'),
  ('Lê Hoàng Phúc',      '0987654321', 'nam', '45 Trần Hưng Đạo, Quận 5, TP.HCM',
   null,                                    'le hoang phuc 0987654321'),
  ('Phạm Thu Hà',        '0933112998', 'nu',  '201 Cách Mạng Tháng 8, Quận 3, TP.HCM',
   null,                                    'pham thu ha 0933112998')
on conflict do nothing;


-- --- Hồ sơ số đo cho khách đầu tiên -----------------------------------
insert into public.ho_so_so_do (khach_hang_id, ten_ho_so, ngay_do, nguoi_do, so_do, ghi_chu)
select k.id, 'Đo may vest cưới', current_date - 15, 'Thợ Hải',
       '{"chieu_cao":172,"can_nang":68,"vong_co":38,"vong_nguc":94,"vong_eo":80,
         "rong_vai":45,"dai_ao":72,"dai_tay":60,"vong_bap_tay":32,"vong_cua_tay":26,
         "vong_mong":96,"dai_quan":102,"vong_dui":56,"vong_ong":38,"day_quan":26}'::jsonb,
       'Vai phải thấp hơn vai trái khoảng 1cm, cần độn nhẹ.'
from public.khach_hang k
where k.ho_ten = 'Nguyễn Minh Tuấn'
  and not exists (select 1 from public.ho_so_so_do s where s.khach_hang_id = k.id);


-- --- Vật tư -----------------------------------------------------------
insert into public.vat_tu (ma_vat_tu, ten_vat_tu, loai, don_vi_tinh, ton_toi_thieu, gia_nhap, nha_cung_cap, tim_kiem)
values
  ('V001', 'Vải len Ý xám đậm',       'vai',      'mét',   20, 780000, 'Vải Cao Cấp Sài Gòn', 'v001 vai len y xam dam'),
  ('V002', 'Vải cotton trắng',        'vai',      'mét',   30, 145000, 'Dệt May Phương Nam',  'v002 vai cotton trang'),
  ('P001', 'Nút áo vest ngọc trai',   'phu_lieu', 'cái',  100,  12000, null,                  'p001 nut ao vest ngoc trai'),
  ('P002', 'Chỉ may polyester đen',   'phu_lieu', 'cuộn',  15,  35000, null,                  'p002 chi may polyester den')
on conflict (ma_vat_tu) do nothing;

-- Nhập kho lần đầu
insert into public.giao_dich_kho (vat_tu_id, loai, so_luong, don_gia, ngay, ghi_chu)
select v.id, 'nhap', x.sl, v.gia_nhap, current_date - 30, 'Nhập kho đầu kỳ'
from public.vat_tu v
join (values ('V001', 12.5), ('V002', 86), ('P001', 240), ('P002', 6)) as x(ma, sl)
  on x.ma = v.ma_vat_tu
where not exists (select 1 from public.giao_dich_kho g where g.vat_tu_id = v.id);


-- --- Một đơn hàng hoàn chỉnh -----------------------------------------
do $$
declare
  v_khach uuid;
  v_don   uuid;
begin
  select id into v_khach from public.khach_hang where ho_ten = 'Nguyễn Minh Tuấn' limit 1;
  if v_khach is null then return; end if;

  -- Chỉ tạo nếu khách này chưa có đơn nào
  if exists (select 1 from public.don_hang where khach_hang_id = v_khach) then
    return;
  end if;

  insert into public.don_hang (khach_hang_id, ngay_nhan, ngay_hen_giao, trang_thai, giam_gia, ghi_chu)
  values (v_khach, current_date - 10, current_date + 4, 'dang_may', 400000,
          'Khách dặn may gấp trước ngày cưới.')
  returning id into v_don;

  insert into public.dong_san_pham (don_hang_id, ten_san_pham, loai, so_luong, don_gia, thu_tu)
  values
    (v_don, 'Vest 2 khuy xanh navy', 'vest',     1, 8500000, 0),
    (v_don, 'Quần tây xám',          'quan_tay', 2, 1200000, 1);

  insert into public.thanh_toan (don_hang_id, so_tien, hinh_thuc, la_tien_coc, ngay_thanh_toan, ghi_chu)
  values (v_don, 7000000, 'chuyen_khoan', true, current_date - 10, 'Đặt cọc');

  -- Xuất vải cho đơn này
  insert into public.giao_dich_kho (vat_tu_id, loai, so_luong, don_hang_id, ngay, ghi_chu)
  select v.id, 'xuat', 3.5, v_don, current_date - 9, 'Xuất vải may vest'
  from public.vat_tu v where v.ma_vat_tu = 'V001';
end;
$$;


-- =====================================================================
--  XONG. Mở phần mềm lên là thấy dữ liệu.
-- =====================================================================
