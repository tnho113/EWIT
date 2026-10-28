/**
 * E-WIT · Lịch & Công v2 · Menu.gs (ⓑ NHẬP LIỆU)
 * Menu, cài đặt lần đầu, cập nhật danh mục (tab ẩn _dm_*), onEdit.
 * Cần: Chung.gs, TaoTabLogic.gs. Hàm của phiên B2 (DongBo.gs): dongBoNgay, moKiemTra, caiDatTriggerDongBo.
 */

var ID_DANH_MUC_MAC_DINH = '1-w1bSyxdcEfZs4ZdJn6ra2ImQFaF3m9q9-J8DmFvm0Q';
var ID_DU_LIEU_MAC_DINH = '1HWwRBmyYAxZjLjl-Uo1fwJbJ9aQQNmn45tMSl3OS4Rs';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('E-WIT')
    .addItem('Tạo tab lớp mới…', 'taoTabLopMoi')
    .addItem('Cập nhật danh mục', 'capNhatDanhMucCoThongBao')
    .addItem('Làm mới định dạng tab đang mở', 'lamMoiDinhDangTab')
    .addSeparator()
    .addItem('Đồng bộ ngay', 'chayDongBoNgay')
    .addItem('Xem lỗi', 'chayMoKiemTra')
    .addSeparator()
    .addItem('Cài đặt lần đầu', 'caiDatLanDau')
    .addToUi();
}

/** Gọi hàm của B2 một cách an toàn (nếu chưa dán DongBo.gs thì báo). */
function chayDongBoNgay() {
  if (typeof dongBoNgay === 'function') dongBoNgay();
  else SpreadsheetApp.getUi().alert('Chưa có DongBo.gs trong project. Hãy dán file DongBo.gs và DongBoLogic.gs.');
}
function chayMoKiemTra() {
  if (typeof moKiemTra === 'function') moKiemTra();
  else SpreadsheetApp.getUi().alert('Chưa có DongBo.gs trong project. Hãy dán file DongBo.gs và DongBoLogic.gs.');
}

/** Tạo tab ẩn cau_hinh (nếu chưa có), điền ID, cập nhật danh mục, cài trigger đồng bộ. */
function caiDatLanDau() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('cau_hinh');
  if (!sh) {
    sh = ss.insertSheet('cau_hinh');
    sh.getRange(1, 1, 1, 3).setValues([['khoa', 'gia_tri', 'ghi_chu']]).setFontWeight('bold');
    sh.getRange(2, 1, 2, 3).setValues([
      ['DANH_MUC_ID', ID_DANH_MUC_MAC_DINH, 'File ⓐ DANH MỤC'],
      ['DU_LIEU_ID', ID_DU_LIEU_MAC_DINH, 'File ⓒ DỮ LIỆU CHUẨN']
    ]);
    sh.hideSheet();
  }
  ghiCauHinh(ss, 'SCRIPT_VERSION', SCRIPT_VERSION);
  capNhatDanhMuc();
  if (typeof caiDatTriggerDongBo === 'function') caiDatTriggerDongBo();
  SpreadsheetApp.getUi().alert('Đã cài đặt xong. Danh mục đã được cập nhật.');
}

function capNhatDanhMucCoThongBao() {
  capNhatDanhMuc();
  SpreadsheetApp.getActive().toast('Đã cập nhật danh mục.', 'E-WIT', 4);
}

/** Mở file ⓐ theo cau_hinh của ⓑ. */
function moFileDanhMuc() {
  var cfg = docCauHinh(SpreadsheetApp.getActive());
  var id = String(cfg.DANH_MUC_ID || '').trim();
  if (!id) throw new Error('Chưa có DANH_MUC_ID trong tab cau_hinh. Chạy "Cài đặt lần đầu".');
  return SpreadsheetApp.openById(id);
}

/** Ghi tab ẩn _dm_ef và _dm_trang_thai từ ⓐ. */
function capNhatDanhMuc() {
  var ss = SpreadsheetApp.getActive();
  var dm = moFileDanhMuc();

  var ef = docBang(dm, 'ef').filter(function (r) { return laCo(r.dang_hoat_dong) && r.ten_hien_thi; });
  ef.sort(function (a, b) { return String(a.ten_hien_thi).localeCompare(String(b.ten_hien_thi), 'vi'); });
  ghiTabAn(ss, '_dm_ef', ['ten_hien_thi', 'ef_id'],
    ef.map(function (r) { return [r.ten_hien_thi, r.ef_id]; }));

  var tt = docBang(dm, 'trang_thai_buoi').filter(function (r) { return r.ten; });
  ghiTabAn(ss, '_dm_trang_thai', ['ten', 'status_id', 'mau', 'ghi_nhan_nguoi'],
    tt.map(function (r) { return [r.ten, r.status_id, r.mau || '', r.ghi_nhan_nguoi || '']; }));
}

/** Tạo (nếu chưa có) và ghi đè một tab ẩn danh mục. */
function ghiTabAn(ss, ten, tieuDe, dong) {
  var sh = ss.getSheetByName(ten) || ss.insertSheet(ten);
  sh.clearContents();
  sh.getRange(1, 1, 1, tieuDe.length).setValues([tieuDe]);
  if (dong.length) sh.getRange(2, 1, dong.length, tieuDe.length).setValues(dong);
  if (!sh.isSheetHidden()) sh.hideSheet();
}

/**
 * Simple trigger: sửa trong tab lớp (dòng khóa 7 có 'ngay') ở dòng >= 9 → bật cờ CO_THAY_DOI.
 * Buổi và Thứ do công thức trong tab tự tính (datCongThucTuDong), không ghi ở đây.
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    var r2 = e.range.getRow() + e.range.getNumRows() - 1;
    if (r2 < TAB_LOP.DONG_DAU) return;
    if (sh.getLastColumn() < 2) return;
    var khoa = sh.getRange(TAB_LOP.DONG_KHOA, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    if (khoa.indexOf('ngay') < 0) return; // không phải tab lớp
    PropertiesService.getScriptProperties().setProperty('CO_THAY_DOI', 'true');
  } catch (err) {
    // Simple trigger: không báo lỗi ra người dùng.
  }
}
