/**
 * MLWIT · SHARED DRIVE BOARD v2 · DRIVE (Đợt 2)
 * Dựng ổ gốc, thư mục theo CAU_TRUC, ổ cá nhân, lối tắt; cấp quyền thư mục cho nhóm Google sd-…
 * Dịch vụ nâng cao cần bật: Drive (v3). Gửi thư: MailApp.
 *
 * Hàm công khai:
 *   sdDriveXemTruoc()   Xem trước: không gọi lệnh ghi nào lên Drive/Groups/Mail, chỉ ghi "sẽ …"
 *   sdDriveApDung()     Áp dụng: dongBoNhom_ (25_Nhom) rồi apDungDrive_
 *   sdDriveTiep()       chạy tiếp (trình kích hoạt hẹn giờ gọi khi lượt trước hết giờ)
 *   apDungDrive_(C, nhomCo)
 *
 * Nhận diện bằng appProperties (không bằng tên):
 *   thư mục: sdma (Mã dòng CAU_TRUC) + sdnhom | sdemail | sdlop | sdnhanh khi cần
 *   thư mục nhánh trung gian của LOP_NHOM: sdma = <mã dòng>_NHANH, sdnhanh
 *   thư mục nhóm nhỏ trong 40_HOC-VIEN-PHU-TRACH: sdma = CN_HV_PT_SUB, sdnhom
 *   thư mục trung gian không gắn mã: sdtg = '1' (tìm theo cha + tên)
 *   lối tắt: sdlt = '1', sdkhoa = khóa duy nhất trong ổ cá nhân
 *   tệp mẫu đã chép: sdma = HS_NK, sdemail
 *
 * Giả định (hợp đồng chưa nói rõ / chọn cách hợp lý nhất):
 *  1. Thành viên ổ gốc: chỉ đối soát ổ O_DL (nhóm DULIEU). Ổ gốc khác không thêm, không gỡ thành viên.
 *  2. Thư mục theo nhóm của nhóm Đóng/Ngừng: không tạo mới; đã có thì giữ, gỡ hết quyền của nhóm sd-/người trên bảng.
 *     Dự án/Ban/Level Đóng/Ngừng cũng không cấp quyền (đồng nhất với 25_Nhom làm rỗng nhóm).
 *  3. Quyền cho nhóm Google chỉ cấp khi email nhóm có trong nhomCo. Nếu dongBoNhom_ báo chuaXong
 *     (nhomCo chưa đủ) thì KHÔNG chạy phần Drive lượt này (tránh gỡ nhầm quyền của nhóm chưa kịp kiểm), hẹn chạy tiếp.
 *  4. Đồng hồ 4,5 phút tính từ đầu lệnh (gồm cả dongBoNhom_). Xem trước hết giờ: chỉ báo, không hẹn chạy tiếp.
 *  5. Quyền trực tiếp ≤ quyền thừa kế được coi như không có (tránh gỡ/hạ lặp lại mỗi lần chạy);
 *     quyền mong muốn ≤ quyền thừa kế thì không cấp thêm.
 *  6. "Thư mục theo người": RAW_NG writer, WIKI_NG reader (+ writer từng tệp, đệ quy thư mục con, bỏ lối tắt),
 *     HS_NG reader; mã khác đọc cột "Quyền" (Tải lên/Sửa → writer, Nhận xét → commenter, còn lại reader).
 *  7. Thư mục ổ cá nhân (Loại "Thư mục"): cột "Quyền" = Tải lên/Sửa → chủ ổ writer; Nhận xét → commenter.
 *  8. Người Đang nhưng không còn nhóm: gỡ khỏi thành viên ổ, KHÔNG đổi tên. Chỉ người Nghỉ + "Giữ ổ" mới đổi tên ZZ · Nghỉ.
 *     Ổ của người không còn ổ: lối tắt để nguyên (người đó không còn vào được ổ).
 *  9. Ghi ID: CAU_TRUC "ID" cho dòng Ổ (ngay khi tạo) và dòng Thư mục ở ổ gốc; NGUOI "ID ổ" (ngay khi tạo);
 *     NHOM "ID thư mục". Chỉ ghi ở Áp dụng. NGUOI "Kết quả Drive" ghi ở cả hai chế độ.
 * 10. Tên lối tắt tới thư mục nhóm = "<Mã nhóm> · <Tên nhóm>"; Dự án tham gia = nhóm có Loại thuộc
 *     "Nhóm loại" của dòng DA_NHOM (mặc định Dự án, Ban). Lối tắt "Học viên phụ trách": khóa = nhóm nhỏ + email HV.
 * 11. Tiêu đề thư chào: "Ổ của bạn trên <Tên hiển thị ở CAI_DAT> đã sẵn sàng".
 * 12. Tệp mẫu: tên tệp mẫu = đoạn cuối của Đường dẫn (vd "Nhật ký trưởng thành"), tìm trong thư mục dòng QT_MAU.
 */
var DR = {
  MIME_TM: 'application/vnd.google-apps.folder',
  MIME_LT: 'application/vnd.google-apps.shortcut',
  CHUA_TAO: 'CHUA-TAO:',
  HANG: { reader: 1, commenter: 2, writer: 3, fileOrganizer: 4, organizer: 5 },
  TEN_QUYEN: { reader: 'xem', commenter: 'nhận xét', writer: 'sửa/tải lên', fileOrganizer: 'quản lý nội dung', organizer: 'quản lý' },
  GIOI_HAN_MS: 270000,
  HAM_TIEP: 'sdDriveTiep',
  TIEN_TO_NGHI: 'ZZ · Nghỉ · ',
  MA_HV_PT_SUB: 'CN_HV_PT_SUB',
  HAN_CHE_GOC: { driveMembersOnly: false, domainUsersOnly: false, sharingFoldersRequiresOrganizerPermission: true }
};

/* ===================== MENU ===================== */

function sdDriveXemTruoc() { chayPhien_('Drive · Xem trước', function () { P.thu = true; drChay_(); }); }

function sdDriveApDung() {
  try {
    var ui = SpreadsheetApp.getUi();
    var tl = ui.alert('Áp dụng lên Drive', 'Script sẽ tạo ổ, thư mục, lối tắt và cấp/gỡ quyền theo bảng. Đã chạy Xem trước và đọc NHAT_KY chưa?', ui.ButtonSet.YES_NO);
    if (tl !== ui.Button.YES) return;
  } catch (e) { /* không có giao diện: chạy luôn */ }
  chayPhien_('Drive · Áp dụng', function () { P.thu = false; drChay_(); });
}

function sdDriveTiep() { chayPhien_('Drive · Chạy tiếp', function () { P.thu = false; drXoaHen_(); drChay_(); }, 'sdDriveTiep'); }

