/**
 * E-WIT · Lịch & Công v2 · TaoTab.gs (ⓑ NHẬP LIỆU)
 * Tạo tab lớp mới và làm mới định dạng theo hợp đồng DAC-TA-CHUNG §4.
 * Cần: Chung.gs, TaoTabLogic.gs, Menu.gs.
 */

var MAU_LOI = { TRUNG: '#F8D7DA', NGOAI: '#EA9999', SAI_THU: '#FFCC80', THIEU_TIC: '#FFF176', OFF: '#FADADD', HOM_NAY: '#FFFBEA' };

/** Đọc tab của ⓐ theo giá trị HIỂN THỊ (tránh lệch múi giờ của ô giờ). */
function docBangHienThi(ss, tenTab) {
  var sh = ss.getSheetByName(tenTab);
  if (!sh) throw new Error('Không thấy tab "' + tenTab + '" trong ⓐ');
  return bangThanhObject(sh.getDataRange().getDisplayValues());
}

/** 'yyyy-MM-dd' → Date địa phương (để ghi vào ô ngày) hoặc ''. */
function keyThanhDate(key) {
  if (!key) return '';
  var p = key.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

/** Menu: chọn lớp ACTIVE chưa có tab rồi tạo. */
function taoTabLopMoi() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var dm = moFileDanhMuc();
  var tenTab = ss.getSheets().map(function (s) { return s.getName(); });
  var ds = lopChuaCoTab(docBangHienThi(dm, 'lop'), tenTab);
  if (!ds.length) { ui.alert('Mọi lớp ACTIVE đã có tab. Nếu thiếu lớp, hãy thêm vào ⓐ DANH MỤC (tab lop) với trạng thái ACTIVE.'); return; }
  var goiY = ds.map(function (l) { return l.class_id + ' · ' + (l.ten_lop || ''); }).join('\n');
  var kq = ui.prompt('Tạo tab lớp mới', 'Gõ mã lớp (class_id) muốn tạo:\n\n' + goiY, ui.ButtonSet.OK_CANCEL);
  if (kq.getSelectedButton() !== ui.Button.OK) return;
  var id = kq.getResponseText().trim();
  var hopLe = ds.some(function (l) { return String(l.class_id).trim() === id; });
  if (!hopLe) { ui.alert('Mã lớp "' + id + '" không nằm trong danh sách trên.'); return; }
  taoTabLop(id);
  ui.alert('Đã tạo tab "' + id + '". Nhờ quản trị chạy "Áp dụng quyền" ở file ⓐ để khóa tab theo người phụ trách.');
}

