# -*- coding: utf-8 -*-
"""
Nen anh goc thanh 2 co, dat ten de hieu, sinh file danh sach cho phan mem.

  public/anh/mau/<ten>.jpg       - 900px, xem to
  public/anh/mau/nho/<ten>.jpg   - 420px, o luoi

Anh goc giu nguyen trong PICTURES, khong dung toi.
"""
import io, os, json
from PIL import Image, ImageOps

DU_AN = u'C:/Users/vgco-hocviec-01/Desktop/May May 206/MayDoQuanLyPro'
GOC = os.path.join(DU_AN, u'PICTURES')
RA = os.path.join(DU_AN, u'public', u'anh', u'mau')
RA_NHO = os.path.join(RA, u'nho')

for d in (RA, RA_NHO):
    if not os.path.isdir(d):
        os.makedirs(d)

# ---------------------------------------------------------------------
#  Danh sach anh. Thu tu o day chinh la thu tu hien tren phan mem.
#  noiBat = True  -> hien luon o trang khach xem (trang chu)
# ---------------------------------------------------------------------
# (thu muc, so thu tu trong thu muc, ten file moi, ten hien thi, loai, mo ta, noiBat)
KE_HOACH = [
    # --- 7 tam chup studio: dep nhat, dung lam anh dai dien ---
    (u'Anh dai dien', 1, 'vest-3-manh-be', u'Vest 3 mảnh màu be', 'vest',
     u'Vest ba mảnh màu be sáng, ve xuôi, kèm khăn choàng len', True),
    (u'Anh dai dien', 2, 'vest-3-manh-nau-socola', u'Vest 3 mảnh nâu socola', 'vest',
     u'Vest ba mảnh nâu socola, hai khuy, gi-lê cùng màu', True),
    (u'Anh dai dien', 3, 'vest-3-manh-nau-dam', u'Vest 3 mảnh nâu đậm', 'vest',
     u'Vest ba mảnh nâu đậm, dáng ôm, kèm khăn choàng kẻ', True),
    (u'Anh dai dien', 4, 'vest-3-manh-kem', u'Vest 3 mảnh màu kem', 'vest',
     u'Vest ba mảnh màu kem, gi-lê năm khuy, khăn choàng xám', True),
    (u'Anh dai dien', 5, 'vest-3-manh-xanh-xam', u'Vest 3 mảnh xanh xám', 'vest',
     u'Vest ba mảnh xanh xám, ve xuôi bản vừa, gi-lê cùng màu', True),
    (u'Anh dai dien', 6, 'vest-3-manh-xam-tro', u'Vest 3 mảnh xám tro', 'vest',
     u'Vest ba mảnh xám tro, gi-lê, thắt cà vạt hoa văn', True),
    (u'Anh dai dien', 7, 'so-mi-may-do', u'Sơ mi may đo', 'ao_so_mi',
     u'Sơ mi may đo nhiều màu: xanh nhạt, kem, hồng phấn, tím chấm bi', True),

    # --- anh chup tai tiem: cung mot bo vest xanh xam, nhieu goc ---
    (u'catalog', 1, 'vest-xanh-xam-ca-vat', u'Vest xanh xám — thắt cà vạt', 'vest',
     u'Ảnh chụp tại tiệm: ve áo và cà vạt chấm bi', True),
    (u'catalog', 12, 'vest-xanh-xam-tron-bo-1', u'Vest xanh xám — trọn bộ', 'vest',
     u'Ảnh chụp tại tiệm: áo và quần đồng bộ trên ma-nơ-canh', True),
    (u'catalog', 14, 'vest-xanh-xam-tron-bo-2', u'Vest xanh xám — trọn bộ, ve xuôi', 'vest',
     u'Ảnh chụp tại tiệm: dáng áo một khuy, ve xuôi bản vừa', True),
    (u'catalog', 19, 'vest-xanh-xam-tron-bo-3', u'Vest xanh xám — trọn bộ, nhìn nghiêng', 'vest',
     u'Ảnh chụp tại tiệm: nhìn nghiêng thấy rõ đường bên', True),

    (u'catalog', 2, 'vest-xanh-xam-ve-ao-1', u'Vest xanh xám — cận ve áo 1', 'vest',
     u'Ảnh chụp tại tiệm: cận cảnh ve áo và túi ngực', False),
    (u'catalog', 3, 'vest-xanh-xam-ve-ao-2', u'Vest xanh xám — cận ve áo 2', 'vest',
     u'Ảnh chụp tại tiệm: cận cảnh cổ áo và khuy cài', False),
    (u'catalog', 4, 'vest-xanh-xam-ve-ao-3', u'Vest xanh xám — cận ve áo 3', 'vest',
     u'Ảnh chụp tại tiệm: ve áo nhìn chính diện', False),
    (u'catalog', 5, 'vest-xanh-xam-ve-ao-4', u'Vest xanh xám — cận ve áo 4', 'vest',
     u'Ảnh chụp tại tiệm: đường may ve áo', False),
    (u'catalog', 6, 'vest-xanh-xam-ve-ao-5', u'Vest xanh xám — cận ve áo 5', 'vest',
     u'Ảnh chụp tại tiệm: cổ áo sơ mi trắng bên trong', False),
    (u'catalog', 7, 'vest-xanh-xam-ve-ao-6', u'Vest xanh xám — cận ve áo 6', 'vest',
     u'Ảnh chụp tại tiệm: ve áo và túi hộp', False),
    (u'catalog', 8, 'vest-xanh-xam-ve-ao-7', u'Vest xanh xám — cận ve áo 7', 'vest',
     u'Ảnh chụp tại tiệm: nẹp áo và khuy cài giữa', False),
    (u'catalog', 9, 'vest-xanh-xam-tren-nguoi', u'Vest xanh xám — thử dáng', 'vest',
     u'Ảnh chụp tại tiệm: thợ chỉnh form áo trên ma-nơ-canh', False),
    (u'catalog', 10, 'vest-xanh-xam-ve-ao-8', u'Vest xanh xám — cận ve áo 8', 'vest',
     u'Ảnh chụp tại tiệm: ve áo nhìn gần', False),
    (u'catalog', 11, 'vest-xanh-xam-ve-ao-9', u'Vest xanh xám — cận ve áo 9', 'vest',
     u'Ảnh chụp tại tiệm: thân trước và khuy cài', False),
    (u'catalog', 13, 'vest-xanh-xam-tron-bo-4', u'Vest xanh xám — trọn bộ 4', 'vest',
     u'Ảnh chụp tại tiệm: áo và quần gấp trên giá', False),
    (u'catalog', 15, 'vest-xanh-xam-tron-bo-5', u'Vest xanh xám — trọn bộ 5', 'vest',
     u'Ảnh chụp tại tiệm: trọn bộ, nhìn hơi chếch', False),
    (u'catalog', 16, 'vest-xanh-xam-tron-bo-6', u'Vest xanh xám — trọn bộ 6', 'vest',
     u'Ảnh chụp tại tiệm: trọn bộ cùng áo vest xanh than bên cạnh', False),
    (u'catalog', 17, 'vest-xanh-xam-tron-bo-7', u'Vest xanh xám — trọn bộ 7', 'vest',
     u'Ảnh chụp tại tiệm: dáng áo và ống quần', False),
    (u'catalog', 18, 'vest-xanh-xam-tron-bo-8', u'Vest xanh xám — trọn bộ 8', 'vest',
     u'Ảnh chụp tại tiệm: thân áo và quần gấp phía trước', False),
    (u'catalog', 20, 'vest-xanh-xam-tron-bo-9', u'Vest xanh xám — trọn bộ 9', 'vest',
     u'Ảnh chụp tại tiệm: trọn bộ nhìn từ phía trái', False),
    (u'catalog', 21, 'vest-xanh-xam-tron-bo-10', u'Vest xanh xám — trọn bộ 10', 'vest',
     u'Ảnh chụp tại tiệm: trọn bộ, khung hình rộng', False),
]


