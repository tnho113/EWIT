/**
 * MLWIT · SHARED DRIVE BOARD v2 · CHẾ ĐỘ GIẢ LẬP
 * Công tắc ở CAI_DAT dòng "Chế độ": "Giả lập" | "Chạy thật".
 *  - Giả lập: tạo ổ/nhóm/quyền THẬT (tên ổ có [THỬ]); mọi ổ và nhóm script tạo được ghi vào sổ `_GIA_LAP`.
 *    Lệnh "Dọn sạch giả lập" xóa đúng những gì có trong sổ rồi làm trống các tab dữ liệu.
 *  - Chạy thật: không ghi sổ; Dọn sạch bị từ chối; giữ nguyên tắc an toàn (script không xóa gì, trừ Thu ổ).
 * Hai khóa:
 *  - Sang "Chạy thật": chỉ khi sổ giả lập trống (đã Dọn sạch).
 *  - Sang "Giả lập": chỉ khi bảng chưa có người và chưa có ID ổ nào (không lẫn với dữ liệu thật).
 *  - "Nhận hiện trạng vào giả lập": chỉ chạy được khi CAI_DAT CHƯA TỪNG ghi "Chạy thật" (dùng cho giai đoạn thử ban đầu).
 * Không bao giờ xóa ổ đang chứa chính Bảng điều khiển.
 * A4: Xem trước dọn sạch / Dọn sạch đếm tệp từng ổ và tệp do người khác admin sửa gần nhất; có thì Dọn sạch hỏi thêm
 * "XOA CA TAI LIEU" — gõ sai thì bỏ qua các ổ đó (vẫn xóa phần còn lại), giữ chúng trong sổ, chưa làm trống bảng.
 */
var GL = { TAB: '_GIA_LAP', COT: ['Loại', 'ID / Email', 'Tên', 'Ghi lúc'], NHAN: 'Chế độ', GIA_LAP: 'Giả lập', THAT: 'Chạy thật', GIOI_HAN: 270000 };

function sdGiaLapNhanHienTrang() { chayPhien_('Giả lập · Nhận hiện trạng', glNhanHienTrang_); }
function sdGiaLapXemTruocDon() { chayPhien_('Giả lập · Xem trước dọn sạch', function () { glDonSach_(true); }); }
function sdGiaLapDonSach() { chayPhien_('Giả lập · Dọn sạch', function () { glDonSach_(false); }); }
function sdChuyenChayThat() { chayPhien_('Chuyển sang Chạy thật', glSangThat_); }
function sdChuyenGiaLap() { chayPhien_('Chuyển sang Giả lập', glSangGiaLap_); }
function sdGiaLapTaoNoiDung() { chayPhien_('Giả lập · Tạo nội dung thử', glTaoNoiDung_); }

/* ---------- CAI_DAT và sổ ---------- */

function glCheDo_() { return chuan_(docCaiDat_()[GL.NHAN]); }

function glDatCaiDat_(nhan, giaTri) {
  var tab = P.ss.getSheetByName(TAB.CAI_DAT), v = tab.getDataRange().getValues();
  for (var i = 0; i < v.length; i++) if (chuan_(v[i][0]) === nhan) { tab.getRange(i + 1, 2).setValue(giaTri); return; }
  tab.appendRow([nhan, giaTri, nhan === GL.NHAN ? 'Giả lập = thử, xóa được hết bằng Dọn sạch · Chạy thật = vận hành, không xóa. Đổi bằng menu Giả lập.' : '']);
}

function glTabSo_(tao) {
  var tab = P.ss.getSheetByName(GL.TAB);
  if (!tab && tao) {
    tab = P.ss.insertSheet(GL.TAB);
    tab.appendRow(GL.COT);
    try { tab.hideSheet(); } catch (e) { /* không ẩn được cũng không sao */ }
  }
  return tab;
}