function drChay_() {
  var batDau = Date.now();
  var C = taiDuLieu_();
  var nhomCo = {};
  if (typeof dongBoNhom_ === 'function') {
    P.goiTuDrive = true;
    var r = dongBoNhom_(C) || {};
    nhomCo = r.nhomCo || {};
    if (r.chuaXong) {
      ghi_('Drive', 'Nhóm Google chưa đồng bộ xong: chưa chạy phần Drive lượt này', P.thu ? 'Xem trước' : 'hẹn chạy tiếp');
      P.tomTat = 'Nhóm chưa xong, Drive sẽ chạy ở lượt sau.';
      if (!P.thu) drHenChayTiep_();
      return;
    }
  } else {
    ghi_('Drive', 'Chưa có dongBoNhom_ (25_Nhom.gs): không cấp quyền cho nhóm nào', '');
  }
  apDungDrive_(C, nhomCo, batDau);
}

/* ===================== LUỒNG CHÍNH ===================== */

function apDungDrive_(C, nhomCo, batDau) {
  var S = {
    C: C, nhomCo: nhomCo || {}, thu: !!P.thu, batDau: batDau || Date.now(),
    tenGoc: {}, oGoc: {}, idx: {}, maCT: {}, tmGoc: {}, tmTheoNhom: {}, tmNguoi: {}, nop: {}, tepMau: {}, mau: {},
    M: { quyen: {}, quanLy: {} }, kqNguoi: {}, daXuLy: {}, ghiNhom: {}, ghiCt: {}, baoMau: {},
    dem: { o: 0, tm: 0, qThem: 0, qDoi: 0, qGo: 0, ltThem: 0, ltBo: 0, thu: 0 }
  };
  C.cauTruc.forEach(function (d) { S.maCT[d.ma] = true; if (d.loai === 'Ổ' && d.ma !== 'CN_TEN') S.tenGoc[d.o] = true; });
  var xong = false;
  try {
    drOGoc_(S);
    drThuMucGoc_(S);
    drThuMucNhom_(S);
    drThuMucNguoi_(S);
    drQuanLyGoc_(S);
    drDoiSoatTatCa_(S, S.M);
    C.dsNguoi.forEach(function (n) { drKiemGio_(S); drOCaNhan_(S, n); S.daXuLy[n.email] = true; });
    xong = true;
  } catch (e) {
    if (!e || !e.drHetGio) throw e;
  } finally {
    drGhiBang_(S, xong);
  }
  var d = S.dem, se = S.thu ? 'sẽ ' : '';
  P.tomTat = (S.thu ? 'Xem trước: ' : '') + se + 'tạo ' + d.o + ' ổ, ' + d.tm + ' thư mục; quyền +' + d.qThem + ' ~' + d.qDoi + ' −' + d.qGo +
    '; lối tắt +' + d.ltThem + ' −' + d.ltBo + '; thư chào ' + d.thu + '.';
  if (xong) {
    if (!S.thu) drXoaHen_();
  } else {
    P.tomTat += ' Chưa xong, ' + (S.thu ? 'Xem trước dừng do hết giờ.' : 'sẽ chạy tiếp sau 1 phút.');
    ghi_('Drive', 'Chưa xong, sẽ chạy tiếp', S.thu ? 'hết giờ (Xem trước, không hẹn)' : 'hẹn chạy lại sau 1 phút');
    if (!S.thu) drHenChayTiep_();
  }
}

/* ===================== THỜI GIAN & HẸN GIỜ ===================== */

function drHetGio_(S) { return Date.now() - S.batDau > DR.GIOI_HAN_MS; }
function drKiemGio_(S) { if (drHetGio_(S)) throw { drHetGio: true }; }

function drHenChayTiep_() {
  var co = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction && t.getHandlerFunction() === DR.HAM_TIEP; });
  if (!co) ScriptApp.newTrigger(DR.HAM_TIEP).timeBased().after(60000).create();
}

function drXoaHen_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction && t.getHandlerFunction() === DR.HAM_TIEP) ScriptApp.deleteTrigger(t);
  });
}

/* ===================== Ổ GỐC ===================== */

function drOGoc_(S) {
  var C = S.C;
  C.cauTruc.forEach(function (d) {
    if (d.loai !== 'Ổ' || d.ma === 'CN_TEN') return;
    drKiemGio_(S);
    var id = d.id;
    if (id) {
      var o = drLayO_(id);
      if (!o) { ghi_('LỖI', 'Không mở được ổ gốc theo ID ở CAU_TRUC', d.ma + ' · ' + id); return; }
      if (o.name !== d.duong) {
        ghi_('Ổ gốc', (S.thu ? 'Sẽ đổi tên ' : 'Đổi tên ') + '"' + o.name + '" → "' + d.duong + '"', d.ma);
        if (!S.thu) Drive.Drives.update({ name: d.duong }, id);
      }
      drHanChe_(S, id, o.restrictions, DR.HAN_CHE_GOC, d.duong);
    } else if (S.thu) {
      id = DR.CHUA_TAO + d.ma; S.dem.o++;
      ghi_('Ổ gốc', 'Sẽ tạo ổ', d.duong);
    } else {
      id = drTaoO_(S, d.duong, DR.HAN_CHE_GOC);
      d.id = id;
      var m = {}; m[d.dong] = id;
      ghiCot_(C.bang.CAU_TRUC, 'ID', m);
      ghi_('Ổ gốc', 'Đã tạo ổ', d.duong);
    }
    S.oGoc[d.o] = id;
    if (d.ma === 'O_DL') {
      var muon = {};
      [['', 'reader'], ['sua', 'writer'], ['pt', 'fileOrganizer']].forEach(function (x) {
        var e = emailNhom_(C, 'DULIEU', x[0]);
        if (S.nhomCo[e]) muon[e] = { role: x[1], type: 'group' };
      });
      drDoiSoat_(S, id, muon, 'thành viên ổ ' + d.duong);
    }
  });
}

function drLayO_(id) {
  try { return Drive.Drives.get(id, { fields: 'id,name,restrictions' }); } catch (e) { return null; }
}

function drTaoO_(S, ten, hanChe) {
  var d = Drive.Drives.create({ name: ten }, Utilities.getUuid());
  drThuLai_(function () { Drive.Drives.update({ restrictions: hanChe }, d.id); });
  S.dem.o++;
  return d.id;
}

function drHanChe_(S, id, hienTai, muon, nhan) {
  hienTai = hienTai || {};
  var khac = Object.keys(muon).filter(function (k) { return !!hienTai[k] !== muon[k]; });
  if (!khac.length) return false;
  ghi_('Hạn chế ổ', (S.thu ? 'Sẽ đặt ' : 'Đặt ') + khac.map(function (k) { return k + '=' + muon[k]; }).join(', '), nhan);
  if (!S.thu && !drChua_(id)) drThuLai_(function () { Drive.Drives.update({ restrictions: muon }, id); });
  return true;
}

/* ===================== THƯ MỤC Ở Ổ GỐC ===================== */

function drTimDongGoc_(S, o, duong) {
  for (var i = 0; i < S.C.cauTruc.length; i++) {
    var d = S.C.cauTruc[i];
    if (d.loai === 'Thư mục' && d.o === o && d.duong === duong) return d;
  }
  return null;
}

