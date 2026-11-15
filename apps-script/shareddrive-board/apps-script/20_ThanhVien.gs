/**
 * MLWIT · SHARED DRIVE BOARD v2 · ĐƯA VÀO DANH SÁCH TỔNG
 * Đọc sổ việc NHAP, cập nhật NGUOI và THANH_VIEN. Không chạm Drive.
 * Sau khi chạy: dòng ✔ chuyển sang tab LS_NHAP (lịch sử nhập) và bị xóa khỏi NHAP;
 * dòng LỖI ở lại NHAP (dồn lên đầu) để sửa rồi chạy lại. NHAP luôn trống cho lần nhập sau.
 * Dòng không có Email: bỏ qua và xóa. Cột "Lỗi" của NHAP chỉ có chữ ở dòng cần sửa.
 *
 * Quy tắc:
 *  - Khóa của THANH_VIEN là Email + Mã nhóm.
 *  - Thêm trùng hoàn toàn: bỏ qua. Cùng nhóm, khác Vai/Quyền: cập nhật dòng cũ, ghi Lịch sử.
 *  - Email mới lần đầu: tự tạo người ở NGUOI (cần Họ tên và Vai trò).
 *  - Thêm vào một Level: tự rời Level cũ (mỗi EF một Level đang).
 *  - Thêm vào Nhóm nhỏ (vai Thành viên): tự vào Lớp chứa nó; tự rời nhóm nhỏ khác cùng lớp.
 *  - Gỡ khỏi Lớp: tự gỡ các nhóm nhỏ của lớp đó.
 *  - Nghỉ: người chuyển "Nghỉ", gỡ mọi nhóm. Thêm lại sau này: người "Đang" lại.
 */
function duaVaoTong_(cd) {
  var nhap = docTab_(TAB.NHAP);
  var nhom = docNhom_();
  var nguoi = docNguoi_();
  var tv = docThanhVien_();
  var kq = {}, dem = { xong: 0, loi: 0 };

  nhap.dong.forEach(function (d) {
    if (!chuan_(d['Email'])) return;                         // dòng trống: bỏ qua
    var r = xuLyDongNhap_(d, nhom, nguoi, tv);
    kq[d._dong] = r;
    if (r.indexOf('LỖI') === 0) { dem.loi++; P.loi++; } else { dem.xong++; }
  });

  ghiDeTab_(TAB.NGUOI, COT.NGUOI, nguoi.ds);
  ghiDeTab_(TAB.THANH_VIEN, COT.THANH_VIEN, tv.ds);
  P.tomTat = dem.xong + ' dòng xong, ' + dem.loi + ' dòng lỗi.';
  donNhap_(nhap, kq);
  ghi_('Thành viên', 'Đưa vào danh sách tổng', P.tomTat);
}

/* ---------- Đọc dữ liệu ---------- */

function docNhom_() {
  var b = docTab_(TAB.NHOM), m = {};
  b.dong.forEach(function (d) {
    var ma = maNhom_(d['Mã nhóm']);
    if (!ma) return;
    m[ma] = { ma: ma, ten: chuan_(d['Tên nhóm']), loai: chuan_(d['Loại']), thuoc: maNhom_(d['Thuộc']), tt: chuan_(d['Trạng thái']) || 'Đang' };
  });
  return m;
}

function docNguoi_() {
  var b = docTab_(TAB.NGUOI), m = {}, ds = [];
  b.dong.forEach(function (d) {
    var o = {}; COT.NGUOI.forEach(function (c) { o[c] = d[c] !== undefined ? d[c] : ''; });
    o['Email'] = email_(o['Email']);
    if (!o['Email']) return;
    m[o['Email']] = o; ds.push(o);
  });
  return { m: m, ds: ds };
}

function docThanhVien_() {
  var b = docTab_(TAB.THANH_VIEN), m = {}, ds = [];
  b.dong.forEach(function (d) {
    var o = {}; COT.THANH_VIEN.forEach(function (c) { o[c] = d[c] !== undefined ? d[c] : ''; });
    o['Email'] = email_(o['Email']); o['Mã nhóm'] = maNhom_(o['Mã nhóm']);
    if (!o['Email'] || !o['Mã nhóm']) return;
    m[o['Email'] + '|' + o['Mã nhóm']] = o; ds.push(o);
  });
  return { m: m, ds: ds };
}

