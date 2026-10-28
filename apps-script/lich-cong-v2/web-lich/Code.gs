/**
 * E-WIT · Lịch & Công v2 · Web Lịch · Code.gs
 * Web app standalone: đọc ⓒ (buoi_hoc, phan_cong) + ⓐ (lop, ef, vai_tro, trang_thai_buoi).
 * Chạy với quyền của NGƯỜI XEM → người xem phải có quyền XEM ⓐ và ⓒ. Không trả email về trình duyệt.
 */

var DU_LIEU_ID = '1HWwRBmyYAxZjLjl-Uo1fwJbJ9aQQNmn45tMSl3OS4Rs';   // ⓒ
var DANH_MUC_ID = '1-w1bSyxdcEfZs4ZdJn6ra2ImQFaF3m9q9-J8DmFvm0Q';  // ⓐ
var TIEU_DE_TRANG = 'E-WIT · Lịch lên lớp v2';
var CACHE_GIAY = 300;

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle(TIEU_DE_TRANG)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // cho nhúng Google Site
}

/** Nhúng file HTML con (Brand.html) vào Index. */
function include(ten) {
  return HtmlService.createHtmlOutputFromFile(ten).getContent();
}

/** Như docBang nhưng các cột giờ lấy theo giá trị hiển thị (tránh lệch múi giờ của ô giờ Sheets). */
function docBangGio(ss, tenTab, cotGio) {
  var sh = ss.getSheetByName(tenTab);
  if (!sh) throw new Error('Không thấy tab "' + tenTab + '"');
  var rng = sh.getDataRange(), vals = rng.getValues(), hien = rng.getDisplayValues();
  if (!vals.length) return [];
  var head = vals[0].map(function (h) { return String(h).trim(); });
  cotGio.forEach(function (c) {
    var j = head.indexOf(c);
    if (j >= 0) for (var i = 1; i < vals.length; i++) vals[i][j] = hien[i][j];
  });
  return bangThanhObject(vals);
}

/**
 * Dữ liệu thô gọn trong khoảng ngày (yyyy-MM-dd, tối đa 62 ngày). Cache 5 phút theo NGƯỜI XEM
 * (getUserCache, không dùng cache chung để người chưa có quyền không đọc được dữ liệu người khác).
 */
function layDuLieu(tu, den) {
  var kq = kiemTraKhoang(tu, den);
  tu = kq.tu; den = kq.den;
  var cache = null, khoa = 'lichv2_' + tu + '_' + den;
  try {
    cache = CacheService.getUserCache();
    var dem = cache.get(khoa);
    if (dem) return JSON.parse(dem);
  } catch (e) { cache = null; }

  var ssC, ssA;
  try {
    ssC = SpreadsheetApp.openById(DU_LIEU_ID);
    ssA = SpreadsheetApp.openById(DANH_MUC_ID);
  } catch (e) {
    throw new Error('KHONG_CO_QUYEN');
  }

  var buoi = docBangGio(ssC, 'buoi_hoc', ['gio_bat_dau', 'gio_ket_thuc']).map(function (r) {
    return { session_id: r.session_id, class_id: r.class_id, ngay: ngayKey(r.ngay), buoi_so: r.buoi_so,
      gio_bat_dau: r.gio_bat_dau, gio_ket_thuc: r.gio_ket_thuc, status_id: r.status_id };
  }).filter(function (r) { return r.ngay && r.ngay >= tu && r.ngay <= den; });

  var phanCong = docBang(ssC, 'phan_cong').map(function (r) {
    return { session_id: r.session_id, class_id: r.class_id, ngay: ngayKey(r.ngay), ef_id: r.ef_id,
      role_id: r.role_id, status_id: r.status_id };
  }).filter(function (r) { return r.ngay && r.ngay >= tu && r.ngay <= den; });

  var lop = docBangGio(ssA, 'lop', ['gio_bat_dau', 'gio_ket_thuc']).map(function (r) {
    return { class_id: r.class_id, ten_lop: r.ten_lop, gio_bat_dau: r.gio_bat_dau, gio_ket_thuc: r.gio_ket_thuc,
      thu_hoc: String(r.thu_hoc === undefined ? '' : r.thu_hoc), trang_thai: r.trang_thai,
      ngay_bat_dau: ngayKey(r.ngay_bat_dau), ngay_ket_thuc: ngayKey(r.ngay_ket_thuc) };
  });
  var ef = docBang(ssA, 'ef').map(function (r) {
    return { ef_id: r.ef_id, ten_hien_thi: r.ten_hien_thi, mau_nen: r.mau_nen, mau_chu: r.mau_chu };
  });
  var vaiTro = docBang(ssA, 'vai_tro').filter(function (r) { return laCo(r.dang_dung); }).map(function (r) {
    return { role_id: r.role_id, ten_vai_tro: r.ten_vai_tro };
  });
  var trangThai = docBang(ssA, 'trang_thai_buoi').map(function (r) {
    return { status_id: r.status_id, ten: r.ten, mau: r.mau, ghi_nhan_nguoi: r.ghi_nhan_nguoi };
  });

  var kqDl = { buoi: buoi, phanCong: phanCong, lop: lop, ef: ef, vaiTro: vaiTro, trangThai: trangThai,
    capNhat: Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm') };
  try { var s = JSON.stringify(kqDl); if (cache && s.length < 95000) cache.put(khoa, s, CACHE_GIAY); } catch (e) { /* quá lớn: bỏ qua cache */ }
  return kqDl;
}

/** Hàm trang web gọi: dữ liệu + bộ lọc → lưới đã dựng. */
function layLuoi(tu, den, boLoc) {
  var dl = layDuLieu(tu, den);
  var kq = kiemTraKhoang(tu, den);
  var luoi = dungLuoi(dl, kq.tu, kq.den, boLoc || {});
  luoi.homNay = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  luoi.capNhat = dl.capNhat;
  return luoi;
}
