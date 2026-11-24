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
 *   sd-u-<mã hệ thống>@miền   nhóm riêng của MỘT người (Đợt 2b) — mọi quyền "theo người" cấp qua nhóm này
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
      guiThuChao: chuan_(cdTab['Gửi thư chào']) !== 'Không',
      giaLap: chuan_(cdTab['Chế độ']) === 'Giả lập',     // Giả lập: tên ổ có [THỬ], ghi sổ _GIA_LAP, cho phép Dọn sạch
      ngoaiBang: dsEmailNgoaiBang_(cdTab['Nhóm ngoài bảng'])   // A7: email script không quản lý (không gỡ, không báo lạ)
    },
    cdTho: cdTab,
    nhom: {}, dsNhom: [], nguoi: {}, dsNguoi: [], tv: [], vaiTro: {}, cauTruc: [], bang: {}
  };

  var bNhom = docTab_(TAB.NHOM); C.bang.NHOM = bNhom;
  kiemMaNhomTrung_(bNhom.dong);
  bNhom.dong.forEach(function (d) {
    var ma = maNhom_(d['Mã nhóm']);
    if (!ma) return;
    var n = { ma: ma, ten: chuan_(d['Tên nhóm']), loai: chuan_(d['Loại']), thuoc: maNhom_(d['Thuộc']), nhanh: chuan_(d['Nhánh']),
      thuongHieu: chuan_(d['Thương hiệu']) || C.cd.thuongHieu, tt: chuan_(d['Trạng thái']) || 'Đang',
      emailNhom: chuan_(d['Email nhóm']), idThuMuc: chuan_(d['ID thư mục']), dong: d._dong,
      thuTu: (d['Thứ tự'] === '' || d['Thứ tự'] == null || isNaN(Number(d['Thứ tự']))) ? null : Number(d['Thứ tự']) };
    C.nhom[ma] = n; C.dsNhom.push(n);
  });

  var bNguoi = docTab_(TAB.NGUOI); C.bang.NGUOI = bNguoi;
  bNguoi.dong.forEach(function (d) {
    var e = email_(d['Email']);
    if (!e) return;
    var n = { email: e, ten: chuan_(d['Họ tên']), ma: chuan_(d['Mã người']), vaiTro: chuan_(d['Vai trò']), level: maNhom_(d['Level']),
      tt: chuan_(d['Trạng thái']) || 'Đang', idO: chuan_(d['ID ổ']), dong: d._dong, maHT: chuan_(d['Mã hệ thống']) };
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
    var duong = chuan_(d['Đường dẫn']);
    if (C.cd.giaLap && chuan_(d['Loại']) === 'Ổ' && duong.indexOf('[THỬ] ') !== 0) duong = '[THỬ] ' + duong;
    C.cauTruc.push({ ma: ma, o: chuan_(d['Ổ']), duong: duong, loai: chuan_(d['Loại']),
      nguon: chuan_(d['Nguồn / Đích / Áp cho']), quyen: chuan_(d['Quyền chủ ổ / người dùng']), id: chuan_(d['ID']), dong: d._dong });
  });
  return C;
}

/** A8(d): NHOM có Mã nhóm trùng → dừng mọi lượt chạy (thư mục/nhóm Google sẽ bị đổi qua lại). */
function kiemMaNhomTrung_(dong) {
  var dem = {}, trung = [];
  dong.forEach(function (d) {
    var ma = maNhom_(d['Mã nhóm']);
    if (!ma) return;
    dem[ma] = (dem[ma] || 0) + 1;
    if (dem[ma] === 2) trung.push(ma);
  });
  if (trung.length) throw new Error('NHOM có Mã nhóm trùng: ' + trung.join(', ') + '. Sửa cho mỗi mã chỉ còn một dòng rồi chạy lại.');
}