/** Đọc sổ: [{loai, id, ten, dong}] */
function glDocSo_() {
  var tab = glTabSo_(false);
  if (!tab) return [];
  return tab.getDataRange().getValues().slice(1).map(function (r, i) {
    return { loai: chuan_(r[0]), id: chuan_(r[1]), ten: chuan_(r[2]), dong: i + 2 };
  }).filter(function (x) { return x.id; });
}

/** Ghi một ổ/nhóm vào sổ (chỉ ở chế độ Giả lập). 30_Drive và 25_Nhom gọi ngay sau khi tạo. */
function glGhiSo_(C, loai, id, ten) {
  if (!C || !C.cd || !C.cd.giaLap || !id) return;
  glThemSo_(loai, id, ten);
}

function glThemSo_(loai, id, ten) {
  var co = glDocSo_().some(function (x) { return x.loai === loai && x.id === id; });
  if (co) return false;
  glTabSo_(true).appendRow([loai, id, ten || '', bayGio_()]);
  return true;
}

function glNhap_(tieuDe, noiDung) {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt(tieuDe, noiDung, ui.ButtonSet.OK_CANCEL);
  return r.getSelectedButton() === ui.Button.OK ? chuan_(r.getResponseText()) : null;
}

/* ---------- Nhận hiện trạng ---------- */

function glNhanHienTrang_() {
  var cheDo = glCheDo_();
  if (cheDo === GL.THAT) throw new Error('Bảng đang ở "Chạy thật": không nhận hiện trạng vào giả lập được.');
  var C = taiDuLieu_();
  var tl = glNhap_('Nhận hiện trạng vào giả lập',
    'Mọi ổ có ID trên bảng và mọi nhóm "' + C.cd.tienTo + '…" sẽ được coi là ĐỒ THỬ, xóa được bằng "Dọn sạch giả lập".\nChỉ làm khi chưa có dữ liệu thật. Gõ GIA LAP để xác nhận.');
  if (tl !== 'GIA LAP') { P.tomTat = 'Đã hủy.'; return; }
  var n = 0;
  C.cauTruc.forEach(function (d) { if (d.loai === 'Ổ' && d.id && glThemSo_('Ổ', d.id, d.duong)) n++; });
  C.dsNguoi.forEach(function (x) { if (x.idO && glThemSo_('Ổ', x.idO, 'Ổ cá nhân · ' + x.ten)) n++; });
  glNhomTienTo_(C).forEach(function (g) { if (glThemSo_('Nhóm', g.email, g.name)) n++; });
  glDatCaiDat_(GL.NHAN, GL.GIA_LAP);
  P.tomTat = 'Đã ghi ' + n + ' mục vào sổ giả lập; Chế độ = Giả lập.';
  ghi_('Giả lập', 'Nhận hiện trạng', P.tomTat);
}

/** Mọi nhóm trong miền có email bắt đầu bằng tiền tố nhóm. */
function glNhomTienTo_(C) {
  var kq = [], trang = null;
  do {
    var tham = { domain: C.cd.mien, maxResults: 200 };
    if (trang) tham.pageToken = trang;
    var r = AdminDirectory.Groups.list(tham);
    (r.groups || []).forEach(function (g) { if (email_(g.email).indexOf(C.cd.tienTo) === 0) kq.push({ email: email_(g.email), name: g.name }); });
    trang = r.nextPageToken;
  } while (trang);
  return kq;
}

/* ---------- Công tắc ---------- */

function glSangThat_() {
  var con = glDocSo_();
  if (con.length) throw new Error('Sổ giả lập còn ' + con.length + ' mục. Chạy "Dọn sạch giả lập" trước rồi mới chuyển sang Chạy thật.');
  glDatCaiDat_(GL.NHAN, GL.THAT);
  P.tomTat = 'Chế độ = Chạy thật.';
  ghi_('Giả lập', 'Chuyển chế độ', GL.THAT);
}

