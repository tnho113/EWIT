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
      .addItem('Áp dụng', 'sdDriveApDung')
      .addSeparator()
      .addItem('Gửi lại thư chào', 'sdGuiLaiThuChao')
      .addItem('Bật Áp dụng hằng đêm', 'sdBatHangDem')
      .addItem('Tắt Áp dụng hằng đêm', 'sdTatHangDem'))
    .addSubMenu(ui.createMenu('Quét & dọn dẹp')
      .addItem('Quét toàn Drive', 'sdQuet')
      .addItem('Mở báo cáo', 'sdMoBaoCao')
      .addItem('Gỡ chia sẻ đã đánh dấu', 'sdGoChiaSeDanhDau')
      .addSeparator()
      .addItem('Xem trước thu ổ người nghỉ', 'sdThuOXemTruoc')
      .addItem('Thu ổ người nghỉ', 'sdThuOApDung'))
    .addSubMenu(ui.createMenu('Cài đặt')
      .addItem('Nâng cấp bảng (thêm cột/tab còn thiếu)', 'sdNangCapBang'))
    .addToUi();
}

function sdDuaVaoTong() { chayPhien_('Đưa vào danh sách tổng', duaVaoTong_); }
