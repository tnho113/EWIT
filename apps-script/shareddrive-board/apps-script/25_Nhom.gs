/**
 * MLWIT · SHARED DRIVE BOARD v2 · NHÓM GOOGLE (Đợt 2)
 * Bảng là gốc: tạo nhóm Google còn thiếu và đồng bộ thành viên theo THANH_VIEN / NGUOI.
 * Dịch vụ nâng cao cần bật: AdminDirectory (Admin SDK Directory) và AdminGroupsSettings (Groups Settings API).
 *
 * Hàm công khai:
 *   dongBoNhom_(C, opt)   → { nhomCo: {email:true}, chuaXong, da }  (30_Drive gọi; đọc P.thu để biết Xem trước)
 *                         opt = { da (con trỏ: nhóm đã xử lý), cheDo: 'day-du'|'thay-doi', batDau }
 *   sdNhomXemTruoc()      lệnh tạm: không gọi lệnh ghi nào lên Groups/Mail, chỉ ghi "sẽ …"
 *   sdNhomApDung()        lệnh tạm: áp dụng thật, đầy đủ, từ đầu
 *   sdNhomTiep()          chạy tiếp từ con trỏ (ScriptProperties SD_CT_NHOM_*) — hàm hẹn giờ
 *   sdBam_, sdLuuJson_, sdDocJson_, sdXoaJson_   tiện ích chung (30_Drive cũng dùng)
 *
 * Đợt 2b:
 *  - Nhóm riêng sd-u-<Mã hệ thống> cho mọi người có Mã hệ thống: thành viên = email hiện tại khi coOCaNhan_
 *    (người có thư mục theo người luôn có coOCaNhan_ vì cần là thành viên Đang của nhóm còn hiệu lực).
 *    Gỡ mọi thành viên khác (kể cả email cũ không còn ở NGUOI), trừ OWNER và admin. Chưa có Mã hệ thống → không tạo, ghi nhật ký.
 *  - Trùng email nhóm (2 chủ khác nhau, kể cả -sua/-pt, sd-u-, sd-all-) → LỖI ở NHOM "Kết quả" + NHAT_KY; không tạo, không vào nhomCo.
 *  - Nhóm Đóng/Ngừng: theo nhomConHieuLuc_.
 *  - Dấu thay đổi: ScriptProperties SDH_G_<email> = (1|0 có nhóm) + băm tập thành viên, ghi sau khi đồng bộ không lỗi.
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

function sdNhomXemTruoc() { chayPhien_('Nhóm Google · Xem trước', function () { P.thu = true; nhChay_(false); }); }
/** Áp dụng tay: chạy đầy đủ từ đầu (bỏ con trỏ cũ). */
function sdNhomApDung() { chayPhien_('Nhóm Google · Áp dụng', function () { P.thu = false; nhChay_(false); }); }
/** Chạy tiếp từ con trỏ (trình kích hoạt hẹn giờ gọi khi lượt trước hết giờ). */
function sdNhomTiep() { chayPhien_('Nhóm Google · Chạy tiếp', function () { P.thu = false; nhXoaHenGio_(); nhChay_(true); }, 'sdNhomTiep'); }

function nhChay_(tiep) {
  var C = taiDuLieu_();
  var da = (!P.thu && tiep) ? (sdDocJson_('SD_CT_NHOM') || {}) : {};
  var kq = dongBoNhom_(C, { da: da, cheDo: 'day-du' });
  if (!P.thu) { if (kq.chuaXong) sdLuuJson_('SD_CT_NHOM', kq.da); else sdXoaJson_('SD_CT_NHOM'); }
  var n = Object.keys(kq.nhomCo).length;
  P.tomTat = n + ' nhóm' + (P.thu ? ' (xem trước, chưa thay đổi gì)' : '') + (kq.chuaXong ? ' · chưa xong, sẽ chạy tiếp.' : '.');
}

/**
 * Đồng bộ nhóm Google theo bảng. Trả { nhomCo, chuaXong, da }.
 * opt (tùy chọn): { da: {email: 1|0} nhóm đã xử lý ở lượt trước (con trỏ), cheDo: 'day-du'|'thay-doi', batDau: ms }.
 * Chế độ 'thay-doi' (chỉ Áp dụng): bỏ qua nhóm có dấu thành viên mong muốn không đổi so với lần đồng bộ thành công trước.
 */
