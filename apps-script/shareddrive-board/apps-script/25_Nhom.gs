/**
 * MLWIT · SHARED DRIVE BOARD v2 · NHÓM GOOGLE (Đợt 2)
 * Bảng là gốc: tạo nhóm Google còn thiếu và đồng bộ thành viên theo THANH_VIEN / NGUOI.
 * Dịch vụ nâng cao cần bật: AdminDirectory (Admin SDK Directory) và AdminGroupsSettings (Groups Settings API).
 *
 * Hàm công khai:
 *   dongBoNhom_(C)        → { nhomCo: {email:true}, chuaXong: bool }  (30_Drive gọi; đọc P.thu để biết Xem trước)
 *   sdNhomXemTruoc()      lệnh tạm: không gọi lệnh ghi nào lên Groups/Mail, chỉ ghi "sẽ …"
 *   sdNhomApDung()        lệnh tạm: áp dụng thật (cũng là hàm hẹn giờ chạy tiếp)
 *
 * Giả định (hợp đồng thiếu/chưa nói rõ):
 *  - P.thu được đặt BÊN TRONG hàm truyền cho chayPhien_ (chayPhien_ tạo P mới mỗi lần).
 *  - Không bao giờ gỡ: thành viên vai OWNER, và chính Email admin (kể cả khi admin có ở NGUOI).
 *  - "Người trên bảng" (được phép gỡ) = mọi email ở NGUOI; email khác chỉ báo "ngoài bảng".
 *  - Lỗi khi lấy nhóm (Groups.get) mà không phải "không tìm thấy" → ghi LỖI, bỏ qua nhóm đó, không tạo.
 *  - Nhóm đã tồn tại có tập mong muốn rỗng: đồng bộ gỡ người trên bảng, nhưng không tạo/xóa nhóm.
 *  - Hết giờ (NH_GIOI_HAN ms kể từ đầu dongBoNhom_) → dừng an toàn, trả chuaXong:true, hẹn sdNhomApDung sau 1 phút
 *    (chỉ khi Áp dụng). Trình kích hoạt hẹn giờ được xóa khi chạy xong.
 *  - Cột "Email nhóm" ở NHOM chỉ được ghi khi nhóm Xem (hậu tố '') đã có / sẽ tạo; nếu không thì để nguyên.
 *  - Cài đặt nhóm: PropertiesService NHOM_CAIDAT_<email>='ok' khi đặt thành công; chưa 'ok' thì thử lại ở lần sau.
 */
var NH_GIOI_HAN = 270000;   // 4,5 phút
var NH_CAI_DAT = {
  allowExternalMembers: 'true', whoCanJoin: 'INVITED_CAN_JOIN', whoCanPostMessage: 'ALL_MANAGERS_CAN_POST',  // NONE_CAN_POST bị Google từ chối nếu nhóm không ở chế độ lưu trữ
  whoCanViewMembership: 'ALL_MANAGERS_CAN_VIEW', whoCanViewGroup: 'ALL_MANAGERS_CAN_VIEW',
  whoCanDiscoverGroup: 'ALL_MEMBERS_CAN_DISCOVER', whoCanContactOwner: 'ALL_MANAGERS_CAN_CONTACT'
};

function sdNhomXemTruoc() { chayPhien_('Nhóm Google · Xem trước', function () { P.thu = true; nhChay_(); }); }
function sdNhomApDung() { chayPhien_('Nhóm Google · Áp dụng', function () { P.thu = false; nhChay_(); }); }

function nhChay_() {
  var C = taiDuLieu_();
  var kq = dongBoNhom_(C);
  var n = Object.keys(kq.nhomCo).length;
  P.tomTat = n + ' nhóm' + (P.thu ? ' (xem trước, chưa thay đổi gì)' : '') + (kq.chuaXong ? ' · chưa xong, sẽ chạy tiếp.' : '.');
}