/** CAI_DAT "Nhóm ngoài bảng": danh sách email cách nhau bằng dấu phẩy → { email: true }. */
function dsEmailNgoaiBang_(s) {
  var m = {};
  chuan_(s).split(/[,;\s]+/).map(email_).forEach(function (e) { if (e) m[e] = true; });
  return m;
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

/** Loại nhóm chỉ có mức Xem cho Thành viên (WD-28 · A2): Quyền "Sửa" ở đây được coi là Xem. */
var LOAI_CHI_XEM = ['Lớp', 'Level', 'Nhóm nhỏ'];

/**
 * Hậu tố nhóm Google của một dòng THANH_VIEN. C (tùy chọn): lấy Loại nhóm ở NHOM (đúng hơn cột "Loại nhóm" của THANH_VIEN).
 * Thành viên + Quyền "Sửa" ở Lớp / Level / Nhóm nhỏ → coi như Xem (hậu tố ''), vì các loại này không cấp quyền cho nhóm -sua.
 */
function hauToCua_(t, C) {
  if (t.vai === 'Phụ trách') return LOP_NHOM.PHU_TRACH;
  var g = C && C.nhom ? C.nhom[t.ma] : null, loai = g ? g.loai : t.loai;
  if (LOAI_CHI_XEM.indexOf(loai) >= 0) return LOP_NHOM.THANH_VIEN_XEM;
  return t.quyen === 'Sửa' ? LOP_NHOM.THANH_VIEN_SUA : LOP_NHOM.THANH_VIEN_XEM;
}

function emailTong_(C, loai) { return C.cd.tienTo + 'all-' + loai + '@' + C.cd.mien; }   // loai: 'ef' | 'hv'

/** Nhóm riêng của một người (theo Mã hệ thống, không đổi khi đổi email). null nếu chưa có Mã hệ thống. */
function emailNhomRieng_(C, n) {
  return n && n.maHT ? C.cd.tienTo + 'u-' + slug_(n.maHT) + '@' + C.cd.mien : null;
}

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

/** Mã các Level từ thấp đến cao: theo cột "Thứ tự" (số nhỏ = thấp); không có thì theo thứ tự hàng trong NHOM. */
function dsLevel_(C) {
  var ds = C.dsNhom.filter(function (n) { return n.loai === 'Level'; }).map(function (n, i) { return { n: n, i: i }; });
  ds.sort(function (a, b) {
    var ta = a.n.thuTu, tb = b.n.thuTu;
    if (ta !== null && tb !== null && ta !== tb) return ta - tb;
    if (ta !== null && tb === null) return -1;
    if (ta === null && tb !== null) return 1;
    return a.i - b.i;
  });
  return ds.map(function (x) { return x.n.ma; });
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

/** Nhóm còn hiệu lực (không Đóng, không Ngừng). */
function nhomConHieuLuc_(C, ma) {
  var g = C.nhom[ma];
  return !!g && g.tt !== 'Đóng' && g.tt !== 'Ngừng';
}

/**
 * WD-28: Lớp "đầy đủ" khi NHOM có ít nhất một dòng Loại "Nhóm nhỏ" có Thuộc = mã lớp (mọi trạng thái).
 * Không có nhóm nhỏ → lớp "chỉ xem": thành viên không có ổ riêng / Hồ sơ học tập / nộp bài, chỉ được Xem thư mục lớp.
 */
function lopDayDu_(C, maLop) {
  if (!C._dayDu) {
    C._dayDu = {};
    C.dsNhom.forEach(function (g) { if (g.loai === 'Nhóm nhỏ' && g.thuoc) C._dayDu[g.thuoc] = true; });
  }
  return !!C._dayDu[maLop];
}

/** Nhóm `ma` là Lớp chỉ xem (Lớp không có nhóm nhỏ nào). */
function lopChiXem_(C, ma) {
  var g = C.nhom[ma];
  return !!g && g.loai === 'Lớp' && !lopDayDu_(C, ma);
}

/**
 * Có ổ cá nhân khi: người Đang và có ít nhất một nhóm đang hiệu lực (nhóm không Đóng/Ngừng) KHÔNG phải Lớp chỉ xem (WD-28).
 */
function coOCaNhan_(C, n) {
  // Lớp chỉ xem chỉ bỏ qua với vai Thành viên; Phụ trách lớp chỉ xem vẫn cần ổ (30_LOP-PHU-TRACH).
  // V7 (Nery 24/11): học viên lớp ĐẦY ĐỦ (hoặc nhóm nhỏ) đã Đóng/Ngừng vẫn giữ ổ để xem Hồ sơ học tập của mình.
  return n.tt === 'Đang' && nhomCuaNguoi_(C, n.email).some(function (t) {
    var g = C.nhom[t.ma];
    if (t.vai === 'Thành viên' && g && ((g.loai === 'Lớp' && lopDayDu_(C, g.ma)) || g.loai === 'Nhóm nhỏ')) return true;
    return nhomConHieuLuc_(C, t.ma) && !(t.vai === 'Thành viên' && lopChiXem_(C, t.ma));
  });
}

/**
 * Người này có đang học không (Vai trò HV, HOẶC là Thành viên Đang của một Lớp ĐẦY ĐỦ / Nhóm nhỏ) — dùng cho EF/GV đi học.
 * Lớp chỉ xem không tính (WD-28).
 */
function laNguoiHoc_(C, n) {
  if (n.vaiTro === 'HV') return true;
  return nhomCuaNguoi_(C, n.email).some(function (t) {
    var g = C.nhom[t.ma];
    return t.vai === 'Thành viên' && g && ((g.loai === 'Lớp' && lopDayDu_(C, g.ma)) || g.loai === 'Nhóm nhỏ');
  });
}

/** Thành viên Đang của ít nhất một Lớp (đầy đủ hoặc chỉ xem): dùng cho chỗ đặt lối tắt Lớp đang học / đã học. */
function hocLopNao_(C, n) {
  return nhomCuaNguoi_(C, n.email).some(function (t) { var g = C.nhom[t.ma]; return t.vai === 'Thành viên' && g && g.loai === 'Lớp'; });
}

/** A8(c): dòng THANH_VIEN Đang mang Mã nhóm không còn ở NHOM → ghi cảnh báo (không im lặng bỏ qua). */
function canhBaoTvMoCoi_(C) {
  var mo = {};
  C.tv.forEach(function (t) { if (t.tt === 'Đang' && !C.nhom[t.ma]) (mo[t.ma] = mo[t.ma] || []).push(t.email); });
  Object.keys(mo).forEach(function (ma) {
    ghi_('Cảnh báo', 'THANH_VIEN có ' + mo[ma].length + ' dòng Đang mang Mã nhóm "' + ma + '" không còn ở NHOM (bị bỏ qua: sửa Mã nhóm hoặc Gỡ)', mo[ma].join(', '));
  });
  return Object.keys(mo).length;
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