function drThuMucGoc_(S) {
  S.C.cauTruc.forEach(function (d) { if (d.loai === 'Thư mục' && S.oGoc[d.o]) { drKiemGio_(S); drThuMucDong_(S, d); } });
}

/** Thư mục của một dòng "Thư mục" ở ổ gốc (nhớ theo mã). */
function drThuMucDong_(S, d) {
  if (S.tmGoc.hasOwnProperty(d.ma)) return S.tmGoc[d.ma];
  S.tmGoc[d.ma] = null;                                   // chống vòng lặp
  var oId = S.oGoc[d.o];
  if (!oId) return null;
  var segs = drDoan_(d.duong);
  var cha = drChaTheoDuong_(S, oId, segs.slice(0, -1), { timDong: drTimGoc_(S, d.o) });
  var id = drDamBao_(S, oId, cha, segs[segs.length - 1], { sdma: d.ma });
  S.tmGoc[d.ma] = id;
  if (!id) return null;
  drQuanLy_(S.M, id, d.duong);
  if (d.ma === 'TTC_EF') drCapNhom_(S, S.M, id, emailTong_(S.C, 'ef'), 'reader');
  if (d.ma === 'TTC_HV') drCapNhom_(S, S.M, id, emailTong_(S.C, 'hv'), 'reader');
  if (!drChua_(id) && id !== d.id) S.ghiCt[d.dong] = id;
  return id;
}

function drTimGoc_(S, o) {
  return function (tienTo) { var r = drTimDongGoc_(S, o, tienTo); return r ? drThuMucDong_(S, r) : undefined; };
}

/* ===================== THƯ MỤC THEO NHÓM ===================== */

function drNhomDong_(g) { return g.tt === 'Đóng' || g.tt === 'Ngừng'; }

function drThuMucNhom_(S) {
  var C = S.C;
  C.cauTruc.forEach(function (d) {
    if (d.loai !== 'Thư mục theo nhóm') return;
    var oId = S.oGoc[d.o];
    if (!oId) return;
    var loai = drDsSauHaiCham_(d.nguon);
    var con = C.cauTruc.filter(function (x) { return x.loai === 'Thư mục con của nhóm' && x.o === d.o; });
    var segs = drDoan_(d.duong);
    C.dsNhom.forEach(function (g) {
      if (loai.indexOf(g.loai) < 0) return;
      drKiemGio_(S);
      var dong = drNhomDong_(g);
      var cha = drChaTheoDuong_(S, oId, segs.slice(0, -1), { g: g, maDong: d.ma, khongTao: dong, timDong: drTimGoc_(S, d.o) });
      var id = drDamBao_(S, oId, cha, dienMau_(segs[segs.length - 1], null, g), { sdma: d.ma, sdnhom: g.ma }, dong);
      if (!id) return;
      if (!S.tmTheoNhom[g.ma]) {
        S.tmTheoNhom[g.ma] = id;
        if (!drChua_(id) && id !== g.idThuMuc) S.ghiNhom[g.dong] = id;
      }
      drQuanLy_(S.M, id, g.ma);
      if (!dong) drQuyenNhom_(S, id, g);
      con.forEach(function (x) {
        var s2 = drDoan_(x.duong);
        if (/^\{.*\}$/.test(s2[0])) s2.shift();
        if (!s2.length) return;
        var c2 = drChaTheoDuong_(S, oId, s2.slice(0, -1), { goc: id, khongTao: dong });
        var id2 = drDamBao_(S, oId, c2, s2[s2.length - 1], { sdma: x.ma, sdnhom: g.ma }, dong);
        if (id2) drQuanLy_(S.M, id2, g.ma + '/' + s2.join('/'));
      });
    });
  });
}

/** Quyền thư mục nhóm theo bảng 2.2. */
function drQuyenNhom_(S, id, g) {
  var C = S.C;
  if (g.loai === 'Level') {
    levelDuocXem_(C, g.ma).forEach(function (lx) { drCapNhom_(S, S.M, id, emailNhom_(C, lx, ''), 'reader'); });
  } else if (g.loai === 'Lớp') {
    if (g.tt === 'Đang' || g.tt === 'Kết thúc') {
      drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, ''), 'reader');
      drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'pt'), 'writer');
    }
  } else {
    drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, ''), 'reader');
    drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'sua'), 'writer');
    drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'pt'), 'fileOrganizer');
  }
}

/* ===================== THƯ MỤC THEO NGƯỜI ===================== */

/** Người áp cho dòng "Thư mục theo người": "Nhóm: RAW" | "Vai trò: HV". */
function drNguoiCuaDong_(S, d) {
  var C = S.C, m = /^\s*(Nhóm|Vai trò)\s*:\s*(.+)$/.exec(d.nguon || ''), ds = [], da = {};
  if (!m) { ghi_('LỖI', 'Dòng ' + d.ma + ': cột Nguồn phải là "Nhóm: <mã>" hoặc "Vai trò: <vai>"', d.nguon); return ds; }
  var giaTri = m[2].split(',').map(chuan_);
  var them = function (n) { if (n && !da[n.email]) { da[n.email] = true; ds.push(n); } };
  if (m[1] === 'Nhóm') {
    giaTri.forEach(function (ma) {
      thanhVienNhom_(C, maNhom_(ma)).forEach(function (t) { var n = C.nguoi[t.email]; if (n && n.tt === 'Đang') them(n); });
    });
  } else {
    C.dsNguoi.forEach(function (n) { if (giaTri.indexOf(n.vaiTro) >= 0 && coOCaNhan_(C, n)) them(n); });
  }
  return ds;
}

function drThuMucNguoi_(S) {
  var C = S.C;
  C.cauTruc.forEach(function (d) {
    if (d.loai !== 'Thư mục theo người') return;
    var oId = S.oGoc[d.o];
    if (!oId) return;
    var segs = drDoan_(d.duong), ds = drNguoiCuaDong_(S, d), co = {};
    var conLop = C.cauTruc.filter(function (x) { return x.loai === 'Thư mục con theo lớp' && x.o === d.o; });
    var mau = C.cauTruc.filter(function (x) { return x.loai === 'Tệp mẫu' && x.o === d.o; });
    var vai = d.ma === 'RAW_NG' ? 'writer' : (d.ma === 'WIKI_NG' || d.ma === 'HS_NG') ? 'reader' : (drVaiTuQuyen_(d.quyen) || 'reader');
    var cha = drChaTheoDuong_(S, oId, segs.slice(0, -1), { timDong: drTimGoc_(S, d.o) });
    S.tmNguoi[d.ma] = {};
    ds.forEach(function (n) {
      drKiemGio_(S);
      co[n.email] = true;
      var id = drDamBao_(S, oId, cha, dienMau_(segs[segs.length - 1], n, null), { sdma: d.ma, sdemail: n.email });
      if (!id) return;
      S.tmNguoi[d.ma][n.email] = id;
      drQuanLy_(S.M, id, d.ma + ' · ' + n.email);
      drCap_(S.M, id, n.email, vai, 'user');
      conLop.forEach(function (x) { drNopBai_(S, oId, id, x, n); });
      mau.forEach(function (x) { drTepMau_(S, oId, id, x, n); });
    });
    if (d.ma === 'WIKI_NG') drTepWiki_(S, oId, d.ma, co);
    mau.forEach(function (x) {
      var dsTep = drTepMauCo_(S, oId, x.ma);
      Object.keys(dsTep).forEach(function (e) { drQuanLy_(S.M, dsTep[e].id, x.ma + ' · ' + e); });
    });
  });
}

