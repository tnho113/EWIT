/**
 * E-WIT · Web xem lịch & chấm công EF
 * Đọc trực tiếp từ file Google Sheet "Syllabus_schedule" (tab Log và DS_Lop).
 * Dùng CHUNG file Code.gs này cho cả 2 dự án (Lịch lên lớp & Chấm công).
 */

// ID của file Google Sheet (lấy trong đường link .../spreadsheets/d/<ID>/edit)
const SPREADSHEET_ID = '1BFeDgHWEzQySFnT4bOUMAZmt0O-Az58EnqoInrdlHy4';

// Tên trang hiển thị trên tab trình duyệt (đổi cho từng dự án nếu muốn)
const PAGE_TITLE = 'E-WIT · Chấm công EF';

/** Mở trang web */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(PAGE_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Trả dữ liệu trong khoảng ngày cho trang web.
 * @param {string} fromStr dạng yyyy-MM-dd
 * @param {string} toStr   dạng yyyy-MM-dd
 */
function getData(fromStr, toStr) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tz = ss.getSpreadsheetTimeZone();
  const key = d => (d instanceof Date) ? Utilities.formatDate(d, tz, 'yyyy-MM-dd') : '';

  // 1) Nhật ký buổi học (tab Log): Ngày | Tháng | Tab năm | Lớp | Tên lớp cũ | Giờ | Nội dung ô | Loại | EF | Course_ID
  const log = ss.getSheetByName('Log');
  const lastLog = log.getLastRow();
  const rows = [];
  if (lastLog > 1) {
    const values = log.getRange(2, 1, lastLog - 1, 10).getValues();
    values.forEach(r => {
      const d = key(r[0]);
      if (!d || d < fromStr || d > toStr || !r[3]) return;
      rows.push({
        d: d,
        cls: String(r[3]),
        time: String(r[5] || ''),
        content: String(r[6] || ''),
        type: String(r[7] || ''),
        ef: String(r[8] || '')
      });
    });
  }

  // 2) Danh sách lớp (tab DS_Lop): B tên | C loại | F Eff_From | G Eff_To | M trạng thái | O giờ học
  const dsl = ss.getSheetByName('DS_Lop');
  const lastL = dsl.getLastRow();
  const classes = [];
  if (lastL > 1) {
    dsl.getRange(2, 1, lastL - 1, 15).getValues().forEach(r => {
      if (!r[1]) return;
      classes.push({
        name: String(r[1]),
        kind: String(r[2] || ''),
        from: key(r[5]),
        to: key(r[6]),
        status: String(r[12] || ''),
        time: String(r[14] || '')
      });
    });
  }

  // 3) Tab DS_EF: A tên | D màu nền | E màu chữ | F cần kèm tên người
  const dse = ss.getSheetByName('DS_EF');
  const lastE = dse.getLastRow();
  const efColors = {}, needName = [];
  if (lastE > 1) {
    dse.getRange(2, 1, lastE - 1, 6).getDisplayValues().forEach(r => {
      // Cột F = "Có": trạng thái cần ghi kèm tên người (FINAL TEST, OFFLINE, NGOẠI KHÓA...)
      if (String(r[5]).trim() === 'Có' && r[0]) needName.push(String(r[0]).trim());
      const name = String(r[0]).replace(/^EF:\s*/, '').trim();
      const bg = String(r[3] || '').trim(), fg = String(r[4] || '').trim();
      if (name && /^EF:/.test(String(r[0])) && (bg || fg)) efColors[name] = { bg: bg, fg: fg };
    });
  }

  return {
    rows: rows,
    classes: classes,
    efColors: efColors,
    needName: needName,
    today: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'),
    updated: Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm')
  };
}
