/**
 * E-WIT · ⓐ DANH MỤC · DinhDang.gs
 * Định dạng tiêu đề, tô màu cột, Data Validation cho các tab của ⓐ. Chạy lại nhiều lần không trùng lặp.
 * Quy ước màu: thiet-ke-du-lieu.md §7 (MAU trong Chung.gs).
 */

var SO_DONG_AP_DUNG = 1000;
var TAB_NHOM_LOP = '_dm_nhom_lop';
var NHOM_LOP_MAC_DINH = ['Grade', 'Kids', 'Mentor', 'Phát âm', 'Tiếng Nhật', 'Training', 'Đối tác Hoàng Minh'];
var CO_KHONG = ['Có', 'Không'];
var TAB_DINH_DANG = ['lop', 'ef', 'level', 'ef_level', 'vai_tro', 'bo_vai_tro', 'trang_thai_buoi', 'bi_danh', 'quyen'];

// Mô tả DV theo tab → cột. loai: LIST (danh sách cố định), RANGE (từ cột tab khác), NGAY, EMAIL, EMAIL_NHIEU, TAY, TU_DONG
var EMAIL_RE = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
var EMAIL_NHIEU_RE = '^[^\\s@,]+@[^\\s@,]+\\.[^\\s@,]+(\\s*,\\s*[^\\s@,]+@[^\\s@,]+\\.[^\\s@,]+)*$';

function cauHinhCot_() {
  return {
    lop: {
      trang_thai: { loai: 'LIST', ds: ['ACTIVE', 'PAUSED', 'COMPLETED'], ghiChu: 'Chọn: ACTIVE / PAUSED / COMPLETED. COMPLETED = khóa tab lớp (chỉ bộ phận nhập liệu sửa).' },
      bo_vai_tro: { loai: 'RANGE', tab: 'bo_vai_tro', ghiChu: 'Chọn từ cột bo_id của tab bo_vai_tro. Không thấy? Mở tab bo_vai_tro thêm bộ mới.' },
      nhom_lop: { loai: 'RANGE', tab: TAB_NHOM_LOP, ghiChu: 'Chọn từ tab ẩn _dm_nhom_lop. Muốn thêm nhóm mới: Xem ▸ Các trang tính bị ẩn ▸ _dm_nhom_lop, thêm 1 dòng, rồi chạy lại "Cài đặt định dạng".' },
      ngay_bat_dau: { loai: 'NGAY' }, ngay_ket_thuc: { loai: 'NGAY' },
      phu_trach_email: { loai: 'EMAIL_NHIEU' },
      tab_nhap: { loai: 'TU_DONG' }
    },
    ef: {
      dang_hoat_dong: { loai: 'LIST', ds: CO_KHONG, ghiChu: 'Chọn Có / Không. Người nghỉ: đặt Không, không xóa dòng.' },
      email: { loai: 'EMAIL' }, zoom_email: { loai: 'EMAIL' }
    },
    level: { dang_dung: { loai: 'LIST', ds: CO_KHONG, ghiChu: 'Chọn Có / Không.' } },
    ef_level: {
      ef_id: { loai: 'RANGE', tab: 'ef', ghiChu: 'Chọn từ cột ef_id của tab ef. Không thấy? Thêm người ở tab ef trước.' },
      level_id: { loai: 'RANGE', tab: 'level', ghiChu: 'Chọn từ cột level_id của tab level. Không thấy? Thêm level ở tab level trước.' },
      tu_ngay: { loai: 'NGAY' }, den_ngay: { loai: 'NGAY' }
    },
    vai_tro: {
      cho_phep_nhieu_nguoi: { loai: 'LIST', ds: CO_KHONG, ghiChu: 'Chọn Có / Không.' },
      dang_dung: { loai: 'LIST', ds: CO_KHONG, ghiChu: 'Chọn Có / Không.' },
      nguon: { loai: 'LIST', ds: ['NHAP_TAY', 'ZOOM_REPORT'], ghiChu: 'NHAP_TAY = nhập trong tab lớp; ZOOM_REPORT = lấy từ Zoom report (cột khóa).' }
    },
    bo_vai_tro: { role_id: { loai: 'RANGE', tab: 'vai_tro', ghiChu: 'Chọn từ cột role_id của tab vai_tro.' } },
    trang_thai_buoi: { ghi_nhan_nguoi: { loai: 'LIST', ds: CO_KHONG, ghiChu: 'Chọn Có / Không. Không = buổi đó không ghi nhận ai (OFF, Closing).' } },
    bi_danh: { ef_id: { loai: 'RANGE', tab: 'ef', ghiChu: 'Chọn từ cột ef_id của tab ef.' } },
    quyen: {
      vai_tro_he_thong: { loai: 'LIST', ds: ['QUAN_TRI', 'DANH_MUC', 'NHAP_LIEU', 'XEM'], ghiChu: 'Chọn: QUAN_TRI / DANH_MUC / NHAP_LIEU / XEM (xem bảng quyền trong thiết kế dữ liệu §1).' },
      dang_hieu_luc: { loai: 'LIST', ds: CO_KHONG, ghiChu: 'Chọn Có / Không. Không = bỏ qua dòng này khi áp dụng quyền.' },
      email: { loai: 'EMAIL' }
    }
  };
}

