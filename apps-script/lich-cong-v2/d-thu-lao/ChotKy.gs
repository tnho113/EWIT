/**
 * E-WIT · ⓓ THÙ LAO · ChotKy.gs
 * Chốt kỳ: chụp bảng báo cáo sang tab KY_<từ>_<đến> (khóa), lưu danh sách assignment_id vào tab ẩn _ky_assignment.
 * Kiểm tra điều chỉnh: so du_lieu hiện tại với bản chụp từng kỳ → ghi dieu_chinh.
 */

/** Thêm dòng vào cuối tab theo tên cột ở dòng 1 (không xóa dữ liệu cũ). */
function themDongVaoBang(ss, tenTab, rows) {
  if (!rows.length) return;
  var sh = ss.getSheetByName(tenTab);
  var cols = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var dau = Math.max(sh.getLastRow(), 1) + 1;
  sh.getRange(dau, 1, rows.length, cols.length).setValues(objectThanhBang(rows, cols));
}

function emailNguoiDung() {
  return (Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || '').toLowerCase();
}

/** Email QUAN_TRI từ ⓐ.quyen (chỉ đọc). */
function docQuanTriTuA(ss) {
  var ch = docCauHinh(ss);
  if (!ch.DANH_MUC_ID) throw new Error('Thiếu DANH_MUC_ID trong cau_hinh');
  var ssA = SpreadsheetApp.openById(String(ch.DANH_MUC_ID).trim());
  return emailTheoVaiTro(docBang(ssA, 'quyen'), 'QUAN_TRI');
}

function layQuyenThuLao(ss) {
  return tinhQuyenThuLao(docBang(ss, 'quyen'), docQuanTriTuA(ss));
}

function laySheetAn(ss, ten, tieuDe) {
  var sh = ss.getSheetByName(ten);
  if (!sh) {
    sh = ss.insertSheet(ten);
    sh.getRange(1, 1, 1, tieuDe.length).setValues([tieuDe]).setFontWeight('bold');
    sh.hideSheet();
  }
  return sh;
}

function chotKy() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var bc = ss.getSheetByName(BC.TAB);
  if (!bc) { ui.alert('Chưa có tab bao_cao. Hãy lập báo cáo trước.'); return; }
  var boLoc = docBoLoc(bc);
  if (!boLoc.tu || !boLoc.den) { ui.alert('Báo cáo chưa có khoảng ngày (B2, E2).'); return; }
  var kyId = idKy(boLoc.tu, boLoc.den);
  if (ss.getSheetByName(kyId)) { ui.alert('Kỳ ' + kyId + ' đã chốt rồi.'); return; }

  var last = bc.getLastRow();
  if (last < BC.DONG_DAU) { ui.alert('Bảng báo cáo đang trống. Hãy bấm "Lập báo cáo" trước.'); return; }
  var vung = bc.getRange(BC.DONG_DAU, 1, last - BC.DONG_DAU + 1, BC.COT_KHOA).getValues();
  var data = vung.filter(function (r) { return String(r[BC.COT_KHOA - 1]).trim() !== ''; });
  if (!data.length) { ui.alert('Bảng báo cáo đang trống. Hãy bấm "Lập báo cáo" trước.'); return; }
  var thieu = demThieuThuLao(data.map(function (r) { return { so_buoi: r[4], thu_lao_quyet_dinh: r[8] }; }));

  if (ui.alert('Chốt kỳ', 'Chốt kỳ ' + ngayNgan(boLoc.tu) + '/' + boLoc.tu.slice(0, 4) + ' – ' +
      ngayNgan(boLoc.den) + '/' + boLoc.den.slice(0, 4) + ' với ' + data.length +
      ' dòng? Sau khi chốt, bản chụp bị khóa.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  if (thieu > 0 && ui.alert('Còn thiếu thù lao', 'Còn ' + thieu + ' dòng có số buổi nhưng chưa nhập thù lao quyết định. Vẫn chốt?',
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('Đang có tiến trình khác chạy, thử lại sau.'); return; }
  try {
    var phq = layQuyenThuLao(ss); // đọc quyền trước khi tạo gì
    // 1) Bản chụp (cả dòng tổng nếu có)
    var sh = ss.insertSheet(kyId);
    var n = vung.length;
    sh.getRange(1, 1, 1, BC.NHAN.length).setValues([BC.NHAN]).setBackground(MAU.TIEU_DE_NEN)
      .setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
    sh.getRange(2, 6, n, 1).setNumberFormat('@');
    sh.getRange(2, 1, n, BC.COT_KHOA).setValues(vung);
    sh.getRange(2, 7, n, 3).setNumberFormat('#,##0');
    sh.getRange(2, 1, n, BC.COT_KHOA).setBackground(MAU.TU_DONG);
    sh.hideColumns(BC.COT_KHOA);
    sh.setFrozenRows(1);
    // 2) Danh sách assignment_id của kỳ (toàn bộ trong khoảng ngày, không phụ thuộc bộ lọc)
    var ds = assignmentTrongKhoang(docBang(ss, 'du_lieu'), boLoc.tu, boLoc.den);
    var an = laySheetAn(ss, '_ky_assignment', ['ky_id', 'assignment_id', 'chi_tiet']);
    themDongVaoBang(ss, '_ky_assignment', ds.map(function (x) {
      return { ky_id: kyId, assignment_id: x.assignment_id, chi_tiet: x.chi_tiet };
    }));
    // 3) Ghi ky_chot
    var loc = [boLoc.ef, boLoc.lop, boLoc.vaiTro].filter(function (x) { return x; });
    themDongVaoBang(ss, 'ky_chot', [{ ky_id: kyId, tu_ngay: ngayTuKey(boLoc.tu), den_ngay: ngayTuKey(boLoc.den),
      nguoi_chot: emailNguoiDung(), chot_luc: bayGio(), so_dong: data.length,
      ghi_chu: loc.length ? 'Có lọc: ' + loc.join(' / ') : '' }]);
    // 4) Khóa: chỉ người có quyền SUA (và QUAN_TRI)
    var p = sh.protect().setDescription('E-WIT · kỳ đã chốt ' + kyId);
    p.setWarningOnly(false);
    try { p.removeEditors(p.getEditors()); } catch (e) { /* chủ file không gỡ được */ }
    if (phq.editors.length) { try { p.addEditors(phq.editors); } catch (e) { /* email ngoài miền */ } }
    SpreadsheetApp.flush();
    ui.alert('Đã chốt ' + kyId + ' (' + data.length + ' dòng).');
  } finally {
    lock.releaseLock();
  }
}

