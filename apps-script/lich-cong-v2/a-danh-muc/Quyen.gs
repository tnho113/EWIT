/**
 * E-WIT · ⓐ DANH MỤC · Quyen.gs
 * Chia sẻ file ⓐⓑⓒ và khóa tab lớp trong ⓑ theo tab quyen + lop.phu_trach_email.
 * Phần tính toán thuần nằm ở QuyenLogic.gs.
 */

var TAB_XEM_TRUOC = '_xem_truoc_quyen';
var KHOA_CAU_HINH_KET_QUA = 'AP_DUNG_QUYEN_LAN_CUOI';
var KHOA_PROP_TAB = 'QUYEN_TAB_DA_AP'; // Script Properties: class_id → {e, v} đã áp lần trước
var TAB_CHI_QUAN_TRI = ['_MAU', 'cau_hinh', 'HUONG_DAN']; // cộng thêm mọi tab bắt đầu bằng _dm_

function layThongTinChiaSe_(file) {
  var chu = file.getOwner();
  var em = function (u) { return String(u.getEmail() || '').toLowerCase(); };
  return {
    editors: file.getEditors().map(em).filter(String),
    viewers: file.getViewers().map(em).filter(String),
    chu: chu ? em(chu) : ''
  };
}

/** Đọc ⓐ, tính kế hoạch, so với chia sẻ hiện tại của ⓐⓑⓒ. Không thay đổi gì. */
function layKeHoach_() {
  var ssA = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = docCauHinh(ssA);
  var id = { A: ssA.getId(), B: String(cfg.NHAP_LIEU_ID || '').trim(), C: String(cfg.DU_LIEU_ID || '').trim() };
  if (!id.B) throw new Error('Thiếu NHAP_LIEU_ID trong tab cau_hinh.');
  if (!id.C) throw new Error('Thiếu DU_LIEU_ID trong tab cau_hinh.');
  var ke = tinhKeHoachQuyen(docBang(ssA, 'lop'), docBang(ssA, 'quyen'));
  var file = {}, so = {};
  ['A', 'B', 'C'].forEach(function (k) {
    try {
      file[k] = DriveApp.getFileById(id[k]);
    } catch (e) {
      throw new Error('Không mở được file ' + (k === 'A' ? 'ⓐ' : k === 'B' ? 'ⓑ' : 'ⓒ') + ' (kiểm tra ID trong cau_hinh và quyền của bạn với file này).');
    }
    so[k] = soSanhChiaSe(ke['file' + k], layThongTinChiaSe_(file[k]));
  });
  return { ssA: ssA, id: id, ke: ke, file: file, so: so };
}

function daLuuTab_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(KHOA_PROP_TAB) || '{}'); } catch (e) { return {}; }
}

/** Với mỗi tab lớp: trạng thái cập nhật + số người sẽ bị gỡ, dựa trên bản đã áp lần trước. */
function trangThaiTab_(ke, chiThem) {
  var da = daLuuTab_();
  return ke.tabLop.map(function (t) {
    var moi = { e: t.editors, v: '' };
    var truoc = da[t.class_id] || null;
    var trangThai = truoc ? (tabCanCapNhat({ e: truoc.e, v: '' }, moi, chiThem) ) : 'AP_DUNG';
    var biGo = truoc ? truoc.e.filter(function (x) { return t.editors.indexOf(x) < 0; }) : [];
    return { class_id: t.class_id, trangThai: trangThai, biGo: biGo, editors: t.editors };
  });
}