/** Thư mục nộp bài theo lớp (HS_NOP) trong thư mục của HV. */
function drNopBai_(S, oId, chaNguoi, x, n) {
  var C = S.C, segs = drDoan_(x.duong), mauTen = segs[segs.length - 1];
  var dsTv = nhomCuaNguoi_(C, n.email);
  dsTv.forEach(function (t) {
    var lop = C.nhom[t.ma];
    if (!lop || lop.loai !== 'Lớp' || (lop.tt !== 'Đang' && lop.tt !== 'Kết thúc')) return;
    var id = drDamBao_(S, oId, chaNguoi, mauTen.replace(/\{Mã lớp\}/g, lop.ma), { sdma: x.ma, sdemail: n.email, sdlop: lop.ma });
    if (!id) return;
    (S.nop[n.email] = S.nop[n.email] || {})[lop.ma] = id;
    drQuanLy_(S.M, id, 'nộp bài ' + lop.ma + ' · ' + n.email);
    if (lop.tt !== 'Đang') return;                    // Kết thúc: chỉ còn quyền xem thừa kế
    drCap_(S.M, id, n.email, 'writer', 'user');
    dsTv.forEach(function (t2) {
      var g = C.nhom[t2.ma];
      if (g && g.loai === 'Nhóm nhỏ' && g.thuoc === lop.ma && t2.vai === 'Thành viên' && !drNhomDong_(g)) {
        drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'pt'), 'commenter');
      }
    });
  });
}

/** Tệp mẫu đã chép trong một ổ: { email: tệp }. */
function drTepMauCo_(S, oId, ma) {
  var k = oId + '|' + ma;
  if (S.tepMau[k]) return S.tepMau[k];
  var m = S.tepMau[k] = {};
  if (drChua_(oId)) return m;
  drLietKe_({ corpora: 'drive', driveId: oId, q: "appProperties has { key='sdma' and value='" + drNhay_(ma) + "' } and trashed=false" })
    .forEach(function (f) { var e = (f.appProperties || {}).sdemail; if (e && !m[e]) m[e] = f; });
  return m;
}

function drTimMau_(S, ten) {
  if (S.mau.hasOwnProperty(ten)) return S.mau[ten];
  S.mau[ten] = null;
  var tm = S.tmGoc.QT_MAU;
  if (!tm || drChua_(tm)) return null;
  var ds = drLietKe_({ q: "'" + tm + "' in parents and trashed=false and name='" + drNhay_(ten) + "' and mimeType!='" + DR.MIME_TM + "'" });
  S.mau[ten] = ds.length ? ds[0].id : null;
  return S.mau[ten];
}

function drTepMau_(S, oId, chaNguoi, x, n) {
  var segs = drDoan_(x.duong), ten = segs[segs.length - 1];
  var co = drTepMauCo_(S, oId, x.ma), f = co[n.email];
  if (f) { drQuanLy_(S.M, f.id, ten + ' · ' + n.email); drCap_(S.M, f.id, n.email, 'writer', 'user'); return; }
  var mau = drTimMau_(S, ten);
  if (!mau) {
    if (!S.baoMau[ten]) { S.baoMau[ten] = true; ghi_('Tệp mẫu', 'Chưa có mẫu "' + ten + '" trong thư mục QT_MAU: bỏ qua, không lỗi', x.ma); }
    return;
  }
  ghi_('Tệp mẫu', (S.thu ? 'Sẽ chép ' : 'Chép ') + '"' + ten + '"', n.email);
  if (S.thu || drChua_(chaNguoi)) return;
  try {
    var r = Drive.Files.copy({ name: ten, parents: [chaNguoi], appProperties: { sdma: x.ma, sdemail: n.email } }, mau, { supportsAllDrives: true });
    co[n.email] = { id: r.id, name: ten };
    drQuanLy_(S.M, r.id, ten + ' · ' + n.email);
    drCap_(S.M, r.id, n.email, 'writer', 'user');
  } catch (e) { ghi_('LỖI', 'Chép tệp mẫu "' + ten + '": ' + e.message, n.email); }
}

/** WIKI: mỗi tệp trong thư mục người (kể cả thư mục con) → người đó writer trực tiếp. */
function drTepWiki_(S, oId, ma, co) {
  drChiMuc_(S, oId).ds.slice().forEach(function (f) {
    var ap = f.appProperties || {};
    if (ap.sdma !== ma || drChua_(f.id)) return;
    drKiemGio_(S);
    drTepTrong_(f.id).forEach(function (t) {
      drQuanLy_(S.M, t.id, t.name);
      if (co[ap.sdemail]) drCap_(S.M, t.id, ap.sdemail, 'writer', 'user');
    });
  });
}

function drTepTrong_(id) {
  var kq = [];
  drLietKe_({ q: "'" + id + "' in parents and trashed=false" }).forEach(function (f) {
    if (f.mimeType === DR.MIME_TM) kq = kq.concat(drTepTrong_(f.id));
    else if (f.mimeType !== DR.MIME_LT) kq.push(f);
  });
  return kq;
}

/** Mọi thư mục có mã ở ổ gốc đều được đối soát quyền; mã không còn trong CAU_TRUC → báo "ngoài cấu hình". */
function drQuanLyGoc_(S) {
  Object.keys(S.oGoc).forEach(function (o) {
    var oId = S.oGoc[o];
    if (!oId) return;
    var bao = {};
    drChiMuc_(S, oId).ds.forEach(function (f) {
      var ma = (f.appProperties || {}).sdma;
      if (!ma) return;
      if (drMaHopLe_(S, ma)) drQuanLy_(S.M, f.id, f.name);
      else if (!bao[ma]) { bao[ma] = true; ghi_('Ngoài cấu hình', 'Thư mục mang mã "' + ma + '" không còn trong CAU_TRUC (không xóa)', o + ' · ' + f.name); }
    });
  });
}

function drMaHopLe_(S, ma) {
  if (S.maCT[ma] || ma === DR.MA_HV_PT_SUB) return true;
  return /_NHANH$/.test(ma) && !!S.maCT[ma.replace(/_NHANH$/, '')];
}

/* ===================== Ổ CÁ NHÂN ===================== */