function glSangGiaLap_() {
  var C = taiDuLieu_();
  var coO = C.cauTruc.some(function (d) { return d.loai === 'Ổ' && d.id; });
  if (C.dsNguoi.length || coO) throw new Error('Bảng đã có người hoặc ID ổ: không chuyển sang Giả lập được (tránh lẫn với dữ liệu thật). Muốn thử lại hãy dùng một bản sao Board riêng.');
  glDatCaiDat_(GL.NHAN, GL.GIA_LAP);
  P.tomTat = 'Chế độ = Giả lập.';
  ghi_('Giả lập', 'Chuyển chế độ', GL.GIA_LAP);
}

/* ---------- Dọn sạch ---------- */

function glDonSach_(thu) {
  if (glCheDo_() !== GL.GIA_LAP) throw new Error('Chỉ dọn sạch được ở chế độ Giả lập (CAI_DAT "Chế độ").');
  var so = glDocSo_(), dsO = so.filter(function (x) { return x.loai === 'Ổ'; }), dsN = so.filter(function (x) { return x.loai === 'Nhóm'; });

  // Không bao giờ xóa ổ đang chứa chính Bảng điều khiển
  var oBang = '';
  try { oBang = Drive.Files.get(P.ss.getId(), { supportsAllDrives: true, fields: 'driveId' }).driveId || ''; } catch (e) { oBang = ''; }
  if (oBang && dsO.some(function (x) { return x.id === oBang; }))
    throw new Error('Bảng điều khiển đang nằm trong một ổ thuộc sổ giả lập. Chuyển bảng ra khỏi ổ đó trước khi dọn.');

  // A4 (N4): đếm nội dung từng ổ và số tệp do NGƯỜI KHÁC admin sửa gần nhất (lastModifyingUser)
  var admin = email_(docCaiDat_()['Email admin']), coNguoiKhac = {}, soCoNguoiKhac = 0;
  dsO.forEach(function (x) {
    var dem = glDemNoiDung_(x.id, admin);
    if (dem.loi) {
      coNguoiKhac[x.id] = true; soCoNguoiKhac++;
      ghi_('Giả lập', 'Ổ "' + x.ten + '": không đọc được nội dung (' + dem.loi + ') — coi như CÓ tài liệu của người khác', x.id);
    } else {
      if (dem.khac) { coNguoiKhac[x.id] = true; soCoNguoiKhac++; }
      ghi_('Giả lập', 'Ổ "' + x.ten + '": ' + dem.tong + ' tệp/thư mục, ' + dem.khac + ' do người khác admin tạo/sửa gần nhất', x.id);
    }
  });
  so.forEach(function (x) { ghi_('Giả lập', (thu ? 'Sẽ xóa ' : 'Xóa ') + x.loai, x.ten + ' · ' + x.id); });
  if (thu) {
    P.tomTat = 'Xem trước: sẽ xóa ' + dsO.length + ' ổ (kèm mọi tệp bên trong), ' + dsN.length + ' nhóm; làm trống NGUOI, THANH_VIEN, LS_NHAP, NHAP và các cột ID.' +
      (soCoNguoiKhac ? ' ⚠ ' + soCoNguoiKhac + ' ổ có tệp do người khác admin sửa (xem NHAT_KY): Dọn sạch sẽ hỏi thêm "XOA CA TAI LIEU".' : '');
    return;
  }
  var tl = glNhap_('Dọn sạch giả lập',
    'Sẽ XÓA HẲN ' + dsO.length + ' ổ (kèm mọi tệp bên trong) và ' + dsN.length + ' nhóm, rồi làm trống dữ liệu người trên bảng.\nKhông hoàn tác được. Gõ XOA HET để xác nhận.');
  if (tl !== 'XOA HET') { P.tomTat = 'Đã hủy, chưa xóa gì.'; return; }
  var boQua = {};
  if (soCoNguoiKhac) {
    var tl2 = glNhap_('Dọn sạch giả lập · có tài liệu của người khác',
      soCoNguoiKhac + ' ổ có tệp do người khác (không phải admin) tạo hoặc sửa gần nhất — có thể là tài liệu THẬT:\n' +
      dsO.filter(function (x) { return coNguoiKhac[x.id]; }).map(function (x) { return '- ' + x.ten; }).join('\n') +
      '\nGõ XOA CA TAI LIEU để xóa cả các ổ này. Gõ khác: bỏ qua các ổ này (vẫn xóa phần còn lại).');
    if (tl2 !== 'XOA CA TAI LIEU') {
      boQua = coNguoiKhac;
      ghi_('Giả lập', 'Bỏ qua ' + soCoNguoiKhac + ' ổ có tài liệu của người khác (không gõ XOA CA TAI LIEU)',
        dsO.filter(function (x) { return coNguoiKhac[x.id]; }).map(function (x) { return x.ten; }).join(', '));
    }
  }

  var batDau = Date.now(), xong = [], loi = 0, hetGio = false, soBo = 0;
  var khongCo = function (e) { return /not\s*found|notfound|404|does not exist/i.test(String(e && e.message || e)); };
  so.forEach(function (x) {
    if (hetGio) return;
    if (x.loai === 'Ổ' && boQua[x.id]) { soBo++; return; }
    if (Date.now() - batDau > GL.GIOI_HAN) { hetGio = true; return; }
    try {
      if (x.loai === 'Ổ') Drive.Drives.remove(x.id, { useDomainAdminAccess: true, allowItemDeletion: true });
      else if (x.loai === 'Nhóm') AdminDirectory.Groups.remove(x.id);
      xong.push(x.dong);
    } catch (e) {
      if (khongCo(e)) xong.push(x.dong);                       // đã không còn → coi như xong
      else { loi++; ghi_('LỖI', 'Xóa ' + x.loai, x.ten + ' · ' + e.message); }
    }
  });
  // Gỡ các dòng đã xong khỏi sổ (từ dưới lên)
  var tabSo = glTabSo_(false);
  xong.sort(function (a, b) { return b - a; }).forEach(function (d) { tabSo.deleteRow(d); });

  if (hetGio || loi || soBo) {
    P.tomTat = 'Đã xóa ' + xong.length + ' mục; còn ' + (so.length - xong.length) + ' mục' + (loi ? ' (' + loi + ' lỗi)' : '') +
      (soBo ? ' (bỏ qua ' + soBo + ' ổ có tài liệu của người khác)' : '') + '. Chạy lại "Dọn sạch giả lập" để làm tiếp; bảng chưa được làm trống.';
    return;
  }
  glLamTrongBang_();
  glXoaDauVet_();
  P.tomTat = 'Đã dọn sạch: ' + dsO.length + ' ổ, ' + dsN.length + ' nhóm. Bảng đã trống dữ liệu người. Có thể "Chuyển sang Chạy thật".';
  ghi_('Giả lập', 'Dọn sạch xong', P.tomTat);
}

