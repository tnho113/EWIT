/**
 * E-WIT · ⓓ THÙ LAO · BaoCaoLogic.gs
 * Logic thuần (không gọi dịch vụ Google) cho báo cáo, chốt kỳ, quyền. Chạy được trong Node.
 * Cần Chung.gs nạp trước (ngayKey, pad2, laCo, laEmailHopLe, duyNhat).
 */

var COT_BAO_CAO = ['ten_ef', 'ten_level', 'ten_vai_tro', 'ten_lop', 'so_buoi', 'cac_ngay',
  'muc_de_xuat', 'thanh_tien_de_xuat', 'thu_lao_quyet_dinh', 'ghi_chu'];
var NHAN_NHIEU_MUC = 'nhiều mức';

function _s(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function _kh(v) { return _s(v).toLowerCase(); }

/** Khóa giữ lại thù lao: ef_id | level_id | role_id | class_id */
function khoaBaoCao(ef, level, role, lop) {
  return [_s(ef), _s(level), _s(role), _s(lop)].join('|');
}

/** Đọc số tiền từ ô: số, '150000', '150.000', '1,5'. Không hợp lệ → null. */
function docSoTien(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  var s = _s(v).replace(/\s/g, '');
  if (!s) return null;
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''));
  s = s.replace(',', '.');
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

/** 'yyyy-MM-dd' → 'dd/MM' */
function ngayNgan(key) { return key.slice(8, 10) + '/' + key.slice(5, 7); }

/** 'yyyy-MM-dd' → Date lúc 12:00 giờ địa phương (tránh lệch ngày khi ghi vào Sheets) */
function ngayTuKey(key) {
  var p = key.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
}

function khopLoc(q, a, b) {
  q = _kh(q);
  if (!q) return true;
  return _kh(a) === q || _kh(b) === q;
}

/**
 * Quy tắc cụ thể nhất còn hiệu lực tại ngày `key` cho dòng `d`.
 * Điểm: class_id khớp 100 > nhom_lop khớp 10 > role_id 2 > level_id 1; ô trống = mọi giá trị.
 * Hòa điểm: tu_ngay mới hơn thắng, rồi quy tắc nằm sau thắng. Trả về số tiền hoặc null.
 */
function mucDeXuatCuaBuoi(quyTac, d, key) {
  var tot = null, diemTot = -1, tuTot = '';
  (quyTac || []).forEach(function (r) {
    var muc = docSoTien(r.muc_moi_buoi);
    if (muc === null) return;
    var tu = ngayKey(r.tu_ngay), den = ngayKey(r.den_ngay);
    if (tu && key < tu) return;
    if (den && key > den) return;
    var diem = 0;
    if (_s(r.class_id)) { if (_kh(r.class_id) !== _kh(d.class_id)) return; diem += 100; }
    if (_s(r.nhom_lop)) { if (_kh(r.nhom_lop) !== _kh(d.nhom_lop)) return; diem += 10; }
    if (_s(r.role_id)) { if (_kh(r.role_id) !== _kh(d.role_id)) return; diem += 2; }
    if (_s(r.level_id)) { if (_kh(r.level_id) !== _kh(d.level_id)) return; diem += 1; }
    if (diem > diemTot || (diem === diemTot && tu >= tuTot)) { tot = muc; diemTot = diem; tuTot = tu; }
  });
  return tot;
}

/**
 * Gom du_lieu thành báo cáo.
 * boLoc: {tu, den (bắt buộc), ef, lop, vaiTro}; giuLai: {khoa: {thu_lao_quyet_dinh, ghi_chu}}.
 */
