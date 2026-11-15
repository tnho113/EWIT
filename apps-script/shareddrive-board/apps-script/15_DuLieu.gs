/**
 * MLWIT · SHARED DRIVE BOARD v2 · MÔ HÌNH DỮ LIỆU CHUNG (hợp đồng cho Đợt 2–3)
 * Đọc toàn bộ bảng thành đối tượng C. Các tệp 25_Nhom, 30_Drive, 50_Quet chỉ dùng C và các hàm ở đây,
 * KHÔNG tự đọc tab, để mọi phần hiểu dữ liệu giống nhau.
 *
 * Quy ước nhóm Google (do 25_Nhom tạo, 30_Drive cấp quyền):
 *   sd-<mã>@miền        thành viên quyền Xem
 *   sd-<mã>-sua@miền    thành viên quyền Sửa
 *   sd-<mã>-pt@miền     Phụ trách
 *   sd-all-ef@miền      mọi người Đang có vai trò EF, GV, Tổ chức
 *   sd-all-hv@miền      mọi HV Đang
 *   (sd- là "Tiền tố nhóm" ở CAI_DAT; <mã> = slug_ của Mã nhóm)
 */

var LOP_NHOM = { THANH_VIEN_XEM: '', THANH_VIEN_SUA: 'sua', PHU_TRACH: 'pt' };

/** Đọc mọi tab cần cho Đợt 2–3. Không ghi gì. */
function taiDuLieu_() {
  var cdTab = docCaiDat_();
  var C = {
    cd: {
      admin: email_(cdTab['Email admin']),
      mien: chuan_(cdTab['Tên miền']),
      tienTo: chuan_(cdTab['Tiền tố nhóm']) || 'sd-',
      thuongHieu: chuan_(cdTab['Thương hiệu mặc định']) || 'EWIT',
      tenHienThi: chuan_(cdTab['Tên hiển thị']) || chuan_(cdTab['Thương hiệu mặc định']) || 'EWIT',
      guiThuChao: chuan_(cdTab['Gửi thư chào']) !== 'Không'
    },
    nhom: {}, dsNhom: [], nguoi: {}, dsNguoi: [], tv: [], vaiTro: {}, cauTruc: [], bang: {}
  };

  var bNhom = docTab_(TAB.NHOM); C.bang.NHOM = bNhom;
  bNhom.dong.forEach(function (d) {
    var ma = maNhom_(d['Mã nhóm']);
    if (!ma) return;
    var n = { ma: ma, ten: chuan_(d['Tên nhóm']), loai: chuan_(d['Loại']), thuoc: maNhom_(d['Thuộc']), nhanh: chuan_(d['Nhánh']),
      thuongHieu: chuan_(d['Thương hiệu']) || C.cd.thuongHieu, tt: chuan_(d['Trạng thái']) || 'Đang',
      emailNhom: chuan_(d['Email nhóm']), idThuMuc: chuan_(d['ID thư mục']), dong: d._dong };
    C.nhom[ma] = n; C.dsNhom.push(n);
  });

  var bNguoi = docTab_(TAB.NGUOI); C.bang.NGUOI = bNguoi;
  bNguoi.dong.forEach(function (d) {
    var e = email_(d['Email']);
    if (!e) return;
    var n = { email: e, ten: chuan_(d['Họ tên']), ma: chuan_(d['Mã người']), vaiTro: chuan_(d['Vai trò']), level: maNhom_(d['Level']),
      tt: chuan_(d['Trạng thái']) || 'Đang', idO: chuan_(d['ID ổ']), dong: d._dong };
    C.nguoi[e] = n; C.dsNguoi.push(n);
  });

  var bTv = docTab_(TAB.THANH_VIEN); C.bang.THANH_VIEN = bTv;
  bTv.dong.forEach(function (d) {
    var e = email_(d['Email']), ma = maNhom_(d['Mã nhóm']);
    if (!e || !ma) return;
    C.tv.push({ email: e, ma: ma, loai: chuan_(d['Loại nhóm']), vai: chuan_(d['Vai trong nhóm']) || 'Thành viên',
      quyen: chuan_(d['Quyền']) || 'Xem', tt: chuan_(d['Trạng thái']) || 'Đang', dong: d._dong });
  });

  var bVt = docTab_(TAB.VAI_TRO); C.bang.VAI_TRO = bVt;
  bVt.dong.forEach(function (d) {
    var k = chuan_(d['Vai trò / Level'] || d['Vai trò / Cấp']);
    if (!k) return;
    C.vaiTro[k.toUpperCase()] = { ten: k, loai: chuan_(d['Loại']), chiaSe: chuan_(d['Được chia sẻ']) === 'Có',
      khiNghi: chuan_(d['Khi nghỉ']) || 'Giữ ổ', khuon: chuan_(d['Khuôn ổ cá nhân']) };
  });

  var bCt = docTab_(TAB.CAU_TRUC); C.bang.CAU_TRUC = bCt;
  bCt.dong.forEach(function (d) {
    var ma = chuan_(d['Mã']);
    if (!ma) return;
    C.cauTruc.push({ ma: ma, o: chuan_(d['Ổ']), duong: chuan_(d['Đường dẫn']), loai: chuan_(d['Loại']),
      nguon: chuan_(d['Nguồn / Đích / Áp cho']), quyen: chuan_(d['Quyền chủ ổ / người dùng']), id: chuan_(d['ID']), dong: d._dong });
  });
  return C;
}

