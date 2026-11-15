/**
 * MLWIT · SHARED DRIVE BOARD v2 · MENU
 * Mô hình "mỗi người một ổ" (WD-23). Bảng là gốc; chỉ admin chạy. Chạy trên máy tính (menu không hiện trên app điện thoại).
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Shared Drive')
    .addSubMenu(ui.createMenu('Thành viên')
      .addItem('Đưa vào danh sách tổng', 'sdDuaVaoTong'))
    .addSubMenu(ui.createMenu('Drive')
      .addItem('Xem trước (không đổi gì)', 'sdDriveXemTruoc')
      .addItem('Áp dụng', 'sdDriveApDung'))
    .addSubMenu(ui.createMenu('Quét & dọn dẹp')
      .addItem('Quét toàn Drive', 'sdQuet')
      .addItem('Mở báo cáo', 'sdMoBaoCao')
      .addSeparator()
      .addItem('Xem trước thu ổ người nghỉ', 'sdThuOXemTruoc')
      .addItem('Thu ổ người nghỉ', 'sdThuOApDung'))
    .addToUi();
}

function sdDuaVaoTong() { chayPhien_('Đưa vào danh sách tổng', duaVaoTong_); }