/** Chuyển dòng ✔ sang LS_NHAP, giữ dòng LỖI ở NHAP (dồn lên đầu), xóa phần còn lại. */
function donNhap_(nhap, kq) {
  var giu = [], ls = [], luc = bayGio_(), dongCuoi = 1;
  nhap.dong.forEach(function (d) {
    dongCuoi = Math.max(dongCuoi, d._dong);
    if (!chuan_(d['Email'])) return;
    var r = kq[d._dong] || '';
    var o = {}; nhap.tieuDe.forEach(function (td) { if (td) o[td] = d[td] !== undefined ? d[td] : ''; });
    if (r.indexOf('✔') === 0) { o['Kết quả'] = r; o['Thời gian xử lý'] = luc; ls.push(o); }
    else { o['Lỗi'] = r; giu.push(o); }
  });
  if (ls.length) {
    var tabLs = P.ss.getSheetByName(TAB.LS_NHAP);
    if (!tabLs) { tabLs = P.ss.insertSheet(TAB.LS_NHAP); tabLs.appendRow(COT.LS_NHAP); }
    var tdLs = tabLs.getRange(1, 1, 1, Math.max(tabLs.getLastColumn(), 1)).getValues()[0].map(chuan_);
    var v = ls.map(function (o) { return tdLs.map(function (td) { return o[td] !== undefined ? o[td] : ''; }); });
    tabLs.getRange(tabLs.getLastRow() + 1, 1, v.length, tdLs.length).setValues(v);
  }
  var soDong = dongCuoi - 1;
  if (soDong < 1) return;
  nhap.tieuDe.forEach(function (td, c) {
    if (!td || td === 'Tình trạng') return;                 // cột công thức: không ghi
    if (td === 'Kết quả' || td === 'Mã xử lý') return;      // cột cũ (nếu còn): không dùng
    var cot = [];
    for (var i = 0; i < soDong; i++) cot.push([i < giu.length ? giu[i][td] : '']);
    nhap.tab.getRange(2, c + 1, soDong, 1).setValues(cot);
  });
  P.tomTat += ' Đã chuyển ' + ls.length + ' dòng sang LS_NHAP' + (giu.length ? ', ' + giu.length + ' dòng lỗi ở lại NHAP.' : '.');
}

/* ---------- Xử lý một dòng ---------- */

