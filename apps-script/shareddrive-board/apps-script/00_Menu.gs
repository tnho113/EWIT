/**
 * MLWIT · SHARED DRIVE BOARD v2 · MENU
 * Mô hình "mỗi người một ổ" (WD-23). Bảng là gốc; chỉ admin chạy.
 * Đợt 1: Thành viên › Đưa vào danh sách tổng (chưa chạm Drive).
 * Đợt 2 sẽ thêm: Drive › Xem trước / Áp dụng. Đợt 3: Quét & dọn dẹp.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Shared Drive')
    .addSubMenu(ui.createMenu('Thành viên')
      .addItem('Đưa vào danh sách tổng', 'sdDuaVaoTong'))
    .addToUi();
}

function sdDuaVaoTong() { chayPhien_('Đưa vào danh sách tổng', duaVaoTong_); }