/** Tạo tab lớp theo §4. Trả về sheet. */
function taoTabLop(classId) {
  var ss = SpreadsheetApp.getActive();
  var dm = moFileDanhMuc();
  if (ss.getSheetByName(classId)) throw new Error('Đã có tab "' + classId + '".');
  var lop = docBangHienThi(dm, 'lop').filter(function (l) { return String(l.class_id).trim() === classId; })[0];
  if (!lop) throw new Error('Không thấy lớp "' + classId + '" trong ⓐ.');
  if (!ss.getSheetByName('_dm_ef') || !ss.getSheetByName('_dm_trang_thai')) capNhatDanhMuc();

  var cfgDm = docCauHinh(dm);
  var boId = String(lop.bo_vai_tro || '').trim() || String(cfgDm.BO_VAI_TRO_MAC_DINH || '').trim();
  var cols = tinhCotTabLop(docBang(dm, 'bo_vai_tro'), docBang(dm, 'vai_tro'), boId);

  var sh = ss.insertSheet(classId);
  var nDong = TAB_LOP.SO_DONG_CHUAN_BI;
  var cuoiDong = TAB_LOP.DONG_DAU + nDong - 1;
  if (sh.getMaxRows() < cuoiDong) sh.insertRowsAfter(sh.getMaxRows(), cuoiDong - sh.getMaxRows());
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());

  // Dòng 1–5: thông tin lớp
  sh.getRange('B4').setNumberFormat('@');
  sh.getRange('A1').setValue('SYLLABUS · ' + (lop.ten_lop || classId));
  sh.getRange('A2:E2').setValues([['Mã lớp', classId, '', 'Nhóm lớp', lop.nhom_lop || '']]);
  sh.getRange('A3:E3').setValues([['Ngày bắt đầu', keyThanhDate(ngayKey(lop.ngay_bat_dau)), '', 'Ngày kết thúc', keyThanhDate(ngayKey(lop.ngay_ket_thuc))]]);
  sh.getRange('A4:E4').setValues([['Thứ học', String(lop.thu_hoc || ''), '', 'Giờ học', chuoiGioHoc(lop.gio_bat_dau, lop.gio_ket_thuc)]]);
  sh.getRange('A5:B5').setValues([['Người phụ trách', lop.phu_trach_email || '']]);
  sh.getRange('B3').setNumberFormat('dd/MM/yyyy');
  sh.getRange('E3').setNumberFormat('dd/MM/yyyy');
  var rTT = sh.getRange(1, 1, 5, cols.length).setBackground(MAU.TU_DONG);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold').setFontColor(MAU.TIM);
  sh.getRange('A2:A5').setFontWeight('bold');
  sh.getRange('D2:D4').setFontWeight('bold');
  rTT.setVerticalAlignment('middle');

  // Dòng 6: chú thích màu + link + email quản lý danh mục
  var gidEf = dm.getSheetByName('ef').getSheetId();
  var emailDm = emailTheoVaiTro(docBang(dm, 'quyen'), 'DANH_MUC');
  sh.getRange('A6').setValue('Chọn').setBackground(MAU.CHON);
  sh.getRange('B6').setValue('Nhập tay').setBackground(MAU.NHAP_TAY);
  sh.getRange('C6').setValue('Tự động').setBackground(MAU.TU_DONG);
  sh.getRange('D6').setFormula('=HYPERLINK("https://docs.google.com/spreadsheets/d/' + dm.getId() +
    '/edit#gid=' + gidEf + '","➕ Thiếu tên? Mở danh sách EF")');
  sh.getRange('G6').setValue(emailDm.length ? 'Nhờ quản lý danh mục thêm tên: ' + emailDm.join(', ') : '');
  sh.getRange('A6:C6').setFontWeight('bold').setHorizontalAlignment('center');

  // Dòng 7 khóa máy (ẩn), dòng 8 tiêu đề
  sh.getRange(TAB_LOP.DONG_KHOA, 1, 1, cols.length).setValues([cols.map(function (c) { return c.khoa; })]);
  sh.hideRows(TAB_LOP.DONG_KHOA);
  sh.setFrozenRows(TAB_LOP.DONG_TIEU_DE);
  sh.setFrozenColumns(3);

  dinhDangTabLop(sh, cols, nDong);
  datCongThucTuDong(sh, cols, nDong);
  datDoRongCot(sh, cols);

  ghiTabNhapVaoDanhMuc(dm, classId);
  PropertiesService.getScriptProperties().setProperty('CO_THAY_DOI', 'true');
  return sh;
}

/**
 * Cột Buổi và Thứ tính bằng công thức (đặt ở dòng 9), không ghi bằng onEdit:
 * hai cột này bị khóa chỉ QUAN_TRI sửa nên onEdit của người nhập không ghi được.
 */
function datCongThucTuDong(sh, cols, nDong) {
  var d0 = TAB_LOP.DONG_DAU, d1 = d0 + nDong - 1;
  var cNgay = 0, cBuoi = 0, cThu = 0;
  cols.forEach(function (c, i) {
    if (c.khoa === 'ngay') cNgay = i + 1;
    if (c.khoa === 'buoi_so') cBuoi = i + 1;
    if (c.khoa === 'thu') cThu = i + 1;
  });
  if (!cNgay) return;
  var vung = chuCot(cNgay) + d0 + ':' + chuCot(cNgay) + d1;
  if (cBuoi) {
    sh.getRange(d0, cBuoi, nDong, 1).clearContent();
    sh.getRange(d0, cBuoi).setFormula('=ARRAYFORMULA(IF(' + vung + '="","",COUNTIFS(' + vung + ',"<>",ROW(' + vung + '),"<="&ROW(' + vung + '))))');
  }
  if (cThu) {
    sh.getRange(d0, cThu, nDong, 1).clearContent();
    sh.getRange(d0, cThu).setFormula('=ARRAYFORMULA(IF(' + vung + '="","",CHOOSE(WEEKDAY(' + vung + '),"CN","T2","T3","T4","T5","T6","T7")))');
  }
}