/** Tạo / làm mới tab ẩn _dm_nhom_lop: mặc định + giá trị đã có trong tab (người quản lý thêm tay) + giá trị đang dùng ở lop. */
function lamMoiNhomLop_(ss) {
  var sh = ss.getSheetByName(TAB_NHOM_LOP) || ss.insertSheet(TAB_NHOM_LOP);
  var dsCu = [];
  if (sh.getLastRow() > 1) dsCu = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); });
  var dsLop = [];
  var shLop = ss.getSheetByName('lop');
  if (shLop && shLop.getLastRow() > 1) {
    var head = shLop.getRange(1, 1, 1, shLop.getLastColumn()).getValues()[0].map(String);
    var c = head.indexOf('nhom_lop');
    if (c >= 0) dsLop = shLop.getRange(2, c + 1, shLop.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); });
  }
  var ds = duyNhat(NHOM_LOP_MAC_DINH.concat(dsCu, dsLop).filter(String));
  sh.clear();
  sh.getRange(1, 1).setValue('nhom_lop');
  sh.getRange(2, 1, ds.length, 1).setValues(ds.map(function (x) { return [x]; }));
  sh.getRange(1, 1).setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.hideSheet();
}

function taoQuyTac_(ss, cot, tenCotChu) {
  var dv = SpreadsheetApp.newDataValidation();
  var ghiChuHienThi = cot.ghiChu || '';
  switch (cot.loai) {
    case 'LIST': dv.requireValueInList(cot.ds, true).setAllowInvalid(false); break;
    case 'RANGE':
      var shNguon = ss.getSheetByName(cot.tab);
      if (!shNguon) throw new Error('Không thấy tab "' + cot.tab + '" để làm danh sách chọn.');
      dv.requireValueInRange(shNguon.getRange('A2:A'), true).setAllowInvalid(false); break;
    case 'NGAY': dv.requireDate().setAllowInvalid(false).setHelpText('Nhập ngày hợp lệ, ví dụ 31/10/2026.'); break;
    case 'EMAIL':
      dv.requireFormulaSatisfied('=OR(TRIM(' + tenCotChu + '2)="",REGEXMATCH(TRIM(' + tenCotChu + '2),"' + EMAIL_RE + '"))')
        .setAllowInvalid(false).setHelpText('Nhập một email hợp lệ.'); break;
    case 'EMAIL_NHIEU':
      dv.requireFormulaSatisfied('=OR(TRIM(' + tenCotChu + '2)="",REGEXMATCH(TRIM(' + tenCotChu + '2),"' + EMAIL_NHIEU_RE + '"))')
        .setAllowInvalid(false).setHelpText('Một hoặc nhiều email, cách nhau bằng dấu phẩy.'); break;
    default: return null;
  }
  if (ghiChuHienThi && cot.loai !== 'NGAY') dv.setHelpText(ghiChuHienThi);
  return dv.build();
}