/* ---------- Tên và nhóm ---------- */

/** Bỏ dấu tiếng Việt, chữ thường, ký tự lạ thành "-". "ME02-08" → "me02-08", "Đào tạo" → "dao-tao". */
function slug_(s) {
  return chuan_(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Email nhóm Google của một Mã nhóm. hau: '' (Xem) | 'sua' | 'pt'. */
function emailNhom_(C, ma, hau) {
  return C.cd.tienTo + slug_(ma) + (hau ? '-' + hau : '') + '@' + C.cd.mien;
}

/** Hậu tố nhóm Google của một dòng THANH_VIEN. */
function hauToCua_(t) {
  if (t.vai === 'Phụ trách') return LOP_NHOM.PHU_TRACH;
  return t.quyen === 'Sửa' ? LOP_NHOM.THANH_VIEN_SUA : LOP_NHOM.THANH_VIEN_XEM;
}

function emailTong_(C, loai) { return C.cd.tienTo + 'all-' + loai + '@' + C.cd.mien; }   // loai: 'ef' | 'hv'

/* ---------- Truy vấn ---------- */

function dangHoatDong_(n) { return n.tt === 'Đang'; }

/** Các dòng THANH_VIEN đang hiệu lực của một người. */
function nhomCuaNguoi_(C, email) {
  return C.tv.filter(function (t) { return t.email === email && t.tt === 'Đang'; });
}

/** Thành viên đang hiệu lực của một nhóm (lọc theo vai nếu có). */
function thanhVienNhom_(C, ma, vai) {
  return C.tv.filter(function (t) { return t.ma === ma && t.tt === 'Đang' && (!vai || t.vai === vai); });
}

/** Mã các Level theo thứ tự hàng trong NHOM (trên = thấp). */
function dsLevel_(C) {
  return C.dsNhom.filter(function (n) { return n.loai === 'Level'; }).map(function (n) { return n.ma; });
}

/** Level được xem thư mục của Level `ma`: chính nó và mọi Level cao hơn. */
function levelDuocXem_(C, ma) {
  var ds = dsLevel_(C), i = ds.indexOf(ma);
  return i < 0 ? [] : ds.slice(i);
}

/** Thư viện Level mà một người thấy: Level hiện tại và mọi Level thấp hơn. */
function levelThayDuoc_(C, n) {
  var ds = dsLevel_(C), i = ds.indexOf(n.level);
  return i < 0 ? [] : ds.slice(0, i + 1);
}

/** Người được chia sẻ ra ngoài nếu Vai trò HOẶC Level hiện tại ghi "Có" ở VAI_TRO. */
function duocChiaSe_(C, n) {
  var vt = C.vaiTro[(n.vaiTro || '').toUpperCase()], lv = n.level ? C.vaiTro[n.level.toUpperCase()] : null;
  return !!((vt && vt.chiaSe) || (lv && lv.chiaSe));
}

/** Khuôn ổ cá nhân: "Ổ HV" | "Ổ EF" | "Ổ GV". */
function khuonO_(C, n) {
  var vt = C.vaiTro[(n.vaiTro || '').toUpperCase()];
  return (vt && vt.khuon) || (n.vaiTro === 'HV' ? 'Ổ HV' : 'Ổ EF');
}

function khiNghi_(C, n) {
  var vt = C.vaiTro[(n.vaiTro || '').toUpperCase()];
  return (vt && vt.khiNghi) || 'Giữ ổ';
}

/** Có ổ cá nhân khi: người Đang và có ít nhất một nhóm đang hiệu lực. */
function coOCaNhan_(C, n) {
  return n.tt === 'Đang' && nhomCuaNguoi_(C, n.email).length > 0;
}

/** Dòng CAU_TRUC có áp cho ổ của người này không (cột "Ổ" của dòng ổ cá nhân). */
function apChoO_(C, dongCt, n) {
  var o = dongCt.o;
  if (o === 'Mọi ổ cá nhân' || o === 'Ổ cá nhân') return true;
  return o.split(',').map(chuan_).indexOf(khuonO_(C, n)) >= 0;
}

/** Thay {Mã người} {Họ tên} {Mã nhóm} {Tên nhóm} {Nhánh}; bỏ "{Mã người} · " khi người không có mã. */
function dienMau_(mau, n, g) {
  var s = mau;
  if (n) {
    s = n.ma ? s.replace(/\{Mã người\}/g, n.ma) : s.replace(/\{Mã người\}\s*·\s*/g, '').replace(/\{Mã người\}/g, '');
    s = s.replace(/\{Họ tên\}/g, n.ten);
  }
  if (g) s = s.replace(/\{Mã nhóm\}/g, g.ma).replace(/\{Tên nhóm\}/g, g.ten).replace(/\{Nhánh\}/g, g.nhanh || 'KHAC');
  return s;
}

/** Dòng CAU_TRUC theo mã. */
function dongCauTruc_(C, ma) {
  for (var i = 0; i < C.cauTruc.length; i++) if (C.cauTruc[i].ma === ma) return C.cauTruc[i];
  return null;
}

/** Tên ổ cá nhân của một người theo dòng CN_TEN. */
function tenOCaNhan_(C, n) {
  var d = dongCauTruc_(C, 'CN_TEN');
  return dienMau_(d ? d.duong : 'MLWIT · {Mã người} · {Họ tên}', n, null);
}