function dongBoNhom_(C, opt) {
  opt = opt || {};
  var thu = !!(P && P.thu), batDau = opt.batDau || Date.now(), chuaXong = false;
  var da = opt.da || {}, thayDoi = opt.cheDo === 'thay-doi' && !thu;
  var pr = PropertiesService.getScriptProperties();
  var kqNhom = {};                       // mã nhóm → { dong, phan: [], emailXem }
  var dsMuc = nhMucTieu_(C);

  for (var i = 0; i < dsMuc.length; i++) {
    var m = dsMuc[i];
    if (m.trung) {
      if (m.ma) {
        var kt = kqNhom[m.ma] = kqNhom[m.ma] || { dong: C.nhom[m.ma].dong, phan: [], emailXem: '' };
        kt.phan.push('LỖI trùng email ' + m.email + ' (với ' + m.trung.filter(function (x) { return x !== m.nhan; }).join(', ') + '): không tạo, không cấp');
      }
      continue;
    }
    if (da.hasOwnProperty(m.email)) continue;                    // đã xử lý ở lượt trước
    if (Date.now() - batDau > NH_GIOI_HAN) { chuaXong = true; break; }
    var dau = nhDauMuc_(m), khoaDau = 'SDH_G_' + m.email, cu = thayDoi ? pr.getProperty(khoaDau) : null;
    if (cu && cu.slice(1) === dau) { da[m.email] = cu.charAt(0) === '1' ? 1 : 0; continue; }
    var r = nhXuLyMuc_(C, m, thu);
    da[m.email] = r.co ? 1 : 0;
    if (!thu) { if (r.loi) pr.deleteProperty(khoaDau); else pr.setProperty(khoaDau, (r.co ? '1' : '0') + dau); }
    if (m.ma) {
      var k = kqNhom[m.ma] = kqNhom[m.ma] || { dong: C.nhom[m.ma].dong, phan: [], emailXem: '' };
      if (m.hau === '' && r.co) k.emailXem = m.email;
      if (r.tomTat) k.phan.push((m.hau ? '-' + m.hau : m.email.split('@')[0]) + ': ' + r.tomTat);
    } else if (r.tomTat) {
      ghi_('Nhóm', m.rieng ? 'Nhóm riêng' : 'Nhóm tổng', m.email + ' · ' + r.tomTat);
    }
  }

  nhGhiBang_(C, kqNhom, thu);
  if (chuaXong) {
    ghi_('Nhóm', 'Chưa xong, sẽ chạy tiếp', thu ? 'hết giờ (Xem trước)' : 'hẹn chạy lại sau 1 phút');
    // Chỉ tự hẹn khi chạy riêng lệnh Nhóm; khi Drive gọi, Drive tự hẹn chạy tiếp và giữ con trỏ.
    if (!thu && !P.goiTuDrive) ScriptApp.newTrigger('sdNhomTiep').timeBased().after(60000).create();
  } else if (!thu) {
    nhXoaHenGio_();
  }
  var nhomCo = {};
  Object.keys(da).forEach(function (e) { if (da[e] === 1) nhomCo[e] = true; });
  return { nhomCo: nhomCo, chuaXong: chuaXong, da: da };
}

/** Dấu của một nhóm mong muốn (email + tập thành viên). */
function nhDauMuc_(m) { return sdBam_(m.email + '|' + Object.keys(m.tv).sort().join(',')); }

/**
 * Danh sách nhóm mong muốn: { email, ten, nhan, ma (null nếu nhóm tổng/riêng), hau, rieng, tv: {email:true}, trung? }.
 * Nhóm riêng sd-u-<Mã hệ thống>: mọi người có maHT; thành viên = email hiện tại nếu coOCaNhan_, không thì rỗng.
 * Trùng email (2 chủ khác nhau ra cùng email) → m.trung = [các chủ], ghi LỖI, không tạo/đồng bộ/cấp.
 */