/** Với mỗi kỳ đã chốt, so assignment hiện tại với bản chụp; thêm/bớt → ghi dieu_chinh (không lặp). */
function kiemTraDieuChinh() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var kyRows = docBang(ss, 'ky_chot');
  if (!kyRows.length) { ui.alert('Chưa có kỳ nào được chốt.'); return; }
  var an = ss.getSheetByName('_ky_assignment');
  var chup = an ? bangThanhObject(an.getDataRange().getValues()) : [];
  var duLieu = docBang(ss, 'du_lieu');
  var cu = docBang(ss, 'dieu_chinh');
  var gio = bayGio(), moi = [];
  kyRows.forEach(function (k) {
    var kyId = String(k.ky_id).trim();
    var chupKy = chup.filter(function (c) { return String(c.ky_id).trim() === kyId; })
      .map(function (c) { return { assignment_id: String(c.assignment_id).trim(), chi_tiet: c.chi_tiet }; });
    var ht = assignmentTrongKhoang(duLieu, k.tu_ngay, k.den_ngay);
    var kq = soSanhKy(ht, chupKy);
    kq.them.forEach(function (x) { moi.push({ phat_hien_luc: gio, ky_id: kyId, assignment_id: x.assignment_id,
      loai: 'THEM', chi_tiet: x.chi_tiet, xu_ly_o_ky: '', da_xu_ly: 'Không', ghi_chu: '' }); });
    kq.bot.forEach(function (x) { moi.push({ phat_hien_luc: gio, ky_id: kyId, assignment_id: x.assignment_id,
      loai: 'BOT', chi_tiet: x.chi_tiet, xu_ly_o_ky: '', da_xu_ly: 'Không', ghi_chu: '' }); });
  });
  var them = locDieuChinhMoi(moi, cu);
  themDongVaoBang(ss, 'dieu_chinh', them);
  ui.alert(them.length ? 'Phát hiện ' + them.length + ' điều chỉnh mới sau chốt. Xem tab dieu_chinh.'
    : 'Không có điều chỉnh mới sau chốt.');
}