function xuLyDongNhap_(d, nhom, nguoi, tv) {
  var email = email_(d['Email']);
  var viec = chuan_(d['Việc']) || 'Thêm';
  var nguon = 'NHAP dòng ' + d._dong + ' · ' + homNay_();
  if (!emailHopLe_(email)) return 'LỖI: email không hợp lệ';
  if (DS.VIEC.indexOf(viec) < 0) return 'LỖI: Việc phải là Thêm, Gỡ hoặc Nghỉ';
  var ng = nguoi.m[email];

  if (viec === 'Nghỉ') {
    if (!ng) return 'LỖI: chưa có người này ở danh sách tổng';
    if (ng['Trạng thái'] === 'Nghỉ') return '✔ đã ghi nghỉ trước đó';
    ng['Trạng thái'] = 'Nghỉ'; ng['Level'] = ''; ng['Cập nhật'] = bayGio_();
    var soGo = 0;
    tv.ds.forEach(function (t) {
      if (t['Email'] === email && t['Trạng thái'] === 'Đang') { datTrangThai_(t, 'Gỡ', 'nghỉ', nguon); soGo++; }
    });
    ghi_('Thành viên', 'Nghỉ, gỡ ' + soGo + ' nhóm', email);
    return '✔ ghi nghỉ, gỡ khỏi ' + soGo + ' nhóm';
  }

  var ma = maNhom_(d['Mã nhóm']);
  var n = nhom[ma];
  if (!ma) return 'LỖI: thiếu Mã nhóm';
  if (!n) return 'LỖI: chưa có nhóm ' + ma + ' ở tab NHOM';

  if (viec === 'Gỡ') {
    var t = tv.m[email + '|' + ma];
    if (!t || t['Trạng thái'] !== 'Đang') return '✔ không có trong ' + ma + ', bỏ qua';
    datTrangThai_(t, 'Gỡ', 'gỡ', nguon);
    var them = '';
    if (n.loai === 'Level' && ng && ng['Level'] === ma) ng['Level'] = '';
    if (n.loai === 'Lớp') {
      var soNho = 0;
      tv.ds.forEach(function (x) {
        var nx = nhom[x['Mã nhóm']];
        if (x['Email'] === email && x['Trạng thái'] === 'Đang' && nx && nx.loai === 'Nhóm nhỏ' && nx.thuoc === ma) { datTrangThai_(x, 'Gỡ', 'gỡ lớp ' + ma, nguon); soNho++; }
      });
      if (soNho) them = ', gỡ luôn ' + soNho + ' nhóm nhỏ';
    }
    ghi_('Thành viên', 'Gỡ khỏi ' + ma, email);
    return '✔ gỡ khỏi ' + ma + them;
  }

  // ----- Thêm -----
  if (n.tt === 'Đóng' || n.tt === 'Ngừng') return 'LỖI: nhóm ' + ma + ' đang "' + n.tt + '"';
  var vai = chuan_(d['Vai trong nhóm']) || 'Thành viên';
  var quyen = chuan_(d['Quyền']) || 'Xem';
  if (DS.VAI_NHOM.indexOf(vai) < 0) return 'LỖI: Vai trong nhóm phải là Thành viên hoặc Phụ trách';
  if (DS.QUYEN.indexOf(quyen) < 0) return 'LỖI: Quyền phải là Xem hoặc Sửa';
  if (vai === 'Phụ trách' && DS.CO_PHU_TRACH.indexOf(n.loai) < 0) return 'LỖI: nhóm loại ' + n.loai + ' không có vai Phụ trách';

  var vaiTroMoi = chuan_(d['Vai trò']) || (ng ? ng['Vai trò'] : '');
  if (n.loai === 'Level' && vaiTroMoi !== 'EF') return 'LỖI: Level chỉ dành cho EF' + (vaiTroMoi ? ' (người này là ' + vaiTroMoi + ')' : '');

  var ghiChuNguoi = '';
  if (!ng) {
    var ten = chuan_(d['Họ tên']), vt = chuan_(d['Vai trò']);
    if (!ten || !vt) return 'LỖI: người mới cần Họ tên và Vai trò';
    if (DS.VAI_TRO.indexOf(vt) < 0) return 'LỖI: Vai trò phải là HV, EF, GV hoặc Tổ chức';
    ng = { 'Email': email, 'Họ tên': ten, 'Mã người': chuan_(d['Mã người']), 'Vai trò': vt, 'Level': '', 'Trạng thái': 'Đang',
      'Ngày vào': homNay_(), 'Cập nhật': bayGio_(), 'ID ổ': '', 'Kết quả Drive': '' };
    nguoi.m[email] = ng; nguoi.ds.push(ng);
    ghiChuNguoi = 'người mới, ';
    ghi_('Người', 'Thêm người mới', email + ' · ' + ten);
  } else {
    var doi = capNhatNguoi_(ng, d, tv);
    if (ng['Trạng thái'] === 'Nghỉ') { ng['Trạng thái'] = 'Đang'; doi.push('quay lại'); }
    if (doi.length) { ng['Cập nhật'] = bayGio_(); ghiChuNguoi = doi.join(', ') + ', '; }
  }

  var kq = ghepThanhVien_(tv, ng, n, vai, quyen, nguon);
  var phu = [];
  if (n.tt === 'Kết thúc') phu.push('lưu ý: nhóm đã Kết thúc');

  if (n.loai === 'Level') {
    tv.ds.forEach(function (x) {
      var nx = nhom[x['Mã nhóm']];
      if (x['Email'] === email && x['Mã nhóm'] !== ma && x['Trạng thái'] === 'Đang' && nx && nx.loai === 'Level') { datTrangThai_(x, 'Gỡ', 'đổi Level ' + ma, nguon); phu.push('rời Level ' + x['Mã nhóm']); }
    });
    ng['Level'] = ma;
  }
  if (n.loai === 'Nhóm nhỏ' && vai === 'Thành viên') {
    tv.ds.forEach(function (x) {
      var nx = nhom[x['Mã nhóm']];
      if (x['Email'] === email && x['Mã nhóm'] !== ma && x['Trạng thái'] === 'Đang' && x['Vai trong nhóm'] === 'Thành viên' && nx && nx.loai === 'Nhóm nhỏ' && nx.thuoc && nx.thuoc === n.thuoc) {
        datTrangThai_(x, 'Gỡ', 'chuyển sang ' + ma, nguon); phu.push('rời ' + x['Mã nhóm']);
      }
    });
    if (n.thuoc) {
      var lop = nhom[n.thuoc];
      if (!lop) phu.push('lưu ý: lớp ' + n.thuoc + ' chưa có ở NHOM');
      else {
        var tLop = tv.m[email + '|' + lop.ma];
        if (!tLop || tLop['Trạng thái'] !== 'Đang') { ghepThanhVien_(tv, ng, lop, 'Thành viên', 'Xem', 'tự thêm từ nhóm nhỏ ' + ma); phu.push('tự vào lớp ' + lop.ma); }
      }
    }
  }
  return '✔ ' + ghiChuNguoi + kq + (phu.length ? ' (' + phu.join('; ') + ')' : '');
}