/** Định dạng một tab; trả về số cột đã DV. */
function dinhDangTab_(ss, tenTab, cotCauHinh) {
  var sh = ss.getSheetByName(tenTab);
  if (!sh) throw new Error('Không thấy tab "' + tenTab + '".');
  var soCot = sh.getLastColumn();
  if (soCot < 1) return 0;
  var head = sh.getRange(1, 1, 1, soCot).getValues()[0].map(function (h) { return String(h).trim(); });
  if (sh.getMaxRows() < SO_DONG_AP_DUNG) sh.insertRowsAfter(sh.getMaxRows(), SO_DONG_AP_DUNG - sh.getMaxRows());
  var thanh = sh.getRange(2, 1, SO_DONG_AP_DUNG - 1, soCot);
  thanh.setBackground(null);
  var tieuDe = sh.getRange(1, 1, 1, soCot);
  tieuDe.setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
  sh.setFrozenRows(1);
  var n = 0;
  head.forEach(function (ten, i) {
    if (!ten) return;
    var col = i + 1, chu = chiSoCotThanhChu(col);
    var cot = cotCauHinh[ten] || { loai: 'TAY' };
    var vung = sh.getRange(2, col, SO_DONG_AP_DUNG - 1, 1);
    var mau = cot.loai === 'TU_DONG' ? MAU.TU_DONG : (cot.loai === 'LIST' || cot.loai === 'RANGE') ? MAU.CHON : MAU.NHAP_TAY;
    vung.setBackground(mau);
    if (cot.loai === 'TU_DONG') sh.getRange(1, col).setNote('Cột tự động: script ghi, không nhập tay.');
    else if (cot.ghiChu) sh.getRange(1, col).setNote('Danh sách chọn. ' + cot.ghiChu);
    // Ô chọn đã có sẵn ở dòng 2 (tạo tay, kiểu chip/mũi tên) → giữ nguyên kiểu đó, chỉ kéo dài cho cả cột.
    var dvCo = sh.getRange(2, col).getDataValidation();
    if (dvCo) { vung.setDataValidation(dvCo); n++; return; }
    vung.clearDataValidations();
    var quyTac = taoQuyTac_(ss, cot, chu);
    if (quyTac) { vung.setDataValidation(quyTac); n++; }
  });
  return n;
}

function themChuThichMau_(ss) {
  var sh = ss.getSheetByName('HUONG_DAN');
  if (!sh) return;
  var dong = [
    ['CHÚ THÍCH MÀU', ''],
    ['Xanh lá nhạt', 'Chọn từ danh sách (gõ giá trị ngoài danh sách sẽ bị từ chối).'],
    ['Kem', 'Nhập tay (ngày và email có kiểm tra định dạng).'],
    ['Tím xám nhạt', 'Tự động / khóa, không nhập tay.']
  ];
  var mau = [MAU.TIEU_DE_NEN, MAU.CHON, MAU.NHAP_TAY, MAU.TU_DONG];
  var last = Math.max(sh.getLastRow(), 1);
  var cotA = sh.getRange(1, 1, last, 1).getValues();
  var bd = -1;
  for (var i = 0; i < cotA.length; i++) if (String(cotA[i][0]).trim() === 'CHÚ THÍCH MÀU') { bd = i + 1; break; }
  if (bd < 0) bd = last + 2; // chừa 1 dòng trống, không đè nội dung có sẵn
  sh.getRange(bd, 1, dong.length, 2).setValues(dong);
  sh.getRange(bd, 1, 1, 2).setFontWeight('bold');
  sh.getRange(bd, 1).setBackground(mau[0]).setFontColor(MAU.TIEU_DE_CHU);
  for (var k = 1; k < 4; k++) sh.getRange(bd + k, 1).setBackground(mau[k]).setFontColor('#000000');
}

function caiDatDinhDang() {
  chayAnToan_('Cài đặt định dạng & danh sách chọn', function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    lamMoiNhomLop_(ss);
    var cfg = cauHinhCot_();
    var tong = 0;
    TAB_DINH_DANG.forEach(function (tab) { tong += dinhDangTab_(ss, tab, cfg[tab] || {}); });
    // cau_hinh: chỉ tiêu đề
    var shCh = ss.getSheetByName('cau_hinh');
    if (shCh && shCh.getLastColumn() > 0) {
      shCh.getRange(1, 1, 1, shCh.getLastColumn()).setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
      shCh.setFrozenRows(1);
    }
    themChuThichMau_(ss);
    ghiCauHinh(ss, 'SCRIPT_VERSION', SCRIPT_VERSION);
    thongBao_('Xong', 'Đã định dạng ' + TAB_DINH_DANG.length + ' tab, đặt ' + tong + ' cột có kiểm tra dữ liệu (áp dụng cho ' + SO_DONG_AP_DUNG + ' dòng).');
  });
}