/** Đồng bộ nhóm Google theo bảng. Trả { nhomCo, chuaXong }. */
function dongBoNhom_(C) {
  var thu = !!(P && P.thu), batDau = Date.now(), nhomCo = {}, chuaXong = false;
  var kqNhom = {};                       // mã nhóm → { dong, phan: [], emailXem }
  var dsMuc = nhMucTieu_(C);

  for (var i = 0; i < dsMuc.length; i++) {
    var m = dsMuc[i];
    if (Date.now() - batDau > NH_GIOI_HAN) { chuaXong = true; break; }
    var r = nhXuLyMuc_(C, m, thu);
    if (r.co) nhomCo[m.email] = true;
    if (m.ma) {
      var k = kqNhom[m.ma] = kqNhom[m.ma] || { dong: C.nhom[m.ma].dong, phan: [], emailXem: '' };
      if (m.hau === '' && r.co) k.emailXem = m.email;
      if (r.tomTat) k.phan.push((m.hau ? '-' + m.hau : m.email.split('@')[0]) + ': ' + r.tomTat);
    } else if (r.tomTat) {
      ghi_('Nhóm', 'Nhóm tổng', m.email + ' · ' + r.tomTat);
    }
  }

  nhGhiBang_(C, kqNhom, thu);
  if (chuaXong) {
    ghi_('Nhóm', 'Chưa xong, sẽ chạy tiếp', thu ? 'hết giờ (Xem trước)' : 'hẹn chạy lại sau 1 phút');
    // Chỉ tự hẹn khi chạy riêng lệnh Nhóm; khi Drive gọi, Drive tự hẹn chạy tiếp cả hai.
    if (!thu && !P.goiTuDrive) ScriptApp.newTrigger('sdNhomApDung').timeBased().after(60000).create();
  } else if (!thu) {
    nhXoaHenGio_();
  }
  return { nhomCo: nhomCo, chuaXong: chuaXong };
}

/** Danh sách nhóm mong muốn: { email, ten, mo, ma (null nếu nhóm tổng), hau, tv: {email:true} }. */
function nhMucTieu_(C) {
  var ds = [];
  C.dsNhom.forEach(function (g) {
    var dong = g.tt === 'Đóng' || g.tt === 'Ngừng';
    var theoHau = { '': {}, sua: {}, pt: {} };
    if (!dong) thanhVienNhom_(C, g.ma).forEach(function (t) { theoHau[hauToCua_(t)][t.email] = true; });
    [['', 'Xem'], ['sua', 'Sửa'], ['pt', 'Phụ trách']].forEach(function (h) {
      ds.push({ email: emailNhom_(C, g.ma, h[0]), ten: g.ten + ' · ' + h[1], ma: g.ma, hau: h[0], tv: theoHau[h[0]] });
    });
  });
  var ef = {}, hv = {};
  C.dsNguoi.forEach(function (n) {
    if (!coOCaNhan_(C, n)) return;
    if (n.vaiTro === 'EF' || n.vaiTro === 'GV' || n.vaiTro === 'Tổ chức') ef[n.email] = true;
    else if (n.vaiTro === 'HV') hv[n.email] = true;
  });
  ds.push({ email: emailTong_(C, 'ef'), ten: 'Tất cả EF/GV/Tổ chức', ma: null, hau: 'ef', tv: ef });
  ds.push({ email: emailTong_(C, 'hv'), ten: 'Tất cả HV', ma: null, hau: 'hv', tv: hv });
  return ds;
}

function nhKhongTimThay_(e) { return /not\s*found|notfound|404|does not exist/i.test(String(e && e.message || e)); }

function nhTonTai_(email) {
  try { AdminDirectory.Groups.get(email); return true; }
  catch (e) { if (nhKhongTimThay_(e)) return false; throw e; }
}

/** Thành viên hiện có: { email: role }. */
function nhThanhVienHienCo_(email) {
  var kq = {}, tok = null;
  do {
    var res = AdminDirectory.Members.list(email, { maxResults: 200, pageToken: tok });
    (res && res.members || []).forEach(function (m) { kq[String(m.email).toLowerCase()] = m.role || 'MEMBER'; });
    tok = res && res.nextPageToken;
  } while (tok);
  return kq;
}

function nhDatCaiDat_(email) {
  var pr = PropertiesService.getScriptProperties(), khoa = 'NHOM_CAIDAT_' + email;
  if (pr.getProperty(khoa) === 'ok') return null;
  try { AdminGroupsSettings.Groups.patch(NH_CAI_DAT, email); pr.setProperty(khoa, 'ok'); return true; }
  catch (e) { ghi_('Nhóm', 'Đặt cài đặt sau', email + ' · ' + e.message); return false; }
}

