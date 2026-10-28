/**
 * E-WIT · ⓓ THÙ LAO · Quyen.gs
 * Quyền xem/sửa file ⓓ theo tab quyen (SUA/XEM) + QUAN_TRI từ ⓐ (luôn là người sửa).
 * Logic tính nằm ở BaoCaoLogic.gs (tinhQuyenThuLao, keHoachQuyen). Chỉ chạy tay; không gỡ chủ file.
 */

function hienCoQuyenFile(file) {
  var em = function (u) { return String(u.getEmail()).toLowerCase(); };
  var chu = file.getOwner();
  return { chu: chu ? em(chu) : '', editors: file.getEditors().map(em), viewers: file.getViewers().map(em) };
}

function tinhKeHoachQuyen(ss) {
  var file = DriveApp.getFileById(ss.getId());
  var hien = hienCoQuyenFile(file);
  var muon = layQuyenThuLao(ss);
  return { file: file, muon: muon, ke: keHoachQuyen(muon, hien, hien.chu) };
}

/** Ghi kế hoạch vào tab ẩn-hiện _xem_truoc_quyen (email nằm trong file bảo mật, không ra log). */
function xemTruocQuyenThuLao() {
  var ss = SpreadsheetApp.getActive();
  var t = tinhKeHoachQuyen(ss);
  var sh = ss.getSheetByName('_xem_truoc_quyen') || ss.insertSheet('_xem_truoc_quyen');
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['email', 'hien_tai', 'se_thanh', 'hanh_dong']])
    .setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
  if (t.ke.length) {
    sh.getRange(2, 1, t.ke.length, 4).setValues(t.ke.map(function (k) { return [k.email, k.hien_tai, k.se_thanh, k.hanh_dong]; }));
  }
  sh.getRange(1, 6).setValue('Chỉ liệt kê điểm khác biệt. Hành động: CAP_SUA, CAP_XEM, HA_XUONG_XEM, GO. Chủ file không bao giờ bị đổi.');
  ss.setActiveSheet(sh);
  SpreadsheetApp.getUi().alert(t.ke.length ? 'Có ' + t.ke.length + ' thay đổi quyền, xem tab _xem_truoc_quyen.'
    : 'Quyền hiện tại đã khớp với tab quyen.');
}

/** Chỉ chạy tay. Hỏi xác nhận trước khi gỡ người. */
function apDungQuyenThuLao() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var t = tinhKeHoachQuyen(ss);
  if (!t.muon.editors.length) { ui.alert('Không có ai quyền SUA / QUAN_TRI hợp lệ. Dừng để tránh khóa mất file.'); return; }
  var toi = emailNguoiDung();
  var chu = hienCoQuyenFile(t.file).chu;
  if (toi && toi !== chu && t.muon.editors.indexOf(toi) < 0) {
    ui.alert('Bạn không nằm trong danh sách được sửa nên sẽ tự mất quyền. Dừng lại.'); return;
  }
  if (!t.ke.length) { ui.alert('Quyền hiện tại đã khớp với tab quyen.'); return; }
  var go = t.ke.filter(function (k) { return k.hanh_dong === 'GO'; }).length;
  var msg = 'Sẽ áp dụng ' + t.ke.length + ' thay đổi (gỡ ' + go + ' người). Xem chi tiết ở "Xem trước quyền". Tiếp tục?';
  if (ui.alert('Áp dụng quyền', msg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  var loi = 0;
  t.ke.forEach(function (k) {
    try {
      if (k.hanh_dong === 'GO') {
        if (k.hien_tai === 'SUA') t.file.removeEditor(k.email); else t.file.removeViewer(k.email);
      } else if (k.hanh_dong === 'CAP_SUA') {
        t.file.addEditor(k.email);
      } else if (k.hanh_dong === 'CAP_XEM') {
        t.file.addViewer(k.email);
      } else if (k.hanh_dong === 'HA_XUONG_XEM') {
        t.file.removeEditor(k.email); t.file.addViewer(k.email);
      }
    } catch (e) { loi++; }
  });
  ui.alert(loi ? 'Xong, nhưng ' + loi + ' thay đổi không áp dụng được (email ngoài miền hoặc không hợp lệ).' : 'Đã áp dụng quyền.');
}
