/**
 * E-WIT · Lịch & Công v2 · Chung.gs
 * Hàm dùng chung cho mọi project. Copy NGUYÊN VĂN vào từng project, không sửa riêng.
 * Phần "logic thuần" (không gọi dịch vụ Google) chạy được trong Node để test.
 */

var SCRIPT_VERSION = 'v2.0.0-dev';
var TZ = 'Asia/Ho_Chi_Minh';

// Quy ước màu (WD-18)
var MAU = {
  CHON: '#E3F6EC',      // ô chọn từ danh sách
  NHAP_TAY: '#FFF4DC',  // ô nhập tay
  TU_DONG: '#F3EFF7',   // ô tự động / khóa
  TIEU_DE_NEN: '#3D0A6E',
  TIEU_DE_CHU: '#FFFFFF',
  TIM: '#3D0A6E',
  XANH: '#1FAF6E'
};

// Bố cục tab lớp trong ⓑ (DAC-TA-CHUNG §4)
var TAB_LOP = {
  O_CLASS_ID: 'B2',
  DONG_KHOA: 7,
  DONG_TIEU_DE: 8,
  DONG_DAU: 9,
  SO_DONG_CHUAN_BI: 200,
  COT_CO_DINH_TRUOC: ['buoi_so', 'ngay', 'thu', 'gio_bd', 'gio_kt', 'plan', 'actual', 'status'],
  COT_CO_DINH_SAU: ['ghi_chu']
};

/* ================= Logic thuần ================= */

/** Mảng 2 chiều (dòng 1 là tên cột) → mảng object theo tên cột. Bỏ dòng trống hoàn toàn. */
function bangThanhObject(values) {
  if (!values || !values.length) return [];
  var head = values[0].map(function (h) { return String(h).trim(); });
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var rong = r.every(function (v) { return v === '' || v === null || v === undefined; });
    if (rong) continue;
    var o = {};
    for (var j = 0; j < head.length; j++) if (head[j]) o[head[j]] = r[j];
    o._dong = i + 1; // số dòng trên sheet
    out.push(o);
  }
  return out;
}

/** Mảng object → mảng 2 chiều theo thứ tự cột cho trước (không gồm dòng tiêu đề). */
function objectThanhBang(rows, cols) {
  return rows.map(function (o) {
    return cols.map(function (c) { return o[c] === undefined || o[c] === null ? '' : o[c]; });
  });
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

/** Date (hoặc chuỗi dd/MM/yyyy / yyyy-MM-dd) → 'yyyy-MM-dd'; không hợp lệ → ''. Dùng giờ địa phương của Date. */
function ngayKey(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    return v.getFullYear() + '-' + pad2(v.getMonth() + 1) + '-' + pad2(v.getDate());
  }
  var s = String(v).trim(), m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return m[1] + '-' + pad2(+m[2]) + '-' + pad2(+m[3]);
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return m[3] + '-' + pad2(+m[2]) + '-' + pad2(+m[1]);
  return '';
}

/** 'yyyy-MM-dd' → 'yyyymmdd' */
function ngayGon(key) { return String(key).replace(/-/g, ''); }

/** Thứ theo quy ước E-WIT: 2=T2 … 7=T7, 8=CN, từ 'yyyy-MM-dd'. */
function thuCuaNgay(key) {
  var p = key.split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay(); // 0=CN
  return d === 0 ? 8 : d + 1;
}

/** Nhãn thứ hiển thị: T2…T7, CN */
function nhanThu(so) { return so === 8 ? 'CN' : 'T' + so; }

/** Tách danh sách email/tên cách bằng dấu phẩy hoặc xuống dòng; email chuyển chữ thường. */
function tachDanhSach(s, laEmail) {
  if (s === null || s === undefined) return [];
  return String(s).split(/[,;\n]/).map(function (x) {
    x = x.trim();
    return laEmail ? x.toLowerCase() : x;
  }).filter(function (x) { return x; });
}

function laEmailHopLe(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim()); }

function laCo(v) { return String(v || '').trim().toLowerCase() === 'có'; }

/** Danh sách email theo vai trò hệ thống từ bảng quyen (chỉ dòng dang_hieu_luc = Có). */
function emailTheoVaiTro(quyenRows, vaiTro) {
  return quyenRows.filter(function (q) {
    return laCo(q.dang_hieu_luc) && String(q.vai_tro_he_thong).trim() === vaiTro && laEmailHopLe(q.email);
  }).map(function (q) { return String(q.email).trim().toLowerCase(); });
}

function duyNhat(arr) {
  var seen = {}, out = [];
  arr.forEach(function (x) { if (!seen[x]) { seen[x] = true; out.push(x); } });
  return out;
}

/* ================= Dịch vụ Google (không test bằng Node) ================= */

/** Đọc tab theo tên cột → mảng object (có _dong). */
function docBang(ss, tenTab) {
  var sh = ss.getSheetByName(tenTab);
  if (!sh) throw new Error('Không thấy tab "' + tenTab + '" trong file ' + ss.getName());
  var vals = sh.getDataRange().getValues();
  return bangThanhObject(vals);
}

/** Ghi đè toàn bộ dữ liệu (giữ dòng tiêu đề) theo đúng thứ tự cột hiện có trên sheet. */
function ghiBang(ss, tenTab, rows) {
  var sh = ss.getSheetByName(tenTab);
  var cols = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, cols.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, cols.length).setValues(objectThanhBang(rows, cols));
}

/** Đọc cau_hinh của file → {khoa: gia_tri} */
function docCauHinh(ss) {
  var map = {};
  docBang(ss, 'cau_hinh').forEach(function (r) { if (r.khoa) map[String(r.khoa).trim()] = r.gia_tri; });
  return map;
}

function ghiCauHinh(ss, khoa, giaTri) {
  var sh = ss.getSheetByName('cau_hinh');
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === khoa) { sh.getRange(i + 1, 2).setValue(giaTri); return; }
  }
  sh.appendRow([khoa, giaTri, '']);
}

function bayGio() { return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'); }

/**
 * Khóa một tab lớp: chỉ các email cho phép (người phụ trách + NHAP_LIEU + QUAN_TRI) được sửa.
 * Vùng tự động (dòng 1–8, cột buoi_so/thu, cột ZOOM_REPORT) khóa riêng: chỉ QUAN_TRI.
 */
function baoVeTabLop(sheet, emailDuocSua, emailQuanTri, vungChiQuanTri) {
  sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
  sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { p.remove(); });
  var p = sheet.protect().setDescription('E-WIT · tab lớp ' + sheet.getName());
  p.setWarningOnly(false);
  var cho = duyNhat(emailDuocSua.concat(emailQuanTri));
  p.removeEditors(p.getEditors());
  if (cho.length) p.addEditors(cho);
  (vungChiQuanTri || []).forEach(function (a1) {
    var pr = sheet.getRange(a1).protect().setDescription('E-WIT · ô tự động');
    pr.removeEditors(pr.getEditors());
    if (emailQuanTri.length) pr.addEditors(emailQuanTri);
  });
}

/* Cho Node test */
if (typeof module !== 'undefined') {
  module.exports = { bangThanhObject: bangThanhObject, objectThanhBang: objectThanhBang, ngayKey: ngayKey,
    ngayGon: ngayGon, thuCuaNgay: thuCuaNgay, nhanThu: nhanThu, tachDanhSach: tachDanhSach,
    laEmailHopLe: laEmailHopLe, laCo: laCo, emailTheoVaiTro: emailTheoVaiTro, duyNhat: duyNhat };
}