function datDoRongCot(sh, cols) {
  cols.forEach(function (c, i) {
    var w = 120;
    if (c.khoa === 'buoi_so' || c.khoa === 'thu') w = 60;
    else if (c.khoa === 'ngay') w = 100;
    else if (c.khoa === 'gio_bd' || c.khoa === 'gio_kt') w = 75;
    else if (c.khoa === 'plan' || c.khoa === 'actual' || c.khoa === 'ghi_chu') w = 200;
    else if (c.khoa === 'status') w = 140;
    sh.setColumnWidth(i + 1, w);
  });
}

/** Ghi tab_nhap = class_id vào ⓐ.lop (ô đúng dòng). */
function ghiTabNhapVaoDanhMuc(dm, classId) {
  var sh = dm.getSheetByName('lop');
  var vals = sh.getDataRange().getValues();
  var cId = vals[0].map(function (h) { return String(h).trim(); }).indexOf('class_id');
  var cTab = vals[0].map(function (h) { return String(h).trim(); }).indexOf('tab_nhap');
  if (cId < 0 || cTab < 0) throw new Error('Tab lop của ⓐ thiếu cột class_id hoặc tab_nhap.');
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][cId]).trim() === classId) { sh.getRange(i + 1, cTab + 1).setValue(classId); return; }
  }
}

/**
 * Áp tiêu đề + màu nền + Data Validation + ghi chú + định dạng có điều kiện.
 * KHÔNG xóa dữ liệu người dùng. cols: kết quả tinhCotTabLop theo đúng thứ tự cột trên sheet.
 */
function dinhDangTabLop(sh, cols, nDong) {
  var ss = sh.getParent();
  var d0 = TAB_LOP.DONG_DAU;
  var shEf = ss.getSheetByName('_dm_ef'), shTt = ss.getSheetByName('_dm_trang_thai');
  var rEf = shEf.getRange('A2:A'), rTt = shTt.getRange('A2:A');

  // Tiêu đề
  var rTD = sh.getRange(TAB_LOP.DONG_TIEU_DE, 1, 1, cols.length);
  rTD.setValues([cols.map(function (c) {
    return c.nhieuNguoi ? c.tieuDe + '\n(nhiều người: cách nhau dấu phẩy)' : c.tieuDe;
  })]);
  rTD.setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sh.setRowHeight(TAB_LOP.DONG_TIEU_DE, 48);

  // Từng cột
  cols.forEach(function (c, i) {
    var col = i + 1;
    var thanCot = sh.getRange(d0, col, nDong, 1);
    var tdCell = sh.getRange(TAB_LOP.DONG_TIEU_DE, col);
    var nen = (c.loai === 'chon') ? MAU.CHON : (c.loai === 'nhap_tay' ? MAU.NHAP_TAY : MAU.TU_DONG);
    thanCot.setBackground(nen);
    var note = null, dv = null;

    if (c.khoa === 'ngay') {
      dv = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false)
        .setHelpText('Nhập ngày hợp lệ, ví dụ 28/10/2026').build();
      thanCot.setNumberFormat('dd/MM/yyyy');
      note = 'Ngày học (dd/MM/yyyy). Mỗi dòng một buổi.';
    } else if (c.khoa === 'gio_bd' || c.khoa === 'gio_kt') {
      var L = chuCot(col);
      dv = SpreadsheetApp.newDataValidation()
        .requireFormulaSatisfied('=OR(' + L + d0 + '="",AND(ISNUMBER(' + L + d0 + '),' + L + d0 + '>=0,' + L + d0 + '<1))')
        .setAllowInvalid(false).setHelpText('Nhập giờ hợp lệ, ví dụ 19:30. Để trống = dùng giờ của lớp.').build();
      thanCot.setNumberFormat('HH:mm');
      note = 'Giờ (hh:mm). Để trống = lấy giờ của lớp (dòng 4).';
    } else if (c.khoa === 'status') {
      dv = SpreadsheetApp.newDataValidation().requireValueInRange(rTt, true).setAllowInvalid(false)
        .setHelpText('Chọn trạng thái buổi từ danh sách. Để trống = bình thường.').build();
      note = 'Chọn từ danh sách. Nguồn: ⓐ DANH MỤC ▸ tab trang_thai_buoi (qua tab ẩn _dm_trang_thai). Trống = bình thường.';
    } else if (c.loai === 'chon') {
      // Chọn nhiều người: SpreadsheetApp chưa hỗ trợ chip → vẫn dùng danh sách nhưng cho phép giá trị ghép
      dv = SpreadsheetApp.newDataValidation().requireValueInRange(rEf, true)
        .setAllowInvalid(!!c.nhieuNguoi)
        .setHelpText('Chọn tên EF từ danh sách. Không thấy tên? Mở DANH MỤC ▸ tab ef (link ở dòng 6).').build();
      note = 'Chọn từ danh sách EF đang hoạt động. Nguồn: ⓐ DANH MỤC ▸ tab ef (qua tab ẩn _dm_ef).' +
        (c.nhieuNguoi ? '\nNhiều người: gõ các tên cách nhau dấu phẩy, ví dụ "Tên A, Tên B".' : '');
    } else if (c.loai === 'zoom') {
      note = 'Tự động: lấy từ Zoom report (module sau). Không nhập tay.';
    } else if (c.loai === 'tu_dong') {
      note = 'Tự động, không sửa.';
    }
    thanCot.clearDataValidations();
    if (dv) thanCot.setDataValidation(dv);
    tdCell.setNote(note || '');
  });

  dungDinhDangDieuKien(sh, cols, nDong, shTt);
}