def danh_sach(thu_muc):
    d = os.path.join(GOC, thu_muc)
    return sorted([os.path.join(d, f) for f in os.listdir(d)
                   if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])


KHO = {t: danh_sach(t) for t in (u'Anh dai dien', u'catalog')}

ket_qua = []
tong_truoc = 0
tong_sau = 0

for thu_muc, so, ten_file, ten_hien, loai, mo_ta, noi_bat in KE_HOACH:
    nguon = KHO[thu_muc][so - 1]
    tong_truoc += os.path.getsize(nguon)

    im = Image.open(nguon)
    im = ImageOps.exif_transpose(im).convert('RGB')

    to = im.copy()
    to.thumbnail((900, 900), Image.LANCZOS)
    d_to = os.path.join(RA, ten_file + '.jpg')
    to.save(d_to, 'JPEG', quality=82, optimize=True, progressive=True)

    nho = im.copy()
    nho.thumbnail((440, 440), Image.LANCZOS)
    d_nho = os.path.join(RA_NHO, ten_file + '.jpg')
    nho.save(d_nho, 'JPEG', quality=80, optimize=True, progressive=True)

    tong_sau += os.path.getsize(d_to) + os.path.getsize(d_nho)

    ket_qua.append({
        'ma': ten_file,
        'ten': ten_hien,
        'loai': loai,
        'moTa': mo_ta,
        'noiBat': noi_bat,
        'rong': to.width,
        'cao': to.height,
    })

print(u'Da xu ly %d anh' % len(ket_qua))
print(u'Dung luong goc : %.1f MB' % (tong_truoc / 1048576.0))
print(u'Sau khi nen    : %.1f MB (ca 2 co)' % (tong_sau / 1048576.0))
print(u'Noi bat (hien o trang khach): %d' % sum(1 for k in ket_qua if k['noiBat']))

io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ket-qua.json'),
        'w', encoding='utf-8').write(json.dumps(ket_qua, ensure_ascii=False, indent=1))
