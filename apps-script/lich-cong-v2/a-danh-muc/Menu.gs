/**
 * E-WIT · ⓐ DANH MỤC · Menu.gs
 * Menu "E-WIT" và các hàm bao bọc có thông báo lỗi tiếng Việt.
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('E-WIT')
    .addItem('Cài đặt định dạng & danh sách chọn', 'caiDatDinhDang')
    .addSeparator()
    .addItem('Xem trước thay đổi quyền', 'xemTruocQuyen')
    .addItem('Áp dụng quyền', 'apDungQuyen')
    .addItem('Cài đặt chạy tự động (mỗi giờ)', 'caiDatTuDong')
    .addSeparator()
    .addItem('Giới thiệu phiên bản', 'gioiThieuPhienBan')
    .addToUi();
}

/** Có giao diện (chạy tay) hay không. Trigger không có UI. */
function coUi_() {
  try { SpreadsheetApp.getUi(); return true; } catch (e) { return false; }
}

/** Thông báo cho người dùng; không có UI thì bỏ qua. */
function thongBao_(tieuDe, noiDung) {
  if (coUi_()) SpreadsheetApp.getUi().alert(tieuDe, noiDung, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Chạy một việc, bắt lỗi và báo bằng tiếng Việt. Trả về true nếu không lỗi. */
function chayAnToan_(tenViec, fn) {
  try {
    fn();
    return true;
  } catch (err) {
    var msg = (err && err.message) ? err.message : String(err);
    if (coUi_()) {
      thongBao_('Không hoàn thành: ' + tenViec, msg + '\n\nNếu chưa rõ cách xử lý, chụp màn hình này gửi người phụ trách IT.');
    } else {
      throw err; // trigger: để Apps Script ghi nhận lỗi
    }
    return false;
  }
}

function gioiThieuPhienBan() {
  chayAnToan_('Giới thiệu phiên bản', function () {
    thongBao_('E-WIT · ⓐ DANH MỤC',
      'Phiên bản code: ' + SCRIPT_VERSION + '\nMúi giờ: ' + TZ +
      '\n\nChức năng: định dạng + danh sách chọn cho các tab danh mục; chia sẻ file ⓐⓑⓒ và khóa tab lớp theo tab quyen / lop.phu_trach_email.');
  });
}