function nhMucTieu_(C) {
  var ds = [];
  C.dsNhom.forEach(function (g) {
    var dong = !nhomConHieuLuc_(C, g.ma);
    var theoHau = { '': {}, sua: {}, pt: {} };
    if (!dong) thanhVienNhom_(C, g.ma).forEach(function (t) { theoHau[hauToCua_(t)][t.email] = true; });
    [['', 'Xem'], ['sua', 'Sửa'], ['pt', 'Phụ trách']].forEach(function (h) {
      ds.push({ email: emailNhom_(C, g.ma, h[0]), ten: g.ten + ' · ' + h[1], nhan: 'nhóm ' + g.ma + (h[0] ? ' (' + h[0] + ')' : ''),
        ma: g.ma, hau: h[0], tv: theoHau[h[0]] });
    });
  });
  var ef = {}, hv = {};
  C.dsNguoi.forEach(function (n) {
    var co = coOCaNhan_(C, n);
    if (co) {
      if (n.vaiTro === 'EF' || n.vaiTro === 'GV' || n.vaiTro === 'Tổ chức') ef[n.email] = true;
      else if (n.vaiTro === 'HV') hv[n.email] = true;
    }
    var eR = emailNhomRieng_(C, n);
    if (!eR) {
      if (co) ghi_('Nhóm', 'Chưa có Mã hệ thống: chưa tạo nhóm riêng (chạy Nâng cấp bảng để cấp mã)', n.email);
      return;
    }
    var tv = {}; if (co) tv[n.email] = true;
    ds.push({ email: eR, ten: 'Riêng · ' + n.maHT + ' · ' + n.ten, nhan: 'nhóm riêng ' + n.maHT, ma: null, hau: 'u', rieng: true, tv: tv });
  });
  ds.push({ email: emailTong_(C, 'ef'), ten: 'Tất cả EF/GV/Tổ chức', nhan: 'nhóm tổng EF', ma: null, hau: 'ef', tv: ef });
  ds.push({ email: emailTong_(C, 'hv'), ten: 'Tất cả HV', nhan: 'nhóm tổng HV', ma: null, hau: 'hv', tv: hv });

  // Trùng email nhóm
  var chu = {}, kq = [];
  ds.forEach(function (m) {
    var c = chu[m.email] = chu[m.email] || [];
    if (c.indexOf(m.nhan) >= 0) return;                          // dòng lặp cùng mã: bỏ dòng sau
    c.push(m.nhan); kq.push(m);
  });
  kq.forEach(function (m) { if (chu[m.email].length > 1) m.trung = chu[m.email]; });
  Object.keys(chu).forEach(function (e) {
    if (chu[e].length > 1) ghi_('LỖI', 'Trùng email nhóm: không tạo, không cấp quyền cho email này (đổi Mã nhóm)', e + ' · ' + chu[e].join(', '));
  });
  return kq;
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
  catch (e) { ghi_('LỖI', 'Không đọc được nhóm', m.email + ' · ' + e.message); r.tomTat = 'LỖI đọc nhóm: ' + e.message; r.loi = true; return r; }

  if (!co) {
    if (!mong.length) return r;                                  // chưa có và không cần → không tạo
    ghi_('Nhóm', thu ? 'Sẽ tạo nhóm' : 'Tạo nhóm', m.email + ' · ' + m.ten);
    if (!thu) {
      try {
        AdminDirectory.Groups.insert({ email: m.email, name: m.ten, description: 'Tự động theo bảng Shared Drive. Không sửa thành viên bằng tay.' });
        if (typeof glGhiSo_ === 'function') glGhiSo_(C, 'Nhóm', m.email, m.ten);
      } catch (e) {
        ghi_('LỖI', 'Tạo nhóm', m.email + ' · ' + e.message);
        r.tomTat = 'LỖI tạo: ' + e.message; r.loi = true; return r;
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
    catch (e) { ghi_('LỖI', 'Không đọc được thành viên', m.email + ' · ' + e.message); phan.push('LỖI đọc thành viên'); r.tomTat = phan.join(' '); r.loi = true; return r; }
  }

  var them = mong.filter(function (e) { return !hien[e]; });
  var go = [], ngoai = [];
  Object.keys(hien).forEach(function (e) {
    if (m.tv[e] || hien[e] === 'OWNER' || e === C.cd.admin) return;
    if (C.nguoi[e] || m.rieng) go.push(e); else ngoai.push(e);   // nhóm riêng: chỉ giữ đúng một người
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
  r.loi = phan.some(function (p) { return /LỖI|đặt cài đặt sau/.test(p); });
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
    var h = t.getHandlerFunction && t.getHandlerFunction();
    if (h === 'sdNhomApDung' || h === 'sdNhomTiep') ScriptApp.deleteTrigger(t);
  });
}

/* ===================== TIỆN ÍCH DÙNG CHUNG (25_Nhom + 30_Drive) ===================== */

/** Băm chuỗi (FNV-1a 32 bit, hai hạt) → chuỗi ngắn. Dùng cho "dấu thay đổi". */
function sdBam_(s) {
  s = String(s);
  var h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c; h2 = Math.imul(h2, 0x5bd1e995) >>> 0; h2 ^= h2 >>> 13;
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

/** Lưu đối tượng JSON vào ScriptProperties, chia khúc 8000 ký tự (giới hạn 9 KB/giá trị). */
function sdLuuJson_(khoa, obj) {
  var pr = PropertiesService.getScriptProperties(), s = JSON.stringify(obj), n = Math.ceil(s.length / 8000) || 1;
  var cu = Number(pr.getProperty(khoa + '_n')) || 0;
  for (var i = 0; i < n; i++) pr.setProperty(khoa + '_' + i, s.slice(i * 8000, (i + 1) * 8000));
  for (var j = n; j < cu; j++) pr.deleteProperty(khoa + '_' + j);
  pr.setProperty(khoa + '_n', String(n));
}

function sdDocJson_(khoa) {
  var pr = PropertiesService.getScriptProperties(), n = Number(pr.getProperty(khoa + '_n')) || 0, s = '';
  if (!n) return null;
  for (var i = 0; i < n; i++) s += pr.getProperty(khoa + '_' + i) || '';
  try { return JSON.parse(s); } catch (e) { return null; }
}

function sdXoaJson_(khoa) {
  var pr = PropertiesService.getScriptProperties(), n = Number(pr.getProperty(khoa + '_n')) || 0;
  for (var i = 0; i < n; i++) pr.deleteProperty(khoa + '_' + i);
  pr.deleteProperty(khoa + '_n');
}
