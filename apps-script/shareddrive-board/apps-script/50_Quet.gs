/**
 * MLWIT · SHARED DRIVE BOARD v2 · 50_QUET (Đợt 3)
 * Quét & dọn dẹp (chỉ đọc Drive, ghi báo cáo) + Thu ổ người nghỉ (ngoại lệ duy nhất được xóa).
 * Lệnh menu: sdQuet, sdQuetTiep, sdMoBaoCao, sdThuOXemTruoc, sdThuOApDung, sdGoChiaSeDanhDau.
 * Dịch vụ nâng cao cần bật: Drive (v3). Không cần AdminDirectory ở tệp này.
 *
 * Giả định (hợp đồng thiếu/mâu thuẫn, đã chọn hợp lý):
 *  1. Dữ liệu quét tạm lưu ở tab `_TAM`, `_TAM_CK`, `_TAM_O` NGAY TRONG tệp báo cáo (PropertiesService chỉ giữ con trỏ nhỏ);
 *     xong thì xóa nội dung các tab tạm. Tổng hợp đọc cả `_TAM` vào bộ nhớ (ổn tới vài trăm nghìn tệp).
 *  2. ID ổ Quản trị = cột ID của dòng CAU_TRUC mã `O_QT`; thư mục QT_BC / QT_SL: cột ID của dòng đó nếu có,
 *     không thì tìm bằng nhãn `properties` (công khai) sdma; không thấy → thử nhãn appProperties cũ; không thấy →
 *     nhận lại theo tên + cha (rồi gắn nhãn properties). Thiếu hẳn → báo lỗi "chạy Drive › Áp dụng trước".
 *     (Đợt 2b: appProperties chỉ dự án Apps Script đã gắn mới đọc được → bản sao bảng không thấy nhãn cũ.)
 *  3. "Ổ Tri thức – Raw" = dòng CAU_TRUC Loại "Ổ" có Mã chứa "RAW" (vd O_RAW) và đã có ID.
 *  4. Ổ gốc = ID khớp dòng Loại "Ổ" (trừ CN_TEN); ổ cá nhân = ID khớp NGUOI "ID ổ"; còn lại "Ngoài hệ thống".
 *  5. `sdma` hợp lệ nếu có trong CAU_TRUC, hoặc là mã đó cộng hậu tố `_NHANH` / `_SUB` (do 30_Drive gắn).
 *  6. Thu ổ (Đợt 2b): cứu MỌI tệp/thư mục (trừ lối tắt nhãn sdlt) bằng cách chuyển TỆP và dựng lại cấu trúc thư mục ở đích
 *     (Drive có thể chặn chuyển thư mục giữa hai ổ). Đích: `HS_NG/00_TAI-LIEU-CUA-TOI/Từ ổ cá nhân dd-MM-yyyy` (HS_TL tìm theo
 *     nhãn sdma='HS_TL' hoặc tên trong HS_NG của người); không có HS_NG hoặc không có HS_TL → `QT_SL/<tên ổ>`.
 *     Thư mục tạo ở đích gắn `sdluu`='1' (properties). Thư mục RỖNG có nhãn sdma (khuôn do script dựng) không dựng lại;
 *     thư mục rỗng khác thì dựng lại. Tệp trong thùng rác không cứu (mất theo ổ). 90_CA-NHAN cũ xử lý như thư mục thường.
 *  7. Nếu việc chuyển tệp có lỗi hoặc sau khi chuyển còn tệp trong ổ thì KHÔNG xóa ổ của người đó (an toàn); chạy lại sẽ làm tiếp.
 *     Thu ổ hết giờ thì dừng và báo "chạy lại" (không tự hẹn), vì cần xác nhận của admin.
 *  8. Từ chối thu ổ có ID trùng ổ gốc ở CAU_TRUC (chốt an toàn).
 *  9. CHIA_SE_LA (mục 6 đặc tả 2b): chỉ quét các ổ GỐC (Loại Ổ có ID). Quyền "trực tiếp" = permissionDetails có ít nhất một
 *     mục inherited=false (không có permissionDetails → coi là trực tiếp). "Do script cấp" = nhóm có tiền tố CAI_DAT, hoặc
 *     email admin; mọi thứ khác (user, nhóm khác, domain, anyone) là lạ. Lượt quét sau GHI ĐÈ tab, không giữ dấu tích Gỡ
 *     (quyền đã gỡ thì dòng biến mất; quyền chưa gỡ phải tích lại). Cột cuối "Kết quả" do sdGoChiaSeDanhDau ghi.
 */

var QT_HAN_MS = 270000;     // dừng an toàn sau ~4,5 phút
var QT_TRANG = 1000;        // số tệp mỗi trang
var QT_NGAY_CU = 365;
var QT_BYTE_LON = 100 * 1024 * 1024;
var QT_MIME_TM = 'application/vnd.google-apps.folder';
var QT_MIME_LT = 'application/vnd.google-apps.shortcut';
var QT_MIME_BANG = 'application/vnd.google-apps.spreadsheet';
var QT_KHOA = 'SD_QUET';
var QT_T0 = 0;
var QT_TRUONG = 'nextPageToken, files(id,name,mimeType,parents,size,quotaBytesUsed,modifiedTime,appProperties,properties)';
var QT_TRUONG_Q = 'nextPageToken, files(id,name,mimeType,parents,permissions(id,type,emailAddress,domain,role,permissionDetails))';
var QT_TEN_TL = '00_TAI-LIEU-CUA-TOI';
var QT_TAB_LA = 'CHIA_SE_LA';
var QT_COT_LA = ['Ổ', 'Đường dẫn', 'Tên', 'Link', 'Loại quyền', 'Người/nhóm', 'Vai trò', 'Gỡ', 'ID tệp', 'ID quyền', 'Kết quả'];
var QT_COT_TAM = ['o', 'id', 'ten', 'mime', 'cha', 'size', 'quota', 'sua', 'sdma', 'sdlt'];