/**
 * Đếm tệp/thư mục (chưa vào thùng rác) trong một ổ và số mục người sửa gần nhất KHÔNG phải admin (Drive v3 trong ổ chung
 * không có owners; lastModifyingUser là trường gần nhất). Không rõ người sửa → tính là người khác (an toàn).
 * Ổ không còn (404) → 0. Trả { tong, khac, loi? }.
 */
function glDemNoiDung_(idO, admin) {
  var kq = { tong: 0, khac: 0 }, trang = null;
  try {
    do {
      var tham = { corpora: 'drive', driveId: idO, includeItemsFromAllDrives: true, supportsAllDrives: true, q: 'trashed=false', pageSize: 1000,
        fields: 'nextPageToken,files(id,lastModifyingUser(emailAddress,me))' };
      if (trang) tham.pageToken = trang;
      var r = Drive.Files.list(tham);
      (r.files || []).forEach(function (f) {
        kq.tong++;
        var u = f.lastModifyingUser || {};
        if (!(u.me === true || (u.emailAddress && email_(u.emailAddress) === admin))) kq.khac++;
      });
      trang = r.nextPageToken;
    } while (trang);
  } catch (e) {
    if (/not\s*found|notfound|404|does not exist/i.test(String(e && e.message || e))) return { tong: 0, khac: 0 };
    kq.loi = e.message || String(e);
  }
  return kq;
}