function lapBaoCaoLogic(duLieu, boLoc, quyTac, giuLai) {
  var tu = ngayKey(boLoc.tu), den = ngayKey(boLoc.den);
  if (!tu || !den) throw new Error('Thiếu từ ngày / đến ngày');
  giuLai = giuLai || {};
  var nhom = {}, thuTu = [], daThay = {};
  (duLieu || []).forEach(function (d) {
    var key = ngayKey(d.ngay);
    if (!key || key < tu || key > den) return;
    if (!khopLoc(boLoc.ef, d.ef_id, d.ten_ef)) return;
    if (!khopLoc(boLoc.lop, d.class_id, d.ten_lop)) return;
    if (!khopLoc(boLoc.vaiTro, d.role_id, d.ten_vai_tro)) return;
    var idDem = _s(d.assignment_id);
    if (idDem) { if (daThay[idDem]) return; daThay[idDem] = true; }
    var khoa = khoaBaoCao(d.ef_id, d.level_id, d.role_id, d.class_id);
    var g = nhom[khoa];
    if (!g) {
      g = nhom[khoa] = { khoa: khoa, ten_ef: _s(d.ten_ef) || _s(d.ef_id), ten_level: _s(d.ten_level),
        ten_vai_tro: _s(d.ten_vai_tro) || _s(d.role_id), ten_lop: _s(d.ten_lop) || _s(d.class_id),
        ngay: [], muc: [] };
      thuTu.push(khoa);
    }
    g.ngay.push(key);
    g.muc.push(mucDeXuatCuaBuoi(quyTac, d, key));
  });
  var rows = thuTu.map(function (k) {
    var g = nhom[k], ngayDuyNhat = duyNhat(g.ngay).sort();
    var tong = 0, coMuc = false, khacNhau = false;
    g.muc.forEach(function (m) {
      if (m !== null) { tong += m; coMuc = true; }
      if (m !== g.muc[0]) khacNhau = true;
    });
    var mucDx = khacNhau ? NHAN_NHIEU_MUC : (g.muc[0] === null ? '' : g.muc[0]);
    var giu = giuLai[k] || {};
    return { ten_ef: g.ten_ef, ten_level: g.ten_level, ten_vai_tro: g.ten_vai_tro, ten_lop: g.ten_lop,
      so_buoi: g.ngay.length, cac_ngay: ngayDuyNhat.map(ngayNgan).join(', '),
      muc_de_xuat: mucDx, thanh_tien_de_xuat: coMuc ? tong : '',
      thu_lao_quyet_dinh: giu.thu_lao_quyet_dinh === undefined ? '' : giu.thu_lao_quyet_dinh,
      ghi_chu: giu.ghi_chu === undefined ? '' : giu.ghi_chu, khoa: k };
  });
  var so = function (a, b) { return _kh(a).localeCompare(_kh(b)); };
  rows.sort(function (a, b) {
    return so(a.ten_ef, b.ten_ef) || so(a.ten_vai_tro, b.ten_vai_tro) || so(a.ten_lop, b.ten_lop) || so(a.ten_level, b.ten_level);
  });
  return rows;
}

/** Từ các dòng cũ của bảng báo cáo ({khoa, thu_lao_quyet_dinh, ghi_chu}) → map giữ lại (chỉ ô có nội dung). */
function taoGiuLai(rowsCu) {
  var map = {};
  (rowsCu || []).forEach(function (r) {
    var k = _s(r.khoa);
    if (!k) return;
    var tl = r.thu_lao_quyet_dinh, gc = r.ghi_chu;
    var coTl = !(tl === '' || tl === null || tl === undefined), coGc = _s(gc) !== '';
    if (coTl || coGc) map[k] = { thu_lao_quyet_dinh: coTl ? tl : '', ghi_chu: coGc ? gc : '' };
  });
  return map;
}

/** Dòng tổng: số buổi và thành tiền đề xuất. */
function tinhTongBaoCao(rows) {
  var b = 0, t = 0, co = false;
  rows.forEach(function (r) {
    b += Number(r.so_buoi) || 0;
    if (r.thanh_tien_de_xuat !== '') { t += Number(r.thanh_tien_de_xuat) || 0; co = true; }
  });
  return { so_buoi: b, thanh_tien_de_xuat: co ? t : '' };
}

/** Số dòng có so_buoi > 0 mà thu_lao_quyet_dinh còn trống. */
function demThieuThuLao(rows) {
  return rows.filter(function (r) {
    var tl = r.thu_lao_quyet_dinh;
    return (Number(r.so_buoi) || 0) > 0 && (tl === '' || tl === null || tl === undefined);
  }).length;
}

/** Danh sách giá trị duy nhất, sắp xếp, để làm dropdown lọc. */
function danhSachLoc(duLieu, cot) {
  var v = duyNhat((duLieu || []).map(function (d) { return _s(d[cot]); }).filter(function (x) { return x; }));
  return v.sort(function (a, b) { return _kh(a).localeCompare(_kh(b)); });
}

/* ---------- Chốt kỳ / điều chỉnh ---------- */

function idKy(tu, den) { return 'KY_' + ngayGon(ngayKey(tu)) + '_' + ngayGon(ngayKey(den)); }