function drOCaNhan_(S, n) {
  var C = S.C, kq = S.kqNguoi[n.email] = [], se = S.thu ? 'sẽ ' : '';
  if (!coOCaNhan_(C, n)) {
    if (!n.idO) return;
    var oCu = drLayO_(n.idO);
    if (!oCu) { kq.push('LỖI: không mở được ổ ' + n.idO); ghi_('LỖI', 'Không mở được ổ cá nhân', n.email); return; }
    var r = drDoiSoat_(S, n.idO, {}, 'ổ ' + oCu.name);
    if (r.go) kq.push(se + 'gỡ khỏi thành viên ổ');
    if (n.tt === 'Nghỉ' && khiNghi_(C, n) === 'Giữ ổ' && oCu.name.indexOf(DR.TIEN_TO_NGHI) !== 0) {
      var tenNghi = DR.TIEN_TO_NGHI + oCu.name;
      ghi_('Ổ cá nhân', (S.thu ? 'Sẽ đổi tên ' : 'Đổi tên ') + '"' + oCu.name + '" → "' + tenNghi + '"', n.email);
      if (!S.thu) Drive.Drives.update({ name: tenNghi }, n.idO);
      kq.push(se + 'đổi tên ổ "' + tenNghi + '"');
    }
    if (!kq.length) kq.push(n.tt === 'Nghỉ' ? 'đã nghỉ, ổ giữ nguyên' : 'không còn nhóm, ổ giữ nguyên');
    return;
  }

  var ten = tenOCaNhan_(C, n), id = n.idO;
  var hanChe = { driveMembersOnly: !duocChiaSe_(C, n), domainUsersOnly: false, sharingFoldersRequiresOrganizerPermission: true };
  if (id) {
    var o = drLayO_(id);
    if (!o) { kq.push('LỖI: không mở được ổ ' + id); ghi_('LỖI', 'Không mở được ổ cá nhân (ID ở NGUOI)', n.email); return; }
    if (o.name !== ten) {
      ghi_('Ổ cá nhân', (S.thu ? 'Sẽ đổi tên ' : 'Đổi tên ') + '"' + o.name + '" → "' + ten + '"', n.email);
      if (!S.thu) Drive.Drives.update({ name: ten }, id);
      kq.push(se + 'đổi tên ổ');
    }
    if (drHanChe_(S, id, o.restrictions, hanChe, ten)) kq.push(se + (hanChe.driveMembersOnly ? 'khóa' : 'mở') + ' chia sẻ');
  } else if (S.thu) {
    id = DR.CHUA_TAO + 'O:' + n.email; S.dem.o++;
    ghi_('Ổ cá nhân', 'Sẽ tạo ổ', ten);
    kq.push('sẽ tạo ổ "' + ten + '"');
    if (C.cd.guiThuChao) { S.dem.thu++; ghi_('Thư chào', 'Sẽ gửi', n.email); }
  } else {
    id = drTaoO_(S, ten, hanChe);
    n.idO = id;
    var m = {}; m[n.dong] = id;
    ghiCot_(C.bang.NGUOI, 'ID ổ', m);
    ghi_('Ổ cá nhân', 'Đã tạo ổ', ten);
    kq.push('đã tạo ổ');
    if (C.cd.guiThuChao) drGuiThu_(S, n, id);
  }

  // Thành viên ổ: chính người đó, quyền xem (admin là organizer do tạo ổ)
  var tv = {}; tv[n.email] = { role: 'reader', type: 'user' };
  var rTv = drDoiSoat_(S, id, tv, 'thành viên ổ ' + ten);
  if (rTv.them && !drChua_(id)) kq.push(se + 'thêm vào ổ');

  var M = { quyen: {}, quanLy: {} };
  var dongO = C.cauTruc.filter(function (d) {
    return !S.tenGoc[d.o] && (d.loai === 'Thư mục' || d.loai === 'Chỗ đặt lối tắt') && apChoO_(C, d, n);
  });
  var tm = {};
  var giai = function (d) {
    if (tm.hasOwnProperty(d.ma)) return tm[d.ma];
    tm[d.ma] = null;
    var segs = drDoan_(d.duong);
    var cha = drChaTheoDuong_(S, id, segs.slice(0, -1), {
      timDong: function (t) { var r = dongO.filter(function (x) { return x.duong === t; })[0]; return r ? giai(r) : undefined; }
    });
    var fid = drDamBao_(S, id, cha, segs[segs.length - 1], { sdma: d.ma });
    tm[d.ma] = fid;
    if (fid) {
      drQuanLy_(M, fid, d.duong + ' · ' + n.email);
      var vt = d.loai === 'Thư mục' ? drVaiTuQuyen_(d.quyen) : null;
      if (vt) drCap_(M, fid, n.email, vt, 'user');
    }
    return fid;
  };
  dongO.forEach(giai);

  var L = drLoiTatMongMuon_(S, n, id, tm, M);
  var rLt = drDoiSoatLoiTat_(S, id, L, n.email);
  if (!drChua_(id)) {
    drChiMuc_(S, id).ds.forEach(function (f) {
      var ma = (f.appProperties || {}).sdma;
      if (ma && drMaHopLe_(S, ma)) drQuanLy_(M, f.id, f.name + ' · ' + n.email);
    });
  }
  var rQ = drDoiSoatTatCa_(S, M);
  if (rLt.them || rLt.bo) kq.push(se + (rLt.them ? '+' + rLt.them : '') + (rLt.them && rLt.bo ? ' ' : '') + (rLt.bo ? '−' + rLt.bo : '') + ' lối tắt');
  if (rQ.them + rQ.doi + rQ.go) kq.push(se + 'quyền +' + rQ.them + (rQ.doi ? ' ~' + rQ.doi : '') + (rQ.go ? ' −' + rQ.go : ''));
  if (!kq.length) kq.push('ổ ✔');
}