/** Làm trống dữ liệu người và các cột ID/kết quả do script ghi. Giữ cấu hình (NHOM, CAU_TRUC, VAI_TRO, CAI_DAT). */
function glLamTrongBang_() {
  var xoaDong = function (ten, boCot) {
    var tab = P.ss.getSheetByName(ten);
    if (!tab || tab.getLastRow() < 2) return;
    var td = tab.getRange(1, 1, 1, tab.getLastColumn()).getValues()[0].map(chuan_), n = tab.getLastRow() - 1;
    td.forEach(function (t, c) { if (t && (boCot || []).indexOf(t) < 0) tab.getRange(2, c + 1, n, 1).clearContent(); });
  };
  var xoaCot = function (ten, dsCot) {
    var tab = P.ss.getSheetByName(ten);
    if (!tab || tab.getLastRow() < 2) return;
    var td = tab.getRange(1, 1, 1, tab.getLastColumn()).getValues()[0].map(chuan_), n = tab.getLastRow() - 1;
    dsCot.forEach(function (t) { var c = td.indexOf(t); if (c >= 0) tab.getRange(2, c + 1, n, 1).clearContent(); });
  };
  xoaDong(TAB.NGUOI); xoaDong(TAB.THANH_VIEN); xoaDong(TAB.LS_NHAP);
  xoaDong(TAB.NHAP, ['Tình trạng']);                           // cột công thức: không đụng
  xoaCot(TAB.NHOM, ['Email nhóm', 'ID thư mục', 'Kết quả']);
  xoaCot(TAB.CAU_TRUC, ['ID']);
  glDatCaiDat_('Link báo cáo', '');
}

/** Xóa con trỏ, dấu thay đổi, dấu thư chào… và trình kích hoạt chạy tiếp/hằng đêm. */
function glXoaDauVet_() {
  try {
    var pr = PropertiesService.getScriptProperties();
    (pr.getKeys ? pr.getKeys() : []).forEach(function (k) { if (/^(SD|SDH|NHOM_CAIDAT|O)_/.test(k)) pr.deleteProperty(k); });
  } catch (e) { ghi_('Giả lập', 'Không xóa được dấu vết script: ' + e.message, ''); }
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      var h = t.getHandlerFunction ? t.getHandlerFunction() : '';
      if (/^sd(Drive|Nhom|Quet|ThuChao)/.test(h)) ScriptApp.deleteTrigger(t);
    });
  } catch (e) { /* bỏ qua */ }
}

/* ---------- Nội dung thử ---------- */

/** Tạo vài tệp mẫu (gắn properties sdthu=1) trong thư mục nhóm đã có ID, để người thử có cái mà mở/nhận xét/quét. */
function glTaoNoiDung_() {
  var C = taiDuLieu_();
  if (!C.cd.giaLap) throw new Error('Chỉ tạo nội dung thử ở chế độ Giả lập.');
  var n = 0, MIME_DOC = 'application/vnd.google-apps.document';
  var tao = function (cha, ten, mime) {
    try {
      Drive.Files.create({ name: ten, mimeType: mime || MIME_DOC, parents: [cha], properties: { sdthu: '1' } }, null, { supportsAllDrives: true });
      n++;
    } catch (e) { ghi_('LỖI', 'Tạo tệp thử "' + ten + '"', e.message); }
  };
  C.dsNhom.forEach(function (g) {
    if (!g.idThuMuc) return;
    tao(g.idThuMuc, '[THỬ] Tài liệu mẫu · ' + g.ma);
    if (g.loai === 'Dự án') { tao(g.idThuMuc, '[THỬ] Trùng tên'); tao(g.idThuMuc, '[THỬ] Trùng tên'); }
  });
  var raw = C.cauTruc.filter(function (d) { return d.ma === 'O_RAW' && d.id; })[0];
  if (raw) tao(raw.id, '[THỬ] ghi-am-mau.mp3', 'audio/mpeg');
  P.tomTat = 'Đã tạo ' + n + ' tệp thử.';
  ghi_('Giả lập', 'Tạo nội dung thử', P.tomTat);
}