/* ---------- Lệnh menu ---------- */

function sdQuet() { chayPhien_('Quét & dọn dẹp', function () { qtQuet_(false); }); }
function sdQuetTiep() { chayPhien_('Quét & dọn dẹp (tiếp)', function () { qtQuet_(true); }, 'sdQuetTiep'); }
function sdMoBaoCao() { chayPhien_('Mở báo cáo', qtMoBaoCao_); }
function sdThuOXemTruoc() { chayPhien_('Thu ổ người nghỉ · Xem trước', function () { P.thu = true; qtThuO_(); }); }
function sdThuOApDung() {
  chayPhien_('Thu ổ người nghỉ · Áp dụng', function () {
    P.thu = false;
    var C = taiDuLieu_(), ds = qtDsThu_(C);
    if (!ds.length) { ghi_('Thu ổ', 'Không có ổ nào cần thu', ''); P.tomTat = 'Không có ổ nào cần thu.'; return; }
    var msg = 'Sẽ XÓA VĨNH VIỄN ' + ds.length + ' ổ cá nhân của người đã Nghỉ (khi nghỉ = Thu ổ):\n' +
      ds.map(function (n) { return '- ' + n.ten + ' (' + n.email + ')'; }).join('\n') +
      '\n\nMọi tệp/thư mục trong ổ (trừ lối tắt hệ thống) được chuyển sang Hồ sơ học tập (00_TAI-LIEU-CUA-TOI) hoặc QT_SL trước; lỗi chuyển thì giữ ổ. Tiếp tục?';
    if (!qtXacNhan_(msg)) { ghi_('Thu ổ', 'Admin không xác nhận, không làm gì', ''); P.tomTat = 'Đã hủy.'; return; }
    qtThuO_(C);
  });
}

function qtXacNhan_(noiDung, tieuDe) {
  var ui = SpreadsheetApp.getUi();
  return ui.alert(tieuDe || 'Thu ổ người nghỉ', noiDung, ui.ButtonSet.YES_NO) === ui.Button.YES;
}

/** Gỡ các quyền ở tab CHIA_SE_LA đã tích cột "Gỡ". Dòng không tích: không đụng. Ghi kết quả từng dòng. */
function sdGoChiaSeDanhDau() {
  chayPhien_('Gỡ chia sẻ đã đánh dấu', function () {
    var C = taiDuLieu_(), b = qtTimBaoCao_(C, false);
    if (!b) { P.tomTat = 'Chưa có báo cáo. Chạy Quét & dọn dẹp trước.'; ghi_('Gỡ chia sẻ', 'Chưa có báo cáo', ''); return; }
    var tab = SpreadsheetApp.openById(b.id).getSheetByName(QT_TAB_LA);
    if (!tab) { P.tomTat = 'Báo cáo chưa có tab ' + QT_TAB_LA + '. Chạy Quét & dọn dẹp trước.'; ghi_('Gỡ chia sẻ', 'Chưa có tab', QT_TAB_LA); return; }
    var v = tab.getDataRange().getValues(), td = (v[0] || []).map(chuan_), cG = td.indexOf('Gỡ'), cF = td.indexOf('ID tệp'),
      cP = td.indexOf('ID quyền'), cK = td.indexOf('Kết quả'), cN = td.indexOf('Người/nhóm'), cT = td.indexOf('Tên'), ds = [];
    if (cG < 0 || cF < 0 || cP < 0) throw new Error('Tab ' + QT_TAB_LA + ' thiếu cột Gỡ / ID tệp / ID quyền');
    if (cK < 0) cK = td.length;
    for (var i = 1; i < v.length; i++) {
      if (qtDaTich_(v[i][cG]) && chuan_(v[i][cF]) && chuan_(v[i][cP])) ds.push({ dong: i + 1, tep: chuan_(v[i][cF]), quyen: chuan_(v[i][cP]), ten: v[i][cT], ai: v[i][cN] });
    }
    if (!ds.length) { P.tomTat = 'Không có dòng nào được tích Gỡ.'; ghi_('Gỡ chia sẻ', 'Không có dòng tích', ''); return; }
    var msg = 'Sẽ GỠ ' + ds.length + ' quyền chia sẻ đã tích:\n' + ds.slice(0, 15).map(function (d) { return '- ' + d.ai + ' ← ' + d.ten; }).join('\n') +
      (ds.length > 15 ? '\n… và ' + (ds.length - 15) + ' dòng nữa' : '') + '\n\nTiếp tục?';
    if (!qtXacNhan_(msg, 'Gỡ chia sẻ lạ')) { ghi_('Gỡ chia sẻ', 'Admin không xác nhận, không làm gì', ''); P.tomTat = 'Đã hủy.'; return; }
    var ok = 0, hom = homNay_();
    ds.forEach(function (d) {
      var kq;
      try {
        Drive.Permissions.remove(d.tep, d.quyen, { supportsAllDrives: true });
        kq = 'đã gỡ ' + hom; ok++;
        ghi_('Gỡ chia sẻ', 'Đã gỡ ' + d.ai, d.ten);
      } catch (e) { kq = 'LỖI: ' + e.message; ghi_('LỖI', 'Gỡ chia sẻ ' + d.ai + ' ← ' + d.ten, e.message); }
      tab.getRange(d.dong, cK + 1).setValue(kq);
    });
    P.tomTat = 'Đã gỡ ' + ok + '/' + ds.length + ' quyền.';
  });
}

function qtDaTich_(g) {
  if (g === true) return true;
  return ['TRUE', 'X', '✓', '✔', 'CÓ'].indexOf(chuan_(g).toUpperCase()) >= 0;
}

/* ---------- Tìm ổ / thư mục quản trị ---------- */