/** Danh sách lối tắt mong muốn trong ổ cá nhân: [{khoa, cha, dich, ten}]. */
function drLoiTatMongMuon_(S, n, idO, tm, M) {
  var C = S.C, L = [];
  var them = function (khoa, cha, dich, ten) { if (cha && dich) L.push({ khoa: khoa, cha: cha, dich: dich, ten: ten }); };
  var tenNhom = function (g) { return g.ma + ' · ' + g.ten; };
  var dsTv = nhomCuaNguoi_(C, n.email);
  var daCt = dongCauTruc_(C, 'DA_NHOM');
  var loaiDa = daCt ? drDsSauHaiCham_(daCt.nguon) : ['Dự án', 'Ban'];

  C.cauTruc.forEach(function (d) {
    if (S.tenGoc[d.o] || !apChoO_(C, d, n)) return;
    if (d.loai === 'Lối tắt') {
      var m = /→\s*([A-Z0-9_]+)/.exec(d.nguon || '');
      if (!m) { ghi_('LỖI', 'Dòng ' + d.ma + ': cột Nguồn phải có "→ <MÃ>"', d.nguon); return; }
      var dich = S.tmNguoi[m[1]] ? S.tmNguoi[m[1]][n.email] : S.tmGoc[m[1]];
      them(d.ma, idO, dich, d.duong);
      return;
    }
    if (d.loai !== 'Chỗ đặt lối tắt') return;
    var cho = tm[d.ma], nguon = drSauHaiCham_(d.nguon);
    if (!cho) return;
    var theoNhom = function (loc) {
      var da = {};
      dsTv.forEach(function (t) {
        var g = C.nhom[t.ma];
        if (!g || da[g.ma] || !loc(t, g)) return;
        da[g.ma] = true;
        them(d.ma + ':' + g.ma, cho, S.tmTheoNhom[g.ma], tenNhom(g));
      });
    };
    if (nguon === 'Level') {
      levelThayDuoc_(C, n).forEach(function (lv) {
        var g = C.nhom[lv];
        if (g && !drNhomDong_(g)) them(d.ma + ':' + g.ma, cho, S.tmTheoNhom[g.ma], tenNhom(g));
      });
    } else if (nguon === 'Lớp đang học') {
      theoNhom(function (t, g) { return t.vai === 'Thành viên' && g.loai === 'Lớp' && g.tt === 'Đang'; });
    } else if (nguon === 'Lớp đã học') {
      theoNhom(function (t, g) { return t.vai === 'Thành viên' && g.loai === 'Lớp' && g.tt === 'Kết thúc'; });
    } else if (nguon === 'Dự án tham gia') {
      theoNhom(function (t, g) { return loaiDa.indexOf(g.loai) >= 0 && !drNhomDong_(g); });
    } else if (nguon === 'Lớp phụ trách') {
      theoNhom(function (t, g) { return t.vai === 'Phụ trách' && g.loai === 'Lớp' && (g.tt === 'Đang' || g.tt === 'Kết thúc'); });
    } else if (nguon === 'Học viên phụ trách') {
      dsTv.forEach(function (t) {
        var g = C.nhom[t.ma];
        if (!g || t.vai !== 'Phụ trách' || g.loai !== 'Nhóm nhỏ' || drNhomDong_(g)) return;
        var lop = C.nhom[g.thuoc];
        if (!lop || lop.tt !== 'Đang') return;
        var sub = drDamBao_(S, idO, cho, g.ma, { sdma: DR.MA_HV_PT_SUB, sdnhom: g.ma });
        if (!sub) return;
        drQuanLy_(M, sub, g.ma + ' · ' + n.email);
        thanhVienNhom_(C, g.ma, 'Thành viên').forEach(function (x) {
          var hv = C.nguoi[x.email];
          if (!hv || hv.tt !== 'Đang') return;
          var nop = (S.nop[x.email] || {})[lop.ma];
          them('CN_HV_PT:' + g.ma + ':' + x.email, sub, nop, dienMau_('{Mã người} · {Họ tên}', hv, null));
        });
      });
    } else {
      ghi_('LỖI', 'Dòng ' + d.ma + ': Nguồn "' + nguon + '" chưa được hỗ trợ', n.email);
    }
  });
  return L;
}

function drDoiSoatLoiTat_(S, idO, L, ai) {
  var kq = { them: 0, bo: 0 }, se = S.thu ? 'Sẽ ' : '';
  var muon = {};
  L.forEach(function (l) { if (!muon[l.khoa]) muon[l.khoa] = l; });
  var co = {}, thua = [];
  if (!drChua_(idO)) {
    drLietKe_({ corpora: 'drive', driveId: idO, q: "mimeType='" + DR.MIME_LT + "' and trashed=false and appProperties has { key='sdlt' and value='1' }" })
      .forEach(function (f) { var k = (f.appProperties || {}).sdkhoa; if (k && !co[k]) co[k] = f; else thua.push(f); });
  }
  var boVao = function (f, lyDo) {
    kq.bo++; S.dem.ltBo++;
    ghi_('Lối tắt', se + 'bỏ (thùng rác) "' + f.name + '"' + (lyDo ? ' · ' + lyDo : ''), ai);
    if (!S.thu) Drive.Files.update({ trashed: true }, f.id, null, { supportsAllDrives: true });
  };
  Object.keys(muon).forEach(function (k) {
    var l = muon[k], f = co[k];
    if (f && (f.shortcutDetails || {}).targetId !== l.dich && !drChua_(l.dich)) { boVao(f, 'đổi đích'); f = null; }
    delete co[k];
    if (f) {
      if (f.name !== l.ten) {
        ghi_('Lối tắt', se + 'đổi tên "' + f.name + '" → "' + l.ten + '"', ai);
        if (!S.thu) Drive.Files.update({ name: l.ten }, f.id, null, { supportsAllDrives: true });
      }
      var chaCu = (f.parents || [])[0];
      if (chaCu !== l.cha && !drChua_(l.cha)) {
        ghi_('Lối tắt', se + 'chuyển chỗ "' + l.ten + '"', ai);
        if (!S.thu) Drive.Files.update({}, f.id, null, { addParents: l.cha, removeParents: (f.parents || []).join(','), supportsAllDrives: true });
      }
      return;
    }
    kq.them++; S.dem.ltThem++;
    ghi_('Lối tắt', se + 'tạo "' + l.ten + '"', ai);
    if (S.thu || drChua_(l.cha) || drChua_(l.dich)) return;
    try {
      drThuLai_(function () {
        Drive.Files.create({ name: l.ten, mimeType: DR.MIME_LT, parents: [l.cha], shortcutDetails: { targetId: l.dich },
          appProperties: { sdlt: '1', sdkhoa: k } }, null, { supportsAllDrives: true });
      });
    } catch (e) { ghi_('LỖI', 'Tạo lối tắt "' + l.ten + '": ' + e.message, ai); }
  });
  Object.keys(co).forEach(function (k) { boVao(co[k], ''); });
  thua.forEach(function (f) { boVao(f, 'trùng khóa'); });
  return kq;
}

function drGuiThu_(S, n, id) {
  var dCn = dongCauTruc_(S.C, 'CN_CA_NHAN');
  var link = 'https://drive.google.com/drive/folders/' + id;
  var than = 'Chào ' + n.ten + ',\n\n' +
    'Ổ dùng chung mang tên bạn đã sẵn sàng:\n' + link + '\n\n' +
    'Hướng dẫn nhanh:\n' +
    '1. Mở Google Drive, vào mục "Bộ nhớ dùng chung" (Shared drives) để thấy ổ mang tên bạn.\n' +
    '2. Các lối tắt trong ổ dẫn tới tài liệu bạn được xem; không cần tìm ở nơi khác.\n' +
    '3. Tệp riêng của bạn đặt trong thư mục ' + (dCn ? dCn.duong : '90_CA-NHAN') + '.\n\n' +
    'Nếu không mở được, hãy trả lời thư này cho ban quản trị.';
  try { MailApp.sendEmail(n.email, 'Ổ của bạn trên ' + S.C.cd.tenHienThi + ' đã sẵn sàng', than); S.dem.thu++; ghi_('Thư chào', 'Đã gửi', n.email); }
  catch (e) { ghi_('LỖI', 'Gửi thư chào: ' + e.message, n.email); }
}

