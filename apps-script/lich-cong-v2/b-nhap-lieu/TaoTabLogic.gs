/**
 * E-WIT · Lịch & Công v2 · TaoTabLogic.gs (ⓑ NHẬP LIỆU)
 * Logic thuần cho việc tạo tab lớp — không gọi dịch vụ Google, chạy được trong Node.
 * Cần nạp cùng Chung.gs.
 */

/**
 * Tính danh sách cột của tab lớp theo bộ vai trò.
 * @param {Object[]} boVaiTroRows  hàng bảng bo_vai_tro (bo_id, role_id, thu_tu_cot)
 * @param {Object[]} vaiTroRows    hàng bảng vai_tro (role_id, ten_vai_tro, cho_phep_nhieu_nguoi, dang_dung, nguon)
 * @param {string} boId
 * @return {{khoa:string,tieuDe:string,loai:string,roleId?:string,nhieuNguoi?:boolean}[]}
 */
function tinhCotTabLop(boVaiTroRows, vaiTroRows, boId) {
  var cot = [
    { khoa: 'buoi_so', tieuDe: 'Buổi', loai: 'tu_dong' },
    { khoa: 'ngay', tieuDe: 'Ngày', loai: 'nhap_tay' },
    { khoa: 'thu', tieuDe: 'Thứ', loai: 'tu_dong' },
    { khoa: 'gio_bd', tieuDe: 'Giờ BĐ', loai: 'nhap_tay' },
    { khoa: 'gio_kt', tieuDe: 'Giờ KT', loai: 'nhap_tay' },
    { khoa: 'plan', tieuDe: 'PLAN', loai: 'nhap_tay' },
    { khoa: 'actual', tieuDe: 'ACTUAL', loai: 'nhap_tay' },
    { khoa: 'status', tieuDe: 'Trạng thái', loai: 'chon' }
  ];
  var vt = {};
  vaiTroRows.forEach(function (v) { vt[String(v.role_id).trim()] = v; });
  var dong = boVaiTroRows.filter(function (b) { return String(b.bo_id).trim() === String(boId).trim(); });
  dong.sort(function (a, b) { return Number(a.thu_tu_cot) - Number(b.thu_tu_cot); });
  var daCo = {};
  dong.forEach(function (b) {
    var id = String(b.role_id).trim();
    var v = vt[id];
    if (!v || daCo[id]) return;
    if (String(v.dang_dung).trim() !== '' && !laCo(v.dang_dung)) return; // vai trò ngừng dùng
    daCo[id] = true;
    cot.push({
      khoa: 'role:' + id,
      tieuDe: String(v.ten_vai_tro || id),
      loai: String(v.nguon).trim() === 'ZOOM_REPORT' ? 'zoom' : 'chon',
      roleId: id,
      nhieuNguoi: laCo(v.cho_phep_nhieu_nguoi)
    });
  });
  cot.push({ khoa: 'ghi_chu', tieuDe: 'Ghi chú', loai: 'nhap_tay' });
  return cot;
}

/** Đánh số buổi: mỗi giá trị ngày hợp lệ nhận số thứ tự 1,2,3…; ô không phải ngày → ''. */
function danhSoBuoi(mangNgay) {
  var n = 0;
  return mangNgay.map(function (v) { return ngayKey(v) ? ++n : ''; });
}

/** Một giờ (chuỗi 'h:mm', số phần ngày của Sheets, hoặc Date) → 'hh:mm'; không đọc được → ''. */
function chuoiGio(v) {
  if (v === '' || v === null || v === undefined) return '';
  var h, m;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    h = v.getHours(); m = v.getMinutes();
  } else if (typeof v === 'number') {
    var tong = Math.round((v % 1) * 1440);
    h = Math.floor(tong / 60) % 24; m = tong % 60;
  } else {
    var mt = String(v).trim().match(/^(\d{1,2})[:h](\d{2})/);
    if (!mt) return '';
    h = +mt[1]; m = +mt[2];
  }
  return pad2(h) + ':' + pad2(m);
}

/** 'hh:mm - hh:mm' (thiếu một đầu → trả phần còn lại hoặc ''). */
function chuoiGioHoc(gioBd, gioKt) {
  var a = chuoiGio(gioBd), b = chuoiGio(gioKt);
  if (a && b) return a + ' - ' + b;
  return a || b || '';
}

/** Các lớp ACTIVE chưa có tab: tab_nhap trống và không có tab trùng tên class_id. */
function lopChuaCoTab(lopRows, tenTabCo) {
  var co = {};
  (tenTabCo || []).forEach(function (t) { co[String(t).trim()] = true; });
  return lopRows.filter(function (l) {
    var id = String(l.class_id || '').trim();
    return id && String(l.trang_thai).trim() === 'ACTIVE' &&
      String(l.tab_nhap || '').trim() === '' && !co[id];
  });
}

/** Số cột (1-based) → chữ cột A1: 1→A, 27→AA. */
function chuCot(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Cột vai trò còn thiếu so với dòng khóa hiện có (để thêm khi bộ vai trò đổi). */
function cotThieu(cotMoi, khoaHienCo) {
  var co = {};
  khoaHienCo.forEach(function (k) { co[String(k).trim()] = true; });
  return cotMoi.filter(function (c) { return c.khoa.indexOf('role:') === 0 && !co[c.khoa]; });
}

/** Màu chữ dễ đọc trên màu nền hex: nền tối → trắng, nền sáng → đen. */
function mauChuTheoNen(hex) {
  var m = String(hex || '').trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return '#000000';
  var n = parseInt(m[1], 16);
  var l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l < 0.5 ? '#FFFFFF' : '#000000';
}

/* Cho Node test */
if (typeof module !== 'undefined') {
  module.exports = { tinhCotTabLop: tinhCotTabLop, danhSoBuoi: danhSoBuoi, chuoiGioHoc: chuoiGioHoc,
    lopChuaCoTab: lopChuaCoTab, chuCot: chuCot, cotThieu: cotThieu, mauChuTheoNen: mauChuTheoNen };
}