function xemTruocQuyen() {
  chayAnToan_('Xem trước thay đổi quyền', function () {
    var kh = layKeHoach_();
    var tab = trangThaiTab_(kh.ke, false);
    var ss = kh.ssA;
    var sh = ss.getSheetByName(TAB_XEM_TRUOC) || ss.insertSheet(TAB_XEM_TRUOC);
    sh.clear();
    var ten = { A: 'ⓐ DANH MỤC', B: 'ⓑ NHẬP LIỆU', C: 'ⓒ DỮ LIỆU' };
    var dong = [['file', 'hành động', 'email / tab', 'chi tiết']];
    ['A', 'B', 'C'].forEach(function (k) {
      var s = kh.so[k];
      s.themEditors.forEach(function (e) { dong.push([ten[k], 'SẼ THÊM', e, 'quyền sửa']); });
      s.themViewers.forEach(function (e) { dong.push([ten[k], 'SẼ THÊM', e, 'quyền xem']); });
      s.haCap.forEach(function (e) { dong.push([ten[k], 'SẼ GỠ', e, 'hạ từ sửa xuống xem']); });
      s.go.forEach(function (e) { dong.push([ten[k], 'SẼ GỠ', e, 'gỡ hẳn khỏi file']); });
    });
    tab.forEach(function (t) {
      if (t.trangThai === 'KHONG_DOI') return;
      dong.push(['ⓑ tab ' + t.class_id, t.biGo.length ? 'SẼ GỠ' : 'SẼ KHÓA', t.editors.join(', '),
        t.biGo.length ? ('gỡ ' + t.biGo.length + ' người khỏi quyền sửa tab') : 'khóa / cập nhật người được sửa tab']);
    });
    kh.ke.loi.forEach(function (m) { dong.push(['(lỗi dữ liệu)', 'BỎ QUA', '', m]); });
    if (dong.length === 1) dong.push(['', 'KHÔNG CÓ THAY ĐỔI', '', 'Chia sẻ hiện tại đã khớp kế hoạch.']);
    sh.getRange(1, 1, dong.length, 4).setValues(dong);
    sh.getRange(1, 1, 1, 4).setBackground(MAU.TIEU_DE_NEN).setFontColor(MAU.TIEU_DE_CHU).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 2, 150); sh.setColumnWidth(3, 320); sh.setColumnWidth(4, 360);
    ss.setActiveSheet(sh);
    thongBao_('Xem trước quyền', 'Đã ghi ' + (dong.length - 1) + ' dòng vào tab "' + TAB_XEM_TRUOC + '". Chưa thay đổi gì.');
  });
}

/** Menu: chạy tay, có xác nhận khi sẽ gỡ người. */
function apDungQuyen() {
  chayAnToan_('Áp dụng quyền', function () { thucThiApDung_(false); });
}

/** Trigger mỗi giờ: CHỈ THÊM, không gỡ, không hỏi. */
function apDungQuyenTuDong() {
  thucThiApDung_(true);
}

function thucThiApDung_(chiThem) {
  var khoa = LockService.getScriptLock();
  if (!khoa.tryLock(30000)) throw new Error('Đang có lượt áp dụng quyền khác chạy. Thử lại sau ít phút.');
  var ssA = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var kh = layKeHoach_();
    var ke = kh.ke;
    if (!ke.quanTri.length) throw new Error('Chưa có email QUAN_TRI hiệu lực trong tab quyen. Dừng để tránh khóa nhầm mọi người.');
    var tab = trangThaiTab_(ke, chiThem);

    // Xác nhận khi chạy tay và có người sẽ bị gỡ
    var soGo = 0;
    ['A', 'B', 'C'].forEach(function (k) { soGo += kh.so[k].go.length + kh.so[k].haCap.length; });
    tab.forEach(function (t) { soGo += t.biGo.length; });
    if (!chiThem && soGo > 0 && coUi_()) {
      var ui = SpreadsheetApp.getUi();
      var tl = ui.alert('Xác nhận gỡ quyền',
        'Sẽ gỡ / hạ quyền ' + soGo + ' mục (email không còn trong kế hoạch). Bạn nên bấm "Xem trước thay đổi quyền" trước.\n\nTiếp tục áp dụng?',
        ui.ButtonSet.YES_NO);
      if (tl !== ui.Button.YES) { thongBao_('Đã hủy', 'Chưa thay đổi gì.'); return; }
    }

    var kq = { them: 0, go: 0, tabKhoa: 0, tabBoQua: 0, tabCanTay: 0, loiBo: ke.loi.length };
    ['A', 'B', 'C'].forEach(function (k) { apDungFile_(kh.file[k], kh.so[k], chiThem, kq); });
    apDungTabB_(ssA, kh, tab, chiThem, kq);

    var tomTat = bayGio() + ' · ' + (chiThem ? 'tự động (chỉ thêm)' : 'chạy tay') +
      ' · thêm ' + kq.them + ', gỡ ' + kq.go + ', tab khóa ' + kq.tabKhoa + ', tab bỏ qua ' + kq.tabBoQua +
      ', tab cần chạy tay ' + kq.tabCanTay + ', dòng lỗi dữ liệu ' + kq.loiBo;
    ghiCauHinh(ssA, KHOA_CAU_HINH_KET_QUA, tomTat);
    ghiCauHinh(ssA, 'SCRIPT_VERSION', SCRIPT_VERSION);
    if (!chiThem) thongBao_('Đã áp dụng quyền', tomTat + (kq.loiBo ? '\n\nCó ' + kq.loiBo + ' dòng dữ liệu lỗi bị bỏ qua (xem "Xem trước thay đổi quyền").' : ''));
  } catch (err) {
    try { ghiCauHinh(ssA, KHOA_CAU_HINH_KET_QUA, bayGio() + ' · LỖI: ' + (err.message || err)); } catch (e2) { /* bỏ qua */ }
    throw err;
  } finally {
    khoa.releaseLock();
  }
}