/* ===================== ĐỐI SOÁT QUYỀN ===================== */

function drQuanLy_(M, fid, nhan) { if (fid && !M.quanLy[fid]) M.quanLy[fid] = nhan || fid; }

function drCap_(M, fid, email, role, type) {
  if (!fid || !email) return;
  var m = M.quyen[fid] = M.quyen[fid] || {};
  if (!m[email] || DR.HANG[role] > DR.HANG[m[email].role]) m[email] = { role: role, type: type };
}

function drCapNhom_(S, M, fid, email, role) { if (S.nhomCo[email]) drCap_(M, fid, email, role, 'group'); }

/** Người/nhóm script được phép gỡ: có ở NGUOI, hoặc nhóm có tiền tố trên miền. Không bao giờ là admin. */
function drQuanLyEmail_(S, e) {
  var cd = S.C.cd;
  if (e === cd.admin) return false;
  if (S.C.nguoi[e]) return true;
  return e.indexOf(cd.tienTo) === 0 && e.slice(-(cd.mien.length + 1)) === '@' + cd.mien;
}

function drDoiSoatTatCa_(S, M) {
  var tong = { them: 0, doi: 0, go: 0 };
  Object.keys(M.quanLy).forEach(function (fid) {
    drKiemGio_(S);
    var r = drDoiSoat_(S, fid, M.quyen[fid] || {}, M.quanLy[fid]);
    tong.them += r.them; tong.doi += r.doi; tong.go += r.go;
  });
  return tong;
}

/** Đối soát quyền trực tiếp của một tệp/thư mục/ổ với tập mong muốn {email: {role, type}}. */
function drDoiSoat_(S, fid, muon, nhan) {
  var kq = { them: 0, doi: 0, go: 0 }, se = S.thu ? 'Sẽ ' : '';
  if (drChua_(fid)) {
    Object.keys(muon).forEach(function (e) {
      kq.them++; S.dem.qThem++;
      ghi_('Quyền', 'Sẽ cấp ' + DR.TEN_QUYEN[muon[e].role] + ' · ' + nhan, e);
    });
    return kq;
  }
  var h;
  try { h = drQuyen_(fid); } catch (err) { ghi_('LỖI', 'Đọc quyền ' + nhan + ': ' + err.message, fid); return kq; }
  Object.keys(muon).forEach(function (e) {
    var m = muon[e], t = h.truc[e];
    if (t && t.role === m.role) return;
    if (!t && h.thuaKe[e] && DR.HANG[h.thuaKe[e]] >= DR.HANG[m.role]) return;
    var viec = (t ? 'đổi quyền → ' : 'cấp ') + DR.TEN_QUYEN[m.role] + ' · ' + nhan;
    if (t) { kq.doi++; S.dem.qDoi++; } else { kq.them++; S.dem.qThem++; }
    ghi_('Quyền', se + viec, e);
    if (S.thu) return;
    try {
      if (t) Drive.Permissions.update({ role: m.role }, fid, t.id, { supportsAllDrives: true });
      else drThuLai_(function () {
        Drive.Permissions.create({ type: m.type, role: m.role, emailAddress: e }, fid, { supportsAllDrives: true, sendNotificationEmail: false });
      });
    } catch (err) { ghi_('LỖI', viec + ': ' + err.message, e); }
  });
  var ngoai = [];
  Object.keys(h.truc).forEach(function (e) {
    if (muon[e]) return;
    if (!drQuanLyEmail_(S, e)) { if (e !== S.C.cd.admin) ngoai.push(e); return; }
    kq.go++; S.dem.qGo++;
    ghi_('Quyền', se + 'gỡ ' + DR.TEN_QUYEN[h.truc[e].role] + ' · ' + nhan, e);
    if (!S.thu) drGoQuyen_(fid, h.truc[e], h.thuaKe[e], e);
  });
  if (ngoai.length) ghi_('Ngoài bảng', 'Có quyền ở ' + nhan + ' nhưng không có trên bảng (không gỡ)', ngoai.join(', '));
  return kq;
}

/** Quyền TRỰC TIẾP (bỏ phần thừa kế) và quyền thừa kế cao nhất, theo email. */
function drQuyen_(fid) {
  var truc = {}, thuaKe = {}, trang = null;
  var caoNhat = function (ds) { return ds.reduce(function (a, d) { return DR.HANG[d.role] > DR.HANG[a] ? d.role : a; }, ds[0].role); };
  do {
    var tham = { supportsAllDrives: true, fields: 'nextPageToken,permissions(id,type,role,emailAddress,permissionDetails)' };
    if (trang) tham.pageToken = trang;
    var r = Drive.Permissions.list(fid, tham);
    (r.permissions || []).forEach(function (p) {
      if ((p.type !== 'user' && p.type !== 'group') || !p.emailAddress) return;
      var e = email_(p.emailAddress), vt = p.role;
      if (p.permissionDetails && p.permissionDetails.length) {
        var tt = p.permissionDetails.filter(function (d) { return d.inherited === false; });
        var tk = p.permissionDetails.filter(function (d) { return d.inherited !== false; });
        var ke = tk.length ? caoNhat(tk) : null;
        if (ke) thuaKe[e] = ke;
        if (!tt.length) return;
        vt = caoNhat(tt);
        if (ke && DR.HANG[vt] <= DR.HANG[ke]) return;     // trực tiếp không hơn thừa kế: coi như không có
      }
      truc[e] = { id: p.id, role: vt, type: p.type };
    });
    trang = r.nextPageToken;
  } while (trang);
  return { truc: truc, thuaKe: thuaKe };
}

/** Gỡ quyền trực tiếp; Google không cho gỡ (còn phần thừa kế) thì hạ về mức thừa kế. */
function drGoQuyen_(fid, t, ke, e) {
  try { Drive.Permissions.remove(fid, t.id, { supportsAllDrives: true }); }
  catch (err) {
    if (!ke) { ghi_('LỖI', 'Gỡ quyền ở ' + fid + ': ' + err.message, e); return; }
    try { Drive.Permissions.update({ role: ke }, fid, t.id, { supportsAllDrives: true }); ghi_('Quyền', 'Không gỡ được, đã hạ về ' + DR.TEN_QUYEN[ke], e); }
    catch (err2) { ghi_('LỖI', 'Gỡ quyền ở ' + fid + ': ' + err.message, e); }
  }
}

/* ===================== DRIVE: TIỆN ÍCH ===================== */