/** Assignment trong khoảng [tu, den] ở du_lieu → [{assignment_id, chi_tiet}] (không lặp). */
function assignmentTrongKhoang(duLieu, tu, den) {
  tu = ngayKey(tu); den = ngayKey(den);
  var thay = {}, out = [];
  (duLieu || []).forEach(function (d) {
    var key = ngayKey(d.ngay), id = _s(d.assignment_id);
    if (!id || !key || key < tu || key > den || thay[id]) return;
    thay[id] = true;
    out.push({ assignment_id: id,
      chi_tiet: [_s(d.ten_ef), _s(d.ten_vai_tro), _s(d.ten_lop), ngayNgan(key)].join(' · ') });
  });
  return out;
}

/** So hiện tại với bản chụp → {them: [...], bot: [...]} (bot lấy chi_tiet từ bản chụp). */
function soSanhKy(hienTai, chup) {
  var h = {}, c = {};
  hienTai.forEach(function (x) { h[x.assignment_id] = x; });
  chup.forEach(function (x) { c[x.assignment_id] = x; });
  return {
    them: hienTai.filter(function (x) { return !c[x.assignment_id]; }),
    bot: chup.filter(function (x) { return !h[x.assignment_id]; })
  };
}

/** Bỏ dòng điều chỉnh đã có (khóa ky_id|assignment_id|loai). */
function locDieuChinhMoi(dongMoi, dongCu) {
  var co = {};
  dongCu.forEach(function (r) { co[[_s(r.ky_id), _s(r.assignment_id), _s(r.loai)].join('|')] = true; });
  return dongMoi.filter(function (r) { return !co[[r.ky_id, r.assignment_id, r.loai].join('|')]; });
}

/* ---------- Quyền ---------- */

/** quyenRowsD: bảng quyen của ⓓ (email, quyen SUA/XEM, dang_hieu_luc). QUAN_TRI luôn là editor. */
function tinhQuyenThuLao(quyenRowsD, quanTriEmails) {
  var editors = [], viewers = [];
  (quyenRowsD || []).forEach(function (q) {
    if (!laCo(q.dang_hieu_luc) || !laEmailHopLe(q.email)) return;
    var e = _kh(q.email), loai = _s(q.quyen).toUpperCase();
    if (loai === 'SUA') editors.push(e);
    else if (loai === 'XEM') viewers.push(e);
  });
  (quanTriEmails || []).forEach(function (e) { if (laEmailHopLe(e)) editors.push(_kh(e)); });
  editors = duyNhat(editors);
  viewers = duyNhat(viewers).filter(function (e) { return editors.indexOf(e) < 0; });
  return { editors: editors, viewers: viewers };
}

/**
 * Kế hoạch đổi quyền: muon {editors, viewers}, hienCo {editors, viewers}, chuFile email.
 * Trả mảng {email, hien_tai (SUA/XEM/-), se_thanh (SUA/XEM/-), hanh_dong}; không bao giờ đụng chủ file.
 */
function keHoachQuyen(muon, hienCo, chuFile) {
  var chu = _kh(chuFile), vai = {}, mong = {}, dsEmail = [];
  var them = function (arr, loai, map) {
    arr.forEach(function (e) { e = _kh(e); if (e && !(e in map)) map[e] = loai; });
  };
  them(hienCo.editors, 'SUA', vai); them(hienCo.viewers, 'XEM', vai);
  them(muon.editors, 'SUA', mong); them(muon.viewers, 'XEM', mong);
  Object.keys(vai).concat(Object.keys(mong)).forEach(function (e) { if (dsEmail.indexOf(e) < 0) dsEmail.push(e); });
  var kq = [];
  dsEmail.sort().forEach(function (e) {
    if (e === chu) return;
    var cu = vai[e] || '-', moi = mong[e] || '-';
    if (cu === moi) return;
    var hd = moi === '-' ? 'GO' : (moi === 'SUA' ? 'CAP_SUA' : (cu === '-' ? 'CAP_XEM' : 'HA_XUONG_XEM'));
    kq.push({ email: e, hien_tai: cu, se_thanh: moi, hanh_dong: hd });
  });
  return kq;
}

/* Cho Node test */
if (typeof module !== 'undefined') {
  module.exports = { lapBaoCaoLogic: lapBaoCaoLogic, taoGiuLai: taoGiuLai, tinhQuyenThuLao: tinhQuyenThuLao };
}