/** Thêm/gỡ người trên một file. chiThem: bỏ qua gỡ và hạ cấp. Không bao giờ gỡ chủ file. */
function apDungFile_(file, so, chiThem, kq) {
  so.themEditors.forEach(function (e) { file.addEditor(e); kq.them++; });
  so.themViewers.forEach(function (e) { file.addViewer(e); kq.them++; });
  if (chiThem) return;
  so.haCap.forEach(function (e) { file.removeEditor(e); file.addViewer(e); kq.go++; });
  so.go.forEach(function (e) {
    try { file.removeEditor(e); } catch (x) { /* không phải editor */ }
    try { file.removeViewer(e); } catch (x) { /* không phải viewer */ }
    kq.go++;
  });
}

/** Khóa tab trong ⓑ. Phải chạy SAU khi chia sẻ file (người được sửa tab cần có quyền với file). */
function apDungTabB_(ssA, kh, tab, chiThem, kq) {
  var ssB = SpreadsheetApp.openById(kh.id.B);
  var quanTri = kh.ke.quanTri;
  var theoLop = {};
  tab.forEach(function (t) { theoLop[t.class_id] = t; });
  var zoomRole = {};
  try {
    docBang(ssA, 'vai_tro').forEach(function (r) {
      if (String(r.nguon).trim() === 'ZOOM_REPORT') zoomRole[String(r.role_id).trim()] = true;
    });
  } catch (e) { /* không có vai_tro: bỏ qua */ }

  var da = daLuuTab_();
  ssB.getSheets().forEach(function (sh) {
    var ten = sh.getName();
    if (TAB_CHI_QUAN_TRI.indexOf(ten) >= 0 || ten.indexOf('_dm_') === 0 || ten.indexOf('_MAU') === 0) {
      baoVeTabLop(sh, [], quanTri, []);
      return;
    }
    var classId = String(sh.getRange(TAB_LOP.O_CLASS_ID).getValue() || '').trim();
    var t = classId && theoLop[classId];
    if (!t) return; // không phải tab lớp có trong ⓐ: không đụng
    var vung = ['A1:' + chiSoCotThanhChu(Math.max(26, sh.getLastColumn())) + TAB_LOP.DONG_TIEU_DE];
    var lastCol = sh.getLastColumn();
    if (lastCol > 0) {
      var khoaCot = sh.getRange(TAB_LOP.DONG_KHOA, 1, 1, lastCol).getValues()[0];
      khoaCot.forEach(function (k, i) {
        k = String(k).trim();
        var tuDong = k === 'buoi_so' || k === 'thu' || (k.indexOf('role:') === 0 && zoomRole[k.slice(5)]);
        if (!tuDong) return;
        var c = chiSoCotThanhChu(i + 1);
        vung.push(c + TAB_LOP.DONG_DAU + ':' + c + sh.getMaxRows());
      });
    }
    var moi = { e: t.editors, v: vung.join('|') };
    var truoc = da[classId] ? { e: da[classId].e, v: da[classId].v } : null;
    var hanhDong = tabCanCapNhat(truoc, moi, chiThem);
    if (!chiThem) hanhDong = 'AP_DUNG'; // chạy tay: áp lại tất cả
    if (hanhDong === 'KHONG_DOI') { kq.tabBoQua++; return; }
    if (hanhDong === 'CAN_TAY') { kq.tabCanTay++; return; }
    baoVeTabLop(sh, t.editors, quanTri, vung);
    da[classId] = moi;
    kq.tabKhoa++;
  });
  PropertiesService.getScriptProperties().setProperty(KHOA_PROP_TAB, JSON.stringify(da));
}

/** Tạo trigger mỗi giờ gọi apDungQuyenTuDong (xóa trigger cũ cùng tên trước). */
function caiDatTuDong() {
  chayAnToan_('Cài đặt chạy tự động', function () {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === 'apDungQuyenTuDong') ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger('apDungQuyenTuDong').timeBased().everyHours(1).create();
    thongBao_('Đã cài đặt', 'Mỗi giờ hệ thống tự THÊM quyền theo tab quyen và lop. Việc GỠ quyền chỉ chạy khi bạn bấm "Áp dụng quyền".');
  });
}