function drChua_(id) { return typeof id === 'string' && id.indexOf(DR.CHUA_TAO) === 0; }
function drNhay_(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function drDoan_(duong) { return String(duong).split('/').map(chuan_).filter(function (x) { return x !== ''; }); }
function drSauHaiCham_(s) { s = chuan_(s); var i = s.indexOf(':'); return i >= 0 ? chuan_(s.slice(i + 1)) : s; }
function drDsSauHaiCham_(s) { return drSauHaiCham_(s).split(',').map(chuan_).filter(function (x) { return x; }); }

function drVaiTuQuyen_(q) {
  q = chuan_(q).toLowerCase();
  if (/tải lên|sửa/.test(q)) return 'writer';
  if (/nhận xét/.test(q)) return 'commenter';
  return null;
}

function drKhoa_(ap) { return [ap.sdma, ap.sdnhom || '', ap.sdemail || '', ap.sdlop || '', ap.sdnhanh || ''].join('|'); }

function drLietKe_(o) {
  var kq = [], trang = null;
  do {
    var tham = { corpora: o.corpora || 'allDrives', includeItemsFromAllDrives: true, supportsAllDrives: true, q: o.q, pageSize: 1000,
      fields: 'nextPageToken,files(id,name,mimeType,parents,appProperties,shortcutDetails)' };
    if (o.driveId) tham.driveId = o.driveId;
    if (trang) tham.pageToken = trang;
    var r = Drive.Files.list(tham);
    kq = kq.concat(r.files || []);
    trang = r.nextPageToken;
  } while (trang);
  return kq;
}

/** Chỉ mục thư mục (chưa vào thùng rác) của một ổ, đọc một lần mỗi lượt. */
function drChiMuc_(S, oId) {
  if (S.idx[oId]) return S.idx[oId];
  var ix = S.idx[oId] = { ds: [], khoa: {} };
  if (drChua_(oId)) return ix;
  drLietKe_({ corpora: 'drive', driveId: oId, q: "mimeType='" + DR.MIME_TM + "' and trashed=false" })
    .forEach(function (f) { drThemChiMuc_(ix, f); });
  return ix;
}

function drThemChiMuc_(ix, f) {
  f.parents = f.parents || [];
  ix.ds.push(f);
  var ap = f.appProperties || {};
  if (!ap.sdma) return;
  var k = drKhoa_(ap);
  if (!ix.khoa[k]) ix.khoa[k] = f;
  else ghi_('Drive', 'Có hai thư mục cùng mã (dùng cái đầu, cái sau để nguyên)', k + ' · ' + f.name);
}

/**
 * Bảo đảm có thư mục: tìm theo appProperties (ap) hoặc, với thư mục trung gian (ap = null), theo cha + tên.
 * Có rồi: đổi tên / chuyển chỗ nếu khác. Chưa có: tạo (Xem trước: trả mã tạm CHUA-TAO:…). khongTao: chỉ tìm.
 */
function drDamBao_(S, oId, chaId, ten, ap, khongTao) {
  if (!oId) return null;
  var ix = drChiMuc_(S, oId), f = null;
  if (ap) f = ix.khoa[drKhoa_(ap)];
  else if (chaId) f = ix.ds.filter(function (x) { return x.parents[0] === chaId && x.name === ten && !(x.appProperties || {}).sdma; })[0];
  var se = S.thu ? 'Sẽ ' : '';
  if (f) {
    if (f.name !== ten) {
      ghi_('Thư mục', se + 'đổi tên "' + f.name + '" → "' + ten + '"', ap ? ap.sdma : '');
      if (!S.thu && !drChua_(f.id)) Drive.Files.update({ name: ten }, f.id, null, { supportsAllDrives: true });
      f.name = ten;
    }
    if (chaId && !drChua_(chaId) && f.parents[0] !== chaId) {
      ghi_('Thư mục', se + 'chuyển chỗ "' + ten + '"', ap ? ap.sdma : '');
      if (!S.thu && !drChua_(f.id)) Drive.Files.update({}, f.id, null, { addParents: chaId, removeParents: f.parents.join(','), supportsAllDrives: true });
      f.parents = [chaId];
    }
    return f.id;
  }
  if (khongTao || !chaId) return null;
  var apMoi = ap || { sdtg: '1' };
  S.dem.tm++;
  ghi_('Thư mục', se + 'tạo "' + ten + '"', ap ? drKhoa_(ap) : '(trung gian)');
  if (S.thu || drChua_(chaId)) {
    var gia = DR.CHUA_TAO + oId + '/' + (ap ? drKhoa_(ap) : chaId + '/' + ten);
    drThemChiMuc_(ix, { id: gia, name: ten, parents: [chaId], appProperties: apMoi });
    return gia;
  }
  var r = drThuLai_(function () {
    return Drive.Files.create({ name: ten, mimeType: DR.MIME_TM, parents: [chaId], appProperties: apMoi }, null, { supportsAllDrives: true });
  });
  drThemChiMuc_(ix, { id: r.id, name: ten, parents: [chaId], appProperties: apMoi });
  return r.id;
}

/**
 * Đi theo các đoạn đường dẫn cha: {Nhánh} → thư mục nhánh gắn mã; tiền tố trùng Đường dẫn của dòng khác → thư mục dòng đó;
 * còn lại → thư mục trung gian không gắn mã. opt: { goc, g, maDong, khongTao, timDong(tienTo) }.
 */
function drChaTheoDuong_(S, oId, segs, opt) {
  var cur = opt.goc || oId;
  for (var k = 0; k < segs.length && cur; k++) {
    var seg = segs[k];
    if (/\{Nhánh\}/.test(seg)) {
      var nhanh = (opt.g && opt.g.nhanh) || 'KHAC';
      cur = drDamBao_(S, oId, cur, dienMau_(seg, null, opt.g), { sdma: opt.maDong + '_NHANH', sdnhanh: nhanh }, opt.khongTao);
      continue;
    }
    var tim = !opt.goc && opt.timDong ? opt.timDong(segs.slice(0, k + 1).join('/')) : undefined;
    cur = tim !== undefined ? tim : drDamBao_(S, oId, cur, seg, null, opt.khongTao);
  }
  return cur;
}

function drThuLai_(fn) {
  for (var i = 0; i < 3; i++) {
    try { return fn(); }
    catch (e) { if (i === 2) throw e; Utilities.sleep(2000 * (i + 1)); }
  }
}

/* ===================== GHI BẢNG ===================== */

function drGhiBang_(S, xong) {
  var C = S.C;
  var thu = function (fn, ten) { try { fn(); } catch (e) { ghi_('LỖI', 'Ghi ' + ten + ': ' + e.message, ''); } };
  thu(function () {
    var m = {};
    C.dsNguoi.forEach(function (n) {
      var kq = S.kqNguoi[n.email];
      m[n.dong] = kq && S.daXuLy[n.email] ? kq.join(' · ') : (!xong ? 'chưa xử lý, sẽ chạy tiếp' : '');
    });
    if (Object.keys(m).length) ghiCot_(C.bang.NGUOI, 'Kết quả Drive', m);
  }, 'NGUOI · Kết quả Drive');
  if (S.thu) return;
  if (Object.keys(S.ghiNhom).length) thu(function () { ghiCot_(C.bang.NHOM, 'ID thư mục', S.ghiNhom); }, 'NHOM · ID thư mục');
  if (Object.keys(S.ghiCt).length) thu(function () { ghiCot_(C.bang.CAU_TRUC, 'ID', S.ghiCt); }, 'CAU_TRUC · ID');
}