/** Xử lý một nhóm. Trả { co, tomTat }. */
function nhXuLyMuc_(C, m, thu) {
  var mong = Object.keys(m.tv), r = { co: false, tomTat: '' }, phan = [];
  var co;
  try { co = nhTonTai_(m.email); }
  catch (e) { ghi_('LỖI', 'Không đọc được nhóm', m.email + ' · ' + e.message); r.tomTat = 'LỖI đọc nhóm: ' + e.message; return r; }

  if (!co) {
    if (!mong.length) return r;                                  // chưa có và không cần → không tạo
    ghi_('Nhóm', thu ? 'Sẽ tạo nhóm' : 'Tạo nhóm', m.email + ' · ' + m.ten);
    if (!thu) {
      try {
        AdminDirectory.Groups.insert({ email: m.email, name: m.ten, description: 'Tự động theo bảng Shared Drive. Không sửa thành viên bằng tay.' });
      } catch (e) {
        ghi_('LỖI', 'Tạo nhóm', m.email + ' · ' + e.message);
        r.tomTat = 'LỖI tạo: ' + e.message; return r;
      }
    }
    r.co = true; phan.push('tạo');
  } else {
    r.co = true;
  }

  if (!thu && nhDatCaiDat_(m.email) === false) phan.push('đặt cài đặt sau');

  var hien = co ? null : {};
  if (co) {
    try { hien = nhThanhVienHienCo_(m.email); }
    catch (e) { ghi_('LỖI', 'Không đọc được thành viên', m.email + ' · ' + e.message); phan.push('LỖI đọc thành viên'); r.tomTat = phan.join(' '); return r; }
  }

  var them = mong.filter(function (e) { return !hien[e]; });
  var go = [], ngoai = [];
  Object.keys(hien).forEach(function (e) {
    if (m.tv[e] || hien[e] === 'OWNER' || e === C.cd.admin) return;
    if (C.nguoi[e]) go.push(e); else ngoai.push(e);
  });

  them.forEach(function (e) {
    ghi_('Nhóm', (thu ? 'Sẽ thêm vào ' : 'Thêm vào ') + m.email, e);
    if (thu) return;
    try { nhThemThanhVien_(e, m.email); }
    catch (err) {
      if (/already exist|duplicate|409/i.test(String(err.message))) return;
      ghi_('LỖI', 'Thêm vào ' + m.email, e + ' · ' + err.message); phan.push('LỖI thêm ' + e);
    }
  });
  go.forEach(function (e) {
    ghi_('Nhóm', (thu ? 'Sẽ gỡ khỏi ' : 'Gỡ khỏi ') + m.email, e);
    if (thu) return;
    try { AdminDirectory.Members.remove(m.email, e); }
    catch (err) { ghi_('LỖI', 'Gỡ khỏi ' + m.email, e + ' · ' + err.message); phan.push('LỖI gỡ ' + e); }
  });
  if (ngoai.length) ghi_('Nhóm', 'Ngoài bảng (không gỡ, cần xem lại)', m.email + ': ' + ngoai.join(', '));

  var dem = (them.length ? '+' + them.length : '') + (go.length ? (them.length ? ' ' : '') + '−' + go.length : '');
  if (dem) phan.push(dem);
  if (ngoai.length) phan.push('ngoài bảng ' + ngoai.length);
  r.tomTat = phan.join(' ');
  if (thu && r.tomTat && phan.some(function (p) { return p === 'tạo' || /^[+−]/.test(p); })) r.tomTat = 'sẽ ' + r.tomTat;
  return r;
}

/** Ghi "Email nhóm" và "Kết quả" ở NHOM (theo tên cột), cả Xem trước lẫn Áp dụng. */
/** Thêm thành viên; nhóm vừa tạo có thể chưa "thấy" được ngay → chờ rồi thử lại tối đa 3 lần. */
function nhThemThanhVien_(e, emailNhom) {
  for (var i = 0; i < 3; i++) {
    try { return AdminDirectory.Members.insert({ email: e, role: 'MEMBER' }, emailNhom); }
    catch (err) {
      if (i === 2 || !nhKhongTimThay_(err)) throw err;
      Utilities.sleep(3000 * (i + 1));
    }
  }
}

function nhGhiBang_(C, kqNhom, thu) {
  var email = {}, ketQua = {};
  Object.keys(kqNhom).forEach(function (ma) {
    var k = kqNhom[ma];
    if (k.emailXem) email[k.dong] = k.emailXem;
    ketQua[k.dong] = k.phan.length ? k.phan.join('; ') : 'không đổi';
  });
  if (Object.keys(email).length) ghiCot_(C.bang.NHOM, 'Email nhóm', email);
  if (Object.keys(ketQua).length) ghiCot_(C.bang.NHOM, 'Kết quả', ketQua);
}

function nhXoaHenGio_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction && t.getHandlerFunction() === 'sdNhomApDung') ScriptApp.deleteTrigger(t);
  });
}