function qtIdOQuanTri_(C) {
  var d = dongCauTruc_(C, 'O_QT');
  if (!d || !d.id) throw new Error('CAU_TRUC chưa có ID cho ổ Quản trị (dòng O_QT). Chạy Drive › Áp dụng trước.');
  return d.id;
}

function qtLietKe_(opts) {
  var kq = [], tok = null;
  do {
    var o = Object.assign({ includeItemsFromAllDrives: true, supportsAllDrives: true, pageSize: 100, fields: QT_TRUONG }, opts);
    if (tok) o.pageToken = tok;
    var r = Drive.Files.list(o);
    kq = kq.concat(r.files || []);
    tok = r.nextPageToken || null;
  } while (tok);
  return kq;
}

/** Nhãn của một mục: properties (công khai) đè lên appProperties cũ (nếu đọc được). */
function qtNhan_(f) {
  var o = {}, a = f.appProperties || {}, p = f.properties || {};
  Object.keys(a).forEach(function (k) { o[k] = a[k]; });
  Object.keys(p).forEach(function (k) { o[k] = p[k]; });
  return o;
}

function qtQNhan_(loai, k, v) { return loai + " has { key='" + k + "' and value='" + String(v).replace(/'/g, "\\'") + "' }"; }

/** Tìm theo nhãn: properties trước; không có → appProperties cũ. qExtra: điều kiện thêm (không gồm trashed). */
function qtTimNhan_(opts, k, v, qExtra) {
  var tail = (qExtra ? ' and ' + qExtra : '') + ' and trashed=false', kq = [];
  ['properties', 'appProperties'].forEach(function (loai) {
    if (kq.length) return;
    var o = Object.assign({}, opts); o.q = qtQNhan_(loai, k, v) + tail;
    try { kq = qtLietKe_(o); } catch (e) { kq = []; }
  });
  return kq;
}

/** Gắn nhãn properties (công khai) cho một mục. Lỗi chỉ ghi nhật ký. */
function qtGanNhan_(id, props, ten) {
  try { Drive.Files.update({ properties: props }, id, null, { supportsAllDrives: true }); ghi_('Quét', 'Gắn nhãn (nhận lại theo tên)', ten || id); }
  catch (e) { ghi_('LỖI', 'Không gắn được nhãn ' + (ten || id), e.message); }
}

function qtTenCuoi_(duong) { var p = String(duong || '').split('/'); return chuan_(p[p.length - 1]); }

/** Tìm thư mục theo tên (+ cha nếu biết) trong một ổ; đúng một kết quả mới nhận. */
function qtTimTheoTen_(driveId, ten, cha) {
  if (!ten) return null;
  var q = "name = '" + ten.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "' and mimeType = '" + QT_MIME_TM + "' and trashed=false" + (cha ? " and '" + cha + "' in parents" : '');
  var ds = qtLietKe_({ corpora: 'drive', driveId: driveId, q: q });
  return ds.length === 1 ? ds[0] : null;
}

function qtThuMucQT_(C, ma) {
  var d = dongCauTruc_(C, ma);
  if (d && d.id) return d.id;
  var oQt = qtIdOQuanTri_(C), opts = { corpora: 'drive', driveId: oQt };
  var f = qtTimNhan_(opts, 'sdma', ma)[0];
  if (!f && d) {
    var seg = String(d.duong || '').split('/').filter(chuan_);
    f = qtTimTheoTen_(oQt, qtTenCuoi_(d.duong), seg.length === 1 ? oQt : null);
    if (f) qtGanNhan_(f.id, { sdma: ma }, f.name);
  }
  if (!f) throw new Error('Chưa có thư mục ' + ma + ' ở ổ Quản trị. Chạy Drive › Áp dụng trước.');
  return f.id;
}

/** Tìm (hoặc tạo, nếu tao) tệp báo cáo. Trả { id } hoặc null. */
function qtTimBaoCao_(C, tao) {
  var bc = qtThuMucQT_(C, 'QT_BC'), oQt = qtIdOQuanTri_(C);
  var f = qtTimNhan_({ corpora: 'drive', driveId: oQt }, 'sdbaocao', '1', "'" + bc + "' in parents")[0];
  if (!f) {
    f = qtLietKe_({ corpora: 'drive', driveId: oQt, q: "'" + bc + "' in parents and name = 'SD · Báo cáo' and mimeType = '" + QT_MIME_BANG + "' and trashed=false" })[0];
    if (f) qtGanNhan_(f.id, { sdbaocao: '1' }, f.name);
  }
  if (f) return { id: f.id };
  if (!tao) return null;
  var m = Drive.Files.create({ name: 'SD · Báo cáo', mimeType: QT_MIME_BANG, parents: [bc], properties: { sdbaocao: '1' } },
    null, { supportsAllDrives: true });
  ghi_('Quét', 'Tạo tệp báo cáo', m.id);
  return { id: m.id };
}

function qtLinkBang_(id) { return 'https://docs.google.com/spreadsheets/d/' + id + '/edit'; }
function qtLinkThuMuc_(id) { return 'https://drive.google.com/drive/folders/' + id; }

function qtGhiLinkBaoCao_(id) {
  var tab = P.ss.getSheetByName(TAB.CAI_DAT), v = tab.getDataRange().getValues(), link = qtLinkBang_(id);
  for (var i = 0; i < v.length; i++) {
    if (chuan_(v[i][0]) === 'Link báo cáo') { tab.getRange(i + 1, 2).setValue(link); return; }
  }
  tab.appendRow(['Link báo cáo', link]);
}

function qtMoBaoCao_() {
  var C = taiDuLieu_(), b = qtTimBaoCao_(C, false);
  if (!b) { P.tomTat = 'Chưa có báo cáo. Chạy Quét & dọn dẹp trước.'; ghi_('Báo cáo', 'Chưa có', ''); return; }
  var link = qtLinkBang_(b.id);
  qtGhiLinkBaoCao_(b.id);
  ghi_('Báo cáo', 'Link', link);
  P.tomTat = 'Link báo cáo: ' + link;
  try {
    var html = HtmlService.createHtmlOutput('<p><a href="' + link + '" target="_blank">Mở báo cáo SD · Báo cáo</a></p>').setWidth(320).setHeight(90);
    SpreadsheetApp.getUi().showModalDialog(html, 'Báo cáo Shared Drive');
  } catch (e) { /* chỉ dùng toast và CAI_DAT */ }
}

/* ---------- Trình kích hoạt ---------- */

function qtXoaHen_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sdQuetTiep') ScriptApp.deleteTrigger(t); });
}
function qtHenTiep_() { qtXoaHen_(); ScriptApp.newTrigger('sdQuetTiep').timeBased().after(60000).create(); }
function qtHetGio_() { return Date.now() - QT_T0 >= QT_HAN_MS; }

/* ---------- Quét ---------- */

function qtTab_(ss, ten) { return ss.getSheetByName(ten) || ss.insertSheet(ten); }

function qtDamBaoDong_(tab, can) {
  if (tab.getMaxRows && tab.getMaxRows() < can) tab.insertRowsAfter(tab.getMaxRows(), can - tab.getMaxRows());
}

function qtNoiThem_(ss, ten, dong) {
  if (!dong.length) return;
  var tab = qtTab_(ss, ten), r = tab.getLastRow() + 1;
  qtDamBaoDong_(tab, r + dong.length);
  tab.getRange(r, 1, dong.length, dong[0].length).setValues(dong);
}

function qtDocTam_(ss, ten) {
  var tab = ss.getSheetByName(ten);
  return tab ? tab.getDataRange().getValues().slice(1).filter(function (r) { return String(r[0]) !== ''; }) : [];
}

function qtGhiDe_(ss, ten, tieuDe, dong) {
  var tab = qtTab_(ss, ten);
  tab.clear();
  var tat = [tieuDe].concat(dong);
  for (var i = 0; i < tat.length; i += 5000) {
    var khoi = tat.slice(i, i + 5000);
    qtDamBaoDong_(tab, i + khoi.length);
    tab.getRange(i + 1, 1, khoi.length, tieuDe.length).setValues(khoi);
  }
}

function qtXoaTam_(ss) {
  ['_TAM', '_TAM_CK', '_TAM_O', '_TAM_Q'].forEach(function (t) {
    var tab = ss.getSheetByName(t);
    if (tab) { tab.clear(); try { tab.hideSheet(); } catch (e) { /* bỏ qua */ } }
  });
}

/** Phân loại ổ theo cấu hình. */
function qtLoaiO_(C, id) {
  var i;
  for (i = 0; i < C.cauTruc.length; i++) if (C.cauTruc[i].loai === 'Ổ' && C.cauTruc[i].ma !== 'CN_TEN' && C.cauTruc[i].id === id) return 'Ổ gốc';
  for (i = 0; i < C.dsNguoi.length; i++) if (C.dsNguoi[i].idO && C.dsNguoi[i].idO === id) return 'Ổ cá nhân';
  return 'Ngoài hệ thống';
}

function qtDsO_(C) {
  var ds = [], tok = null;
  do {
    var o = { useDomainAdminAccess: true, pageSize: 100 };
    if (tok) o.pageToken = tok;
    var r = Drive.Drives.list(o);
    (r.drives || []).forEach(function (d) { ds.push([d.id, d.name, qtLoaiO_(C, d.id), '']); });
    tok = r.nextPageToken || null;
  } while (tok);
  ds.push(['root', 'Drive của admin', 'Drive của admin', 'Có']);
  return ds;
}

function qtDocCon_() {
  var s = PropertiesService.getScriptProperties().getProperty(QT_KHOA);
  try { return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
function qtLuuCon_(tt) { PropertiesService.getScriptProperties().setProperty(QT_KHOA, JSON.stringify(tt)); }

function qtQuet_(tiep) {
  QT_T0 = Date.now();
  var C = taiDuLieu_(), props = PropertiesService.getScriptProperties();
  var tt = qtDocCon_();
  if (tiep) {
    if (!tt) { ghi_('Quét', 'Không có lượt quét đang dở', ''); P.tomTat = 'Không có lượt quét đang dở.'; qtXoaHen_(); return; }
    if (Date.now() - tt.batDau > 2 * 3600 * 1000) { ghi_('Quét', 'Lượt cũ quá 2 giờ, quét lại từ đầu', ''); tt = null; }
  } else { tt = null; qtXoaHen_(); }

  var bc = tt ? { id: tt.bc } : qtTimBaoCao_(C, true), ss = SpreadsheetApp.openById(bc.id), dsO;
  if (!tt) {
    dsO = qtDsO_(C);
    qtGhiDe_(ss, '_TAM', QT_COT_TAM, []);
    qtGhiDe_(ss, '_TAM_CK', QT_COT_TAM, []);
    qtGhiDe_(ss, '_TAM_Q', ['o', 'id', 'ten', 'mime', 'cha', 'loai', 'nguoi', 'vaiTro', 'idQuyen'], []);
    qtGhiDe_(ss, '_TAM_O', ['id', 'ten', 'loai', 'myDrive'], dsO);
    tt = { pha: 'quet', i: 0, token: null, batDau: Date.now(), bc: bc.id, trang: 0 };
  } else {
    dsO = qtDocTam_(ss, '_TAM_O');
  }

  while (tt.i < dsO.length) {
    var o = dsO[tt.i], myDrive = o[3] === 'Có';
    var dieuKien = tt.pha === 'congkhai' ? "trashed = false and (visibility = 'anyoneWithLink' or visibility = 'anyoneCanFind')" : 'trashed = false';
    var opts = { pageSize: tt.pha === 'quyen' ? Math.min(QT_TRANG, 100) : QT_TRANG, fields: tt.pha === 'quyen' ? QT_TRUONG_Q : QT_TRUONG,
      supportsAllDrives: true, includeItemsFromAllDrives: true };
    if (myDrive) { opts.corpora = 'user'; opts.q = "'me' in owners and " + dieuKien; }
    else { opts.corpora = 'drive'; opts.driveId = o[0]; opts.q = dieuKien; }
    if (tt.token) opts.pageToken = tt.token;
    var r = Drive.Files.list(opts);
    if (tt.pha === 'quyen') {
      var dq = [];
      (r.files || []).forEach(function (f) {
        (f.permissions || []).forEach(function (p) {
          if (!qtQuyenLa_(C, p)) return;
          dq.push([o[0], f.id, f.name, f.mimeType, (f.parents || [''])[0], p.type || '', p.emailAddress || p.domain || (p.type === 'anyone' ? 'Bất kỳ ai' : p.id), p.role || '', p.id]);
        });
      });
      qtNoiThem_(ss, '_TAM_Q', dq);
    } else {
      qtNoiThem_(ss, tt.pha === 'quet' ? '_TAM' : '_TAM_CK', (r.files || []).map(function (f) {
        var ap = qtNhan_(f);
        return [o[0], f.id, f.name, f.mimeType, (f.parents || [''])[0], Number(f.size || 0), Number(f.quotaBytesUsed || f.size || 0),
          f.modifiedTime || '', ap.sdma || '', ap.sdlt || ''];
      }));
    }
    tt.trang++;
    tt.token = r.nextPageToken || null;
    if (!tt.token) {
      if (tt.pha === 'quet') tt.pha = 'congkhai';
      else if (tt.pha === 'congkhai' && o[2] === 'Ổ gốc') tt.pha = 'quyen';
      else { tt.pha = 'quet'; tt.i++; }
    }
    if (tt.i < dsO.length && qtHetGio_()) {
      qtLuuCon_(tt); qtHenTiep_();
      ghi_('Quét', 'Chưa xong, sẽ chạy tiếp sau 1 phút', 'ổ ' + (tt.i + 1) + '/' + dsO.length + ', ' + tt.trang + ' trang');
      P.tomTat = 'Chưa xong (ổ ' + (tt.i + 1) + '/' + dsO.length + '), tự chạy tiếp sau 1 phút.';
      return;
    }
  }

  qtTongHop_(C, ss, dsO);
  props.deleteProperty(QT_KHOA);
  qtXoaHen_();
  qtGhiLinkBaoCao_(bc.id);
  ghi_('Quét', 'Hoàn tất, đã ghi báo cáo', qtLinkBang_(bc.id));
  P.tomTat = 'Báo cáo: ' + qtLinkBang_(bc.id);
}

/* ---------- Chia sẻ lạ ---------- */

/** Quyền không kế thừa (có ít nhất một permissionDetails inherited=false; không có chi tiết → coi là trực tiếp). */
function qtQuyenTrucTiep_(p) {
  var d = p.permissionDetails;
  if (!d || !d.length) return true;
  return d.some(function (x) { return x.inherited !== true; });
}

/** Quyền "lạ": trực tiếp và không do script cấp (nhóm tiền tố CAI_DAT, hoặc admin). */
function qtQuyenLa_(C, p) {
  if (p.deleted || !qtQuyenTrucTiep_(p)) return false;
  var e = email_(p.emailAddress || '');
  if (p.type === 'group' && e.indexOf(C.cd.tienTo) === 0) return false;
  if (p.type === 'user' && e && e === C.cd.admin) return false;
  return true;
}

/* ---------- Tổng hợp ---------- */

function qtMb_(b) { return Math.round(b / 1048576 * 100) / 100; }

function qtTongHop_(C, ss, dsO) {
  var tam = qtDocTam_(ss, '_TAM').map(function (r) {
    return { o: r[0], id: r[1], ten: r[2], mime: r[3], cha: r[4], size: Number(r[5]) || 0, quota: Number(r[6]) || 0, sua: r[7], sdma: r[8], sdlt: r[9] };
  });
  var ck = qtDocTam_(ss, '_TAM_CK'), quyenLa = [], theoQ = {};
  qtDocTam_(ss, '_TAM_Q').forEach(function (r) { (theoQ[r[0]] = theoQ[r[0]] || []).push(r); });
  var thoiDiem = bayGio_(), now = Date.now();
  var maHopLe = {};
  C.cauTruc.forEach(function (d) { maHopLe[d.ma] = true; });
  var tomTat = [], cay = [], donDep = [], canChuY = [];

  var raw = {};
  C.cauTruc.forEach(function (d) { if (d.loai === 'Ổ' && d.ma !== 'CN_TEN' && d.id && /RAW/i.test(d.ma)) raw[d.id] = true; });

  var theoO = {};
  tam.forEach(function (t) { (theoO[t.o] = theoO[t.o] || []).push(t); });

  dsO.forEach(function (o) {
    var id = o[0], ten = o[1], loai = o[2], ds = theoO[id] || [];
    var map = {}, con = {}, goc = [];
    ds.forEach(function (t) { map[t.id] = t; });
    ds.forEach(function (t) { if (map[t.cha]) (con[t.cha] = con[t.cha] || []).push(t); else goc.push(t); });
    var duongDan = function (t) {
      var p = [], x = t, dem = 0;
      while (x && dem++ < 100) { p.unshift(x.ten); x = map[x.cha]; }
      return ten + '/' + p.join('/');
    };
    var link = function (t) { return t.mime === QT_MIME_TM ? qtLinkThuMuc_(t.id) : 'https://drive.google.com/open?id=' + t.id; };

    var soTep = 0, soTm = 0, dl = 0, sua = '';
    ds.forEach(function (t) {
      if (t.mime === QT_MIME_TM) soTm++; else { soTep++; dl += t.quota; }
      if (t.sua && String(t.sua) > sua) sua = String(t.sua);
    });
    tomTat.push([thoiDiem, ten, loai, soTep, soTm, dl, qtMb_(dl), sua, id === 'root' ? 'https://drive.google.com/drive/my-drive' : qtLinkThuMuc_(id)]);

    // Tổng từng thư mục (đệ quy)
    var tong = {};
    var tinh = function (t) {
      if (tong[t.id]) return tong[t.id];
      var s = { tep: 0, dl: 0 };
      (con[t.id] || []).forEach(function (k) {
        if (k.mime === QT_MIME_TM) { var x = tinh(k); s.tep += x.tep; s.dl += x.dl; } else { s.tep++; s.dl += k.quota; }
      });
      return (tong[t.id] = s);
    };
    var sapXep = function (a) { return a.slice().sort(function (x, y) { return x.ten < y.ten ? -1 : x.ten > y.ten ? 1 : 0; }); };
    cay.push([ten, ten, soTep, qtMb_(dl), 0]);
    var duyet = function (t, sau) {
      var x = tinh(t);
      cay.push([ten, new Array(sau + 1).join('  ') + t.ten, x.tep, qtMb_(x.dl), sau]);
      if (sau < 3) sapXep((con[t.id] || []).filter(function (k) { return k.mime === QT_MIME_TM; })).forEach(function (k) { duyet(k, sau + 1); });
    };
    sapXep(goc.filter(function (t) { return t.mime === QT_MIME_TM; })).forEach(function (t) { duyet(t, 1); });

    // DON_DEP
    var trung = {};
    ds.forEach(function (t) {
      if (t.mime !== QT_MIME_TM && t.mime !== QT_MIME_LT) {
        if (t.size > QT_BYTE_LON) donDep.push(['Tệp lớn > 100 MB', ten, duongDan(t), t.ten, qtMb_(t.size) + ' MB', link(t)]);
        var ms = t.sua ? new Date(t.sua).getTime() : NaN;
        if (!isNaN(ms) && now - ms > QT_NGAY_CU * 86400000) {
          donDep.push(['Tệp không sửa > 365 ngày', ten, duongDan(t), t.ten, 'Sửa lần cuối ' + String(t.sua).slice(0, 10), link(t)]);
        }
      }
      if (t.mime === QT_MIME_TM && !(con[t.id] || []).length) {
        donDep.push(['Thư mục rỗng', ten, duongDan(t), t.ten, t.sdma ? 'Do hệ thống tạo (sdma ' + t.sdma + ')' : '', link(t)]);
      }
      var k = t.cha + '\u0001' + t.ten;
      (trung[k] = trung[k] || []).push(t);
      if (t.sdma && !maHopLe[t.sdma] && !maHopLe[t.sdma.replace(/_(NHANH|SUB)$/, '')]) {
        donDep.push(['Mã sdma ngoài cấu hình', ten, duongDan(t), t.ten, 'sdma = ' + t.sdma, link(t)]);
      }
      if (raw[id] && t.mime.indexOf('audio/') === 0 || raw[id] && t.mime.indexOf('video/') === 0) {
        canChuY.push(['Audio/video trong ổ Raw', ten, duongDan(t), t.ten, t.mime + ', ' + qtMb_(t.quota) + ' MB', link(t)]);
      }
    });
    Object.keys(trung).forEach(function (k) {
      var g = trung[k];
      if (g.length > 1) donDep.push(['Trùng tên trong cùng thư mục', ten, duongDan(g[0]), g[0].ten, g.length + ' bản', link(g[0])]);
    });
    (theoQ[id] || []).forEach(function (q) {
      var t = map[q[1]], gia = { id: q[1], ten: q[2], mime: q[3] };
      quyenLa.push([ten, t ? duongDan(t) : ten + '/' + q[2], q[2], link(t || gia), q[5], q[6], q[7], '', q[1], q[8], '']);
    });
    if (loai === 'Ngoài hệ thống') canChuY.push(['Ổ ngoài hệ thống', ten, '', ten, 'Không có trong CAU_TRUC / NGUOI', qtLinkThuMuc_(id)]);
  });

  ck.forEach(function (r) {
    var oTen = '';
    dsO.forEach(function (o) { if (o[0] === r[0]) oTen = o[1]; });
    canChuY.push(['Chia sẻ công khai (bất kỳ ai có link)', oTen, '', r[2], r[3], 'https://drive.google.com/open?id=' + r[1]]);
  });

  C.dsNguoi.forEach(function (n) {
    if (n.tt === 'Nghỉ' && n.idO) {
      var kn = khiNghi_(C, n);
      donDep.push(['Ổ cá nhân của người Nghỉ', n.ten, n.email, n.idO, kn === 'Thu ổ' ? 'Gợi ý: dùng "Thu ổ người nghỉ"' : 'Giữ ổ: chỉ liệt kê, không thu', qtLinkThuMuc_(n.idO)]);
    }
  });

  var tdDon = ['Gợi ý', 'Ổ', 'Đường dẫn', 'Tên', 'Chi tiết', 'Link'];
  qtGhiDe_(ss, 'TOM_TAT', ['Thời điểm quét', 'Ổ', 'Loại', 'Số tệp', 'Số thư mục', 'Dung lượng (byte)', 'Dung lượng (MB)', 'Sửa gần nhất', 'Link'], tomTat);
  qtGhiDe_(ss, 'CAY', ['Ổ', 'Thư mục', 'Số tệp', 'Dung lượng (MB)', 'Cấp'], cay);
  qtGhiDe_(ss, 'DON_DEP', tdDon, donDep);
  qtGhiDe_(ss, 'CAN_CHU_Y', ['Vấn đề', 'Ổ', 'Đường dẫn', 'Tên', 'Chi tiết', 'Link'], canChuY);
  qtGhiDe_(ss, QT_TAB_LA, QT_COT_LA, quyenLa);
  if (quyenLa.length) { try { qtTab_(ss, QT_TAB_LA).getRange(2, QT_COT_LA.indexOf('Gỡ') + 1, quyenLa.length, 1).insertCheckboxes(); } catch (e) { /* không có checkbox thì ô trống vẫn dùng được */ } }
  qtXoaTam_(ss);
  ghi_('Quét', 'Tổng hợp', tomTat.length + ' ổ · ' + donDep.length + ' gợi ý dọn · ' + canChuY.length + ' cần chú ý · ' + quyenLa.length + ' chia sẻ lạ');
}

/* ---------- Thu ổ người nghỉ ---------- */

function qtDsThu_(C) {
  return C.dsNguoi.filter(function (n) { return n.tt === 'Nghỉ' && n.idO && khiNghi_(C, n) === 'Thu ổ'; });
}

function qtOGocCua_(C, dongCt) {
  var oGoc = null;
  C.cauTruc.forEach(function (x) { if (x.loai === 'Ổ' && x.o === dongCt.o && x.id) oGoc = x; });
  return oGoc;
}

/** Thư mục HS_NG của người: theo nhãn (sdemail hoặc sdma_u = Mã hệ thống), không có thì nhận lại theo tên (rồi gắn nhãn). */
function qtTimHsNg_(C, n) {
  var d = dongCauTruc_(C, 'HS_NG');
  if (!d) return null;
  var oGoc = qtOGocCua_(C, d);
  if (!oGoc) return null;
  var ds = qtTimNhan_({ corpora: 'drive', driveId: oGoc.id }, 'sdma', 'HS_NG');
  var f = ds.filter(function (x) { var l = qtNhan_(x); return l.sdemail === n.email || (n.maHT && l.sdma_u === n.maHT); })[0];
  if (!f) {
    var ten = dienMau_(qtTenCuoi_(d.duong), n, null);
    var seg = String(d.duong || '').split('/').filter(chuan_);
    f = qtTimTheoTen_(oGoc.id, ten, seg.length === 1 ? oGoc.id : null);
    if (f && !P.thu) { var nh = { sdma: 'HS_NG', sdemail: n.email }; if (n.maHT) nh.sdma_u = n.maHT; qtGanNhan_(f.id, nh, f.name); }
  }
  return f ? { id: f.id, drive: oGoc.id } : null;
}

/** Thư mục 00_TAI-LIEU-CUA-TOI (HS_TL) trong HS_NG: theo nhãn sdma='HS_TL', không có thì theo tên. */
function qtTimHsTl_(hs) {
  var con = qtLietKe_({ corpora: 'drive', driveId: hs.drive, q: "'" + hs.id + "' in parents and mimeType = '" + QT_MIME_TM + "' and trashed=false" });
  var f = con.filter(function (x) { return qtNhan_(x).sdma === 'HS_TL'; })[0] || con.filter(function (x) { return x.name === QT_TEN_TL; })[0];
  return f ? f.id : null;
}

function qtTimHoacTaoCon_(cha, ten, props, thu) {
  var f = qtLietKe_({ q: "'" + cha + "' in parents and name = '" + ten.replace(/'/g, "\\'") + "' and mimeType = '" + QT_MIME_TM + "' and trashed = false", corpora: 'allDrives' })[0];
  if (f) return f.id;
  if (thu) return '(sẽ tạo)';
  return Drive.Files.create({ name: ten, mimeType: QT_MIME_TM, parents: [cha], properties: props }, null, { supportsAllDrives: true }).id;
}

function qtLaLoiTatHeThong_(f) { return f.mimeType === QT_MIME_LT && !!qtNhan_(f).sdlt; }

/**
 * Cứu mọi tệp/thư mục của ổ idO vào thư mục `dich` (trừ lối tắt nhãn sdlt). Chuyển TỆP, dựng lại cấu trúc thư mục ở đích.
 * Xem trước (thu): chỉ đếm. Trả { tep, tm, loi, boQua }.
 */
function qtCuuO_(idO, dich, thu, email) {
  var all = qtLietKe_({ corpora: 'drive', driveId: idO, q: 'trashed=false', pageSize: 1000 });
  var map = {}, con = {}, goc = [], kq = { tep: 0, tm: 0, loi: 0, boQua: 0 }, memo = {};
  all.forEach(function (f) { map[f.id] = f; });
  all.forEach(function (f) { var c = (f.parents || [])[0]; if (c && map[c]) (con[c] = con[c] || []).push(f); else goc.push(f); });
  var coNoiDung = function (f) {
    if (memo[f.id] !== undefined) return memo[f.id];
    return (memo[f.id] = (con[f.id] || []).some(function (k) { return !qtLaLoiTatHeThong_(k) && (k.mimeType !== QT_MIME_TM || coNoiDung(k)); }));
  };
  var cuu = function (f, cha) {
    if (qtLaLoiTatHeThong_(f)) { kq.boQua++; return; }
    if (qtHetGio_()) throw new Error('Hết giờ khi cứu tệp, ổ được giữ nguyên; chạy lại để làm tiếp');
    if (f.mimeType === QT_MIME_TM) {
      if (!coNoiDung(f) && qtNhan_(f).sdma) return;   // khuôn rỗng do script dựng
      kq.tm++;
      var moi = '(sẽ tạo)';
      if (!thu) {
        try { moi = qtTimHoacTaoCon_(cha, f.name, { sdluu: '1', sdemail: email }, false); }
        catch (e) { kq.loi++; ghi_('LỖI', 'Không dựng được thư mục ' + f.name, e.message); return; }
      }
      (con[f.id] || []).forEach(function (k) { cuu(k, moi); });
    } else {
      kq.tep++;
      if (thu) return;
      try { Drive.Files.update({}, f.id, null, { addParents: cha, removeParents: (f.parents || []).join(','), supportsAllDrives: true }); }
      catch (e) { kq.loi++; ghi_('LỖI', 'Không chuyển được ' + f.name, e.message); }
    }
  };
  goc.forEach(function (f) { cuu(f, dich); });
  return kq;
}

function qtThuO_(C) {
  QT_T0 = Date.now();
  C = C || taiDuLieu_();
  var thu = !!P.thu, ds = qtDsThu_(C), xong = 0, loi = 0, hom = homNay_(), homTen = hom.replace(/\//g, '-');
  var oGocId = {};
  C.cauTruc.forEach(function (d) { if (d.loai === 'Ổ' && d.id) oGocId[d.id] = true; });
  if (!ds.length) { ghi_('Thu ổ', 'Không có ổ nào cần thu', ''); P.tomTat = 'Không có ổ nào cần thu.'; return; }

  for (var i = 0; i < ds.length; i++) {
    if (qtHetGio_()) { ghi_('Thu ổ', 'Hết giờ, chưa xong; chạy lại để làm tiếp', (ds.length - i) + ' ổ còn lại'); break; }
    var n = ds[i], kq = {};
    try {
      if (oGocId[n.idO]) throw new Error('ID ổ trùng ổ gốc ở CAU_TRUC, từ chối thu ' + n.idO);
      var oTen = Drive.Drives.get(n.idO, { useDomainAdminAccess: true }).name;
      // 1. Cứu mọi tệp/thư mục: HS_NG/00_TAI-LIEU-CUA-TOI/Từ ổ cá nhân <ngày>, không có thì QT_SL/<tên ổ>
      var hs = qtTimHsNg_(C, n), tl = hs ? qtTimHsTl_(hs) : null, dich, dichMo;
      if (tl) { dichMo = 'HS_NG/' + QT_TEN_TL + '/Từ ổ cá nhân ' + homTen; dich = qtTimHoacTaoCon_(tl, 'Từ ổ cá nhân ' + homTen, { sdluu: '1', sdemail: n.email }, thu); }
      else { dichMo = 'QT_SL/' + oTen; dich = qtTimHoacTaoCon_(qtThuMucQT_(C, 'QT_SL'), oTen, { sdluu: '1' }, thu); }
      var cuu = qtCuuO_(n.idO, dich, thu, n.email);
      if (thu) {
        ghi_('Thu ổ', 'Sẽ chuyển ' + cuu.tep + ' tệp (dựng lại ' + cuu.tm + ' thư mục) sang ' + dichMo, n.email);
        ghi_('Thu ổ', 'Sẽ gỡ thành viên và xóa ổ', oTen + ' (' + n.idO + ')');
        kq[n.dong] = 'sẽ thu ổ: chuyển ' + cuu.tep + ' tệp sang ' + dichMo + ', rồi xóa ổ';
        xong++;
      } else {
        ghi_('Thu ổ', 'Đã cứu ' + (cuu.tep) + ' tệp, ' + cuu.tm + ' thư mục vào ' + dichMo + (cuu.loi ? ' (' + cuu.loi + ' lỗi)' : ''), n.email);
        var conLai = qtLietKe_({ corpora: 'drive', driveId: n.idO, q: 'trashed=false', pageSize: 1000 })
          .filter(function (f) { return f.mimeType !== QT_MIME_TM && !qtLaLoiTatHeThong_(f); }).length;
        if (cuu.loi || conLai) throw new Error('Còn ' + conLai + ' tệp chưa chuyển' + (cuu.loi ? ', ' + cuu.loi + ' lỗi chuyển' : '') + ', KHÔNG xóa ổ ' + oTen);
        // 2. Gỡ thành viên
        var pl = Drive.Permissions.list(n.idO, { supportsAllDrives: true, useDomainAdminAccess: true });
        (pl.permissions || []).forEach(function (p) {
          if (p.emailAddress && email_(p.emailAddress) !== C.cd.admin) {
            Drive.Permissions.remove(n.idO, p.id, { supportsAllDrives: true, useDomainAdminAccess: true });
            ghi_('Thu ổ', 'Gỡ thành viên ' + p.emailAddress, oTen);
          }
        });
        // 3. Xóa ổ
        Drive.Drives.remove(n.idO, { useDomainAdminAccess: true, allowItemDeletion: true });
        ghi_('Thu ổ', 'Đã xóa ổ', oTen + ' (' + n.idO + ')');
        // 4. Cập nhật NGUOI
        ghiCot_(C.bang.NGUOI, 'ID ổ', qtMotDong_(n.dong, ''));
        ghiCot_(C.bang.NGUOI, 'Kết quả Drive', qtMotDong_(n.dong, 'đã thu ổ ' + hom));
        xong++;
      }
      if (thu) ghiCot_(C.bang.NGUOI, 'Kết quả Drive', kq);
    } catch (e) {
      loi++;
      ghi_('LỖI', 'Thu ổ ' + n.email, e.message);
      try { ghiCot_(C.bang.NGUOI, 'Kết quả Drive', qtMotDong_(n.dong, 'LỖI thu ổ: ' + e.message)); } catch (e2) { /* bỏ qua */ }
    }
  }
  P.tomTat = (thu ? 'Xem trước: sẽ thu ' : 'Đã thu ') + xong + '/' + ds.length + ' ổ' + (loi ? ', ' + loi + ' lỗi' : '') + '.';
}

function qtMotDong_(dong, giaTri) { var o = {}; o[dong] = giaTri; return o; }