/** Định dạng có điều kiện (thứ tự = ưu tiên). */
function dungDinhDangDieuKien(sh, cols, nDong, shTt) {
  var d0 = TAB_LOP.DONG_DAU;
  var idx = function (k) { return cols.map(function (c) { return c.khoa; }).indexOf(k) + 1; };
  var cNgay = idx('ngay'), cSt = idx('status');
  var rules = [];
  var tuyetDoi = function (col) { return '$' + chuCot(col) + d0; };
  var rCot = function (col) { return sh.getRange(d0, col, nDong, 1); };
  var rule = function (f, mau, range, chu) {
    var b = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f).setBackground(mau).setRanges([range]);
    if (chu) b = b.setFontColor(chu);
    return b.build();
  };
  if (cNgay) {
    var N = tuyetDoi(cNgay), nCol = chuCot(cNgay);
    rules.push(rule('=AND(' + N + '<>"",COUNTIF($' + nCol + '$' + d0 + ':$' + nCol + '$' + (d0 + nDong - 1) + ',' + N + ')>1)', MAU_LOI.TRUNG, rCot(cNgay)));
    rules.push(rule('=AND(ISNUMBER(' + N + '),OR(AND($B$3<>"",' + N + '<$B$3),AND($E$3<>"",' + N + '>$E$3)))', MAU_LOI.NGOAI, rCot(cNgay)));
    rules.push(rule('=AND(ISNUMBER(' + N + '),$B$4<>"",ISERROR(SEARCH(IF(WEEKDAY(' + N + ')=1,8,WEEKDAY(' + N + ')),$B$4)))', MAU_LOI.SAI_THU, rCot(cNgay)));
    var cTic = idx('role:TEACHER_IC');
    if (cTic) {
      var T = tuyetDoi(cTic).replace('$', ''); // ô của chính cột đó
      var S = cSt ? tuyetDoi(cSt) : '""';
      rules.push(rule('=AND(ISNUMBER(' + N + '),' + N + '<TODAY(),' + (cSt ? S + '=""' : 'TRUE') + ',' + T + '="")', MAU_LOI.THIEU_TIC, rCot(cTic)));
    }
  }
  if (cSt && shTt) {
    var tt = shTt.getDataRange().getValues();
    var tenOff = 'OFF';
    for (var i = 1; i < tt.length; i++) {
      var ten = String(tt[i][0]).trim(), id = String(tt[i][1]).trim(), mau = String(tt[i][2]).trim();
      if (id === 'OFF') tenOff = ten;
      if (ten && /^#[0-9a-fA-F]{6}$/.test(mau)) {
        rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(ten)
          .setBackground(mau).setFontColor(mauChuTheoNen(mau)).setRanges([rCot(cSt)]).build());
      }
    }
    rules.push(rule('=' + tuyetDoi(cSt) + '="' + tenOff.replace(/"/g, '""') + '"', MAU_LOI.OFF, sh.getRange(d0, 1, nDong, cols.length)));
  }
  if (cNgay) rules.push(rule('=' + tuyetDoi(cNgay) + '=TODAY()', MAU_LOI.HOM_NAY, sh.getRange(d0, 1, nDong, cols.length)));
  sh.setConditionalFormatRules(rules);
}

/**
 * Menu: áp lại DV/màu/định dạng điều kiện cho tab đang mở, không xóa dữ liệu.
 * Bộ vai trò đổi → thêm cột vai trò còn thiếu trước cột ghi_chu (không xóa cột cũ).
 */
function lamMoiDinhDangTab() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getActiveSheet();
  var nCot = sh.getLastColumn();
  var khoa = nCot ? sh.getRange(TAB_LOP.DONG_KHOA, 1, 1, nCot).getValues()[0].map(function (x) { return String(x).trim(); }) : [];
  if (khoa.indexOf('ngay') < 0) { ui.alert('Tab đang mở không phải tab lớp (không có dòng khóa ở dòng 7).'); return; }

  var dm = moFileDanhMuc();
  capNhatDanhMuc();
  var classId = String(sh.getRange(TAB_LOP.O_CLASS_ID).getValue()).trim();
  var lop = docBangHienThi(dm, 'lop').filter(function (l) { return String(l.class_id).trim() === classId; })[0];
  if (!lop) { ui.alert('Mã lớp "' + classId + '" (ô B2) không có trong ⓐ.'); return; }
  var boId = String(lop.bo_vai_tro || '').trim() || String(docCauHinh(dm).BO_VAI_TRO_MAC_DINH || '').trim();
  var boRows = docBang(dm, 'bo_vai_tro'), vtRows = docBang(dm, 'vai_tro');

  // Thêm cột còn thiếu trước ghi_chu
  var moi = tinhCotTabLop(boRows, vtRows, boId);
  var thieu = cotThieu(moi, khoa);
  if (thieu.length) {
    var cGc = khoa.indexOf('ghi_chu') + 1 || (nCot + 1);
    sh.insertColumnsBefore(cGc, thieu.length);
    thieu.forEach(function (c, i) { sh.getRange(TAB_LOP.DONG_KHOA, cGc + i).setValue(c.khoa); });
    khoa = sh.getRange(TAB_LOP.DONG_KHOA, 1, 1, sh.getLastColumn()).getValues()[0].map(function (x) { return String(x).trim(); });
  }

  // Cột cũ không còn trong bộ: vẫn giữ, tra loại từ bảng vai_tro
  var boThem = boRows.slice();
  khoa.forEach(function (k, i) {
    if (k.indexOf('role:') === 0 && !moi.some(function (c) { return c.khoa === k; })) {
      boThem.push({ bo_id: boId, role_id: k.substring(5), thu_tu_cot: 1000 + i });
    }
  });
  var dayDu = tinhCotTabLop(boThem, vtRows, boId);
  var theoKhoa = {};
  dayDu.forEach(function (c) { theoKhoa[c.khoa] = c; });
  var cols = khoa.map(function (k) { return theoKhoa[k] || { khoa: k, tieuDe: k, loai: 'tu_dong' }; });

  var nDong = Math.max(TAB_LOP.SO_DONG_CHUAN_BI, sh.getLastRow() - TAB_LOP.DONG_TIEU_DE);
  var can = TAB_LOP.DONG_DAU + nDong - 1;
  if (sh.getMaxRows() < can) sh.insertRowsAfter(sh.getMaxRows(), can - sh.getMaxRows());
  dinhDangTabLop(sh, cols, nDong);
  datCongThucTuDong(sh, cols, nDong);
  datDoRongCot(sh, cols);
  ss.toast('Đã làm mới định dạng tab ' + classId + (thieu.length ? ' (thêm ' + thieu.length + ' cột vai trò).' : '.'), 'E-WIT', 5);
}
