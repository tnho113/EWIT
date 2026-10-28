/**
 * E-WIT · ⓓ THÙ LAO · Menu.gs
 * Menu + kéo dữ liệu từ ⓒ (phan_cong) và ⓐ (tên lớp, EF, vai trò, level) vào tab du_lieu.
 * Không ghi gì vào ⓒ hay ⓐ. Không Logger số tiền / tên / email.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('E-WIT')
    .addItem('Kéo dữ liệu mới', 'keoDuLieuTuMenu')
    .addItem('Lập báo cáo', 'lapBaoCaoTuMenu')
    .addSeparator()
    .addItem('Chốt kỳ…', 'chotKyTuMenu')
    .addItem('Kiểm tra điều chỉnh sau chốt', 'kiemTraDieuChinhTuMenu')
    .addSeparator()
    .addItem('Xem trước quyền', 'xemTruocQuyenTuMenu')
    .addItem('Áp dụng quyền', 'apDungQuyenTuMenu')
    .addSeparator()
    .addItem('Cài đặt chạy tự động (kéo dữ liệu mỗi giờ)', 'caiTrigger')
    .addToUi();
}

/** Chạy một việc từ menu: bắt lỗi, báo bằng hộp thoại (chỉ nói loại lỗi, không dữ liệu). */
function chayTuMenu(ten, fn) {
  try { fn(); }
  catch (e) { SpreadsheetApp.getUi().alert(ten + ' lỗi: ' + (e && e.message ? e.message : e)); }
}
function keoDuLieuTuMenu() { chayTuMenu('Kéo dữ liệu', function () {
  var n = keoDuLieu();
  SpreadsheetApp.getUi().alert('Đã kéo ' + n + ' dòng phân công về tab du_lieu.');
}); }
function lapBaoCaoTuMenu() { chayTuMenu('Lập báo cáo', lapBaoCao); }
function chotKyTuMenu() { chayTuMenu('Chốt kỳ', chotKy); }
function kiemTraDieuChinhTuMenu() { chayTuMenu('Kiểm tra điều chỉnh', kiemTraDieuChinh); }
function xemTruocQuyenTuMenu() { chayTuMenu('Xem trước quyền', xemTruocQuyenThuLao); }
function apDungQuyenTuMenu() { chayTuMenu('Áp dụng quyền', apDungQuyenThuLao); }

/** Trigger mỗi giờ gọi hàm này (không có giao diện). */
function keoDuLieuTuDong() { keoDuLieu(); }

/** Cài trigger kéo dữ liệu mỗi giờ (xóa trigger cũ cùng hàm trước khi tạo). */
function caiTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'keoDuLieuTuDong') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('keoDuLieuTuDong').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert('Đã cài chạy tự động: kéo dữ liệu mỗi giờ.');
}

/** Kéo ⓒ.phan_cong + tên từ ⓐ → ghi đè toàn bộ du_lieu. Trả về số dòng. */
function keoDuLieu() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Đang có tiến trình khác chạy, thử lại sau');
  try {
    var ss = SpreadsheetApp.getActive();
    var ch = docCauHinh(ss);
    if (!ch.DU_LIEU_ID || !ch.DANH_MUC_ID) throw new Error('Thiếu DU_LIEU_ID / DANH_MUC_ID trong tab cau_hinh');
    var ssC = SpreadsheetApp.openById(String(ch.DU_LIEU_ID).trim());
    var ssA = SpreadsheetApp.openById(String(ch.DANH_MUC_ID).trim());

    var dict = function (tab, khoa, cot) {
      var m = {};
      docBang(ssA, tab).forEach(function (r) { m[String(r[khoa]).trim()] = r[cot]; });
      return m;
    };
    var tenLop = dict('lop', 'class_id', 'ten_lop');
    var nhomLop = dict('lop', 'class_id', 'nhom_lop');
    var tenEf = dict('ef', 'ef_id', 'ten_hien_thi');
    var tenVaiTro = dict('vai_tro', 'role_id', 'ten_vai_tro');
    var tenLevel = dict('level', 'level_id', 'ten_level');

    // Ngày dự phòng từ buoi_hoc nếu phan_cong thiếu ngày
    var ngayBuoi = {};
    docBang(ssC, 'buoi_hoc').forEach(function (r) { ngayBuoi[String(r.session_id).trim()] = r.ngay; });

    var gio = bayGio();
    var tra = function (m, k) { k = String(k === undefined || k === null ? '' : k).trim(); return k && m[k] !== undefined ? m[k] : ''; };
    var rows = [];
    docBang(ssC, 'phan_cong').forEach(function (p) {
      var id = String(p.assignment_id || '').trim();
      if (!id) return;
      rows.push({
        assignment_id: id, session_id: p.session_id,
        ngay: p.ngay || ngayBuoi[String(p.session_id).trim()] || '',
        class_id: p.class_id, ten_lop: tra(tenLop, p.class_id),
        nhom_lop: p.nhom_lop || tra(nhomLop, p.class_id),
        ef_id: p.ef_id, ten_ef: tra(tenEf, p.ef_id),
        role_id: p.role_id, ten_vai_tro: tra(tenVaiTro, p.role_id),
        level_id: p.level_id, ten_level: tra(tenLevel, p.level_id),
        status_id: p.status_id, keo_ve_luc: gio
      });
    });
    ghiBang(ss, 'du_lieu', rows);
    ghiCauHinh(ss, 'KEO_VE_LAN_CUOI', gio);
    ghiCauHinh(ss, 'SCRIPT_VERSION', SCRIPT_VERSION);
    return rows.length;
  } finally {
    lock.releaseLock();
  }
}