/** Cập nhật Họ tên / Mã người / Vai trò nếu dòng NHAP ghi khác. */
function capNhatNguoi_(ng, d, tv) {
  var doi = [];
  var ten = chuan_(d['Họ tên']), ma = chuan_(d['Mã người']), vt = chuan_(d['Vai trò']);
  if (ten && ten !== ng['Họ tên']) {
    doi.push('đổi tên'); ng['Họ tên'] = ten;
    tv.ds.forEach(function (x) { if (x['Email'] === ng['Email']) x['Họ tên'] = ten; });
  }
  if (ma && ma !== chuan_(ng['Mã người'])) { doi.push('đổi mã'); ng['Mã người'] = ma; }
  if (vt && DS.VAI_TRO.indexOf(vt) >= 0 && vt !== ng['Vai trò']) { doi.push('vai trò ' + ng['Vai trò'] + '→' + vt); ng['Vai trò'] = vt; }
  return doi;
}

/** Thêm hoặc cập nhật một dòng THANH_VIEN. Trả về mô tả. */
function ghepThanhVien_(tv, ng, n, vai, quyen, nguon) {
  var khoa = ng['Email'] + '|' + n.ma, t = tv.m[khoa];
  if (!t) {
    t = { 'Email': ng['Email'], 'Họ tên': ng['Họ tên'], 'Mã nhóm': n.ma, 'Loại nhóm': n.loai, 'Vai trong nhóm': vai, 'Quyền': quyen,
      'Trạng thái': 'Đang', 'Ngày thêm': homNay_(), 'Cập nhật': bayGio_(), 'Nguồn': nguon, 'Lịch sử': '', 'Kết quả Drive': '' };
    tv.m[khoa] = t; tv.ds.push(t);
    ghi_('Thành viên', 'Thêm vào ' + n.ma, ng['Email']);
    return 'thêm vào ' + n.ma;
  }
  var doi = [];
  if (t['Trạng thái'] !== 'Đang') doi.push('thêm lại');
  if (t['Vai trong nhóm'] !== vai) doi.push(t['Vai trong nhóm'] + '→' + vai);
  if (t['Quyền'] !== quyen) doi.push(t['Quyền'] + '→' + quyen);
  if (!doi.length) return 'đã có trong ' + n.ma + ', bỏ qua';
  t['Trạng thái'] = 'Đang'; t['Vai trong nhóm'] = vai; t['Quyền'] = quyen; t['Loại nhóm'] = n.loai;
  t['Cập nhật'] = bayGio_(); t['Nguồn'] = nguon;
  themLichSu_(t, doi.join(', '));
  ghi_('Thành viên', 'Cập nhật ' + n.ma + ': ' + doi.join(', '), ng['Email']);
  return 'cập nhật ' + n.ma + ': ' + doi.join(', ');
}

function datTrangThai_(t, tt, lyDo, nguon) {
  t['Trạng thái'] = tt; t['Cập nhật'] = bayGio_(); t['Nguồn'] = nguon;
  themLichSu_(t, tt + ' (' + lyDo + ')');
}

function themLichSu_(t, chu) {
  var cu = chuan_(t['Lịch sử']);
  t['Lịch sử'] = (cu ? cu + '; ' : '') + homNay_() + ': ' + chu;
}
