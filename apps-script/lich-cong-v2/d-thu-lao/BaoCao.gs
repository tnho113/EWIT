/**
 * E-WIT · ⓓ THÙ LAO · BaoCao.gs
 * Tab bao_cao: B2 từ ngày · E2 đến ngày · B3 lọc EF · D3 lọc lớp · F3 lọc vai trò.
 * Dòng 5 tiêu đề, kết quả từ dòng 6, cột K = khóa ẩn (ef|level|role|class).
 */

var BC = {
  TAB: 'bao_cao', DONG_TIEU_DE: 5, DONG_DAU: 6, COT_KHOA: 11,
  NHAN: ['EF', 'Level', 'Vai trò', 'Lớp', 'Số buổi', 'Các ngày', 'Mức đề xuất', 'Thành tiền đề xuất',
    'Thù lao quyết định', 'Ghi chú', 'khoa']
};

/** Tạo khung dòng 1–5 nếu chưa đúng mẫu; gắn DV ngày và dropdown lọc. */
function chuanBiKhungBaoCao(ss, duLieu) {
  var sh = ss.getSheetByName(BC.TAB) || ss.insertSheet(BC.TAB);
  var nhan = function (a1, v) { if (String(sh.getRange(a1).getValue()).trim() !== v) sh.getRange(a1).setValue(v); };
  if (String(sh.getRange('A1').getValue()).trim() === '') sh.getRange('A1').setValue('BÁO CÁO VAI TRÒ THEO KHOẢNG NGÀY');
  nhan('A2', 'Từ ngày'); nhan('D2', 'Đến ngày');
  nhan('A3', 'Lọc EF'); nhan('C3', 'Lọc lớp'); nhan('E3', 'Lọc vai trò');
  sh.getRange('A4').setValue('Chọn khoảng ngày (bắt buộc), lọc tùy chọn (tên hoặc mã), rồi bấm menu E-WIT ▸ Lập báo cáo. Ô vàng là ô nhập tay.');
  sh.getRange('A1').setFontWeight('bold').setFontSize(13).setFontColor(MAU.TIM);
  ['A2', 'D2', 'A3', 'C3', 'E3'].forEach(function (a) { sh.getRange(a).setFontWeight('bold'); });
  ['B2', 'E2', 'B3', 'D3', 'F3'].forEach(function (a) { sh.getRange(a).setBackground(MAU.NHAP_TAY); });
  var dvNgay = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false)
    .setHelpText('Nhập ngày hợp lệ, ví dụ 01/11/2026').build();
  sh.getRange('B2').setDataValidation(dvNgay).setNumberFormat('dd/MM/yyyy');
  sh.getRange('E2').setDataValidation(dvNgay).setNumberFormat('dd/MM/yyyy');
  [['B3', 'ten_ef'], ['D3', 'ten_lop'], ['F3', 'ten_vai_tro']].forEach(function (x) {
    var ds = danhSachLoc(duLieu, x[1]);
    var r = sh.getRange(x[0]);
    if (ds.length) {
      r.setBackground(MAU.CHON).setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(ds, true).setAllowInvalid(true).build());
    }
  });
  var tieuDe = sh.getRange(BC.DONG_TIEU_DE, 1, 1, BC.NHAN.length);
  tieuDe.setValues([BC.NHAN]).setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
  sh.hideColumns(BC.COT_KHOA);
  sh.setFrozenRows(BC.DONG_TIEU_DE);
  return sh;
}

/** Đọc thù lao + ghi chú đang có trong bảng để giữ lại khi lập lại. */
function docGiuLaiTuSheet(sh) {
  var last = sh.getLastRow();
  if (last < BC.DONG_DAU) return {};
  var v = sh.getRange(BC.DONG_DAU, 1, last - BC.DONG_DAU + 1, BC.COT_KHOA).getValues();
  return taoGiuLai(v.map(function (r) {
    return { khoa: r[BC.COT_KHOA - 1], thu_lao_quyet_dinh: r[8], ghi_chu: r[9] };
  }));
}

/** Đọc bộ lọc từ ô; trả {tu, den, ef, lop, vaiTro}. */
function docBoLoc(sh) {
  var g = function (a) { return sh.getRange(a).getValue(); };
  return { tu: ngayKey(g('B2')), den: ngayKey(g('E2')),
    ef: String(g('B3')).trim(), lop: String(g('D3')).trim(), vaiTro: String(g('F3')).trim() };
}

function lapBaoCao() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var duLieu = docBang(ss, 'du_lieu');
  var sh = chuanBiKhungBaoCao(ss, duLieu);
  var boLoc = docBoLoc(sh);
  if (!boLoc.tu || !boLoc.den) { ui.alert('Hãy chọn "Từ ngày" (B2) và "Đến ngày" (E2) trước.'); return; }
  if (boLoc.tu > boLoc.den) { ui.alert('"Từ ngày" đang sau "Đến ngày".'); return; }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('Đang có tiến trình khác chạy, thử lại sau.'); return; }
  try {
    var quyTac = docBang(ss, 'quy_tac_muc');
    var giuLai = docGiuLaiTuSheet(sh); // đọc TRƯỚC khi xóa
    var rows = lapBaoCaoLogic(duLieu, boLoc, quyTac, giuLai);

    var cuoi = Math.max(sh.getLastRow(), BC.DONG_DAU);
    sh.getRange(BC.DONG_DAU, 1, cuoi - BC.DONG_DAU + 1, BC.COT_KHOA).clear();
    if (rows.length) {
      var n = rows.length;
      sh.getRange(BC.DONG_DAU, 6, n, 1).setNumberFormat('@'); // 'cac_ngay' là chữ, tránh bị đổi thành ngày
      var cot = COT_BAO_CAO.concat(['khoa']);
      sh.getRange(BC.DONG_DAU, 1, n, cot.length).setValues(objectThanhBang(rows, cot));
      sh.getRange(BC.DONG_DAU, 1, n, 8).setBackground(MAU.TU_DONG);
      sh.getRange(BC.DONG_DAU, 9, n, 2).setBackground(MAU.NHAP_TAY);
      sh.getRange(BC.DONG_DAU, 7, n, 3).setNumberFormat('#,##0');
      sh.getRange(BC.DONG_DAU, 9, n, 1).setNumberFormat('#,##0');
      sh.getRange(BC.DONG_DAU, 6, n, 1).setWrap(true);
      var tong = tinhTongBaoCao(rows);
      var dt = BC.DONG_DAU + n;
      sh.getRange(dt, 1, 1, 10).setValues([['TỔNG', '', '', '', tong.so_buoi, '', '', tong.thanh_tien_de_xuat, '', '']])
        .setFontWeight('bold').setBackground(MAU.TU_DONG);
      sh.getRange(dt, 8).setNumberFormat('#,##0');
    }
    SpreadsheetApp.flush();
    ui.alert(rows.length ? 'Đã lập báo cáo: ' + rows.length + ' dòng.' : 'Không có buổi nào trong khoảng ngày / bộ lọc này.');
  } finally {
    lock.releaseLock();
  }
}
