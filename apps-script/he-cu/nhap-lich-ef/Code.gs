/**
 * E-WIT · Web NHẬP LIỆU lịch EF
 * - Chỉ hiện các lớp có học trong khoảng ngày được chọn (theo Eff_From / Eff_To của DS_Lop).
 * - Lưu thẳng vào đúng tab Schedule-YY theo NĂM của ngày học, tìm dòng theo TÊN LỚP.
 * - Lớp chưa có trong tab năm đó → tự thêm dòng. Tab năm chưa có → tự tạo từ tab năm gần nhất.
 * - Mỗi lần lưu ghi vào tab "Lịch sử nhập".
 * - Chỉ người có quyền CHỈNH SỬA file Sheet mới lưu được.
 */

// ⚠ ĐANG TRỎ VÀO BẢN THỬ. Khi chạy thật, đổi thành ID file chính: 1BFeDgHWEzQySFnT4bOUMAZmt0O-Az58EnqoInrdlHy4
const SPREADSHEET_ID = '1jnvHxb9WnxZ31SiTfJDzsntI0V-beDR3aMgt4CMklOk';
const PAGE_TITLE = 'E-WIT · Nhập lịch EF ĐỨNG LỚP';

const FIRST_ROW = 4;      // dòng lớp đầu tiên trong tab Schedule
const LAST_ROW = 100;     // dòng lớp cuối cùng (Log đọc tới dòng 100)
const DAY1_COL = 4;       // cột D = ngày 01/01
const MAX_DAYS = 62;      // tối đa số ngày mỗi lần mở
const HISTORY_SHEET = 'Lịch sử nhập';
const CONFIG_SHEET = 'Cấu hình';

/* ============ Trang web ============ */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(PAGE_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ============ Tiện ích ngày (tính bằng UTC để không lệch múi giờ) ============ */
function ss_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function tabName_(y) { return 'Schedule-' + ('0' + (y % 100)).slice(-2); }
function ymdParts_(s) { const p = String(s).split('-').map(Number); return { y: p[0], m: p[1], d: p[2] }; }
function utc_(s) { const p = ymdParts_(s); return Date.UTC(p.y, p.m - 1, p.d); }
function ymdFromUtc_(t) { const d = new Date(t); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
function dayOfYear_(s) { const p = ymdParts_(s); return Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(p.y, 0, 1)) / 864e5) + 1; }
function dayList_(from, to) {
  const out = []; for (let t = utc_(from); t <= utc_(to); t += 864e5) out.push(ymdFromUtc_(t)); return out;
}
function dowCode_(s) { const w = new Date(utc_(s)).getUTCDay(); return w === 0 ? 8 : w + 1; } // 2=T2 … 7=T7, 8=CN

/* ============ Nhận diện lớp Hoàng Minh (có hoặc không dấu) ============ */
function isHoangMinh_(name) {
  return /hoang\s*minh/i.test(String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd'));
}

/* ============ Đọc danh mục ============ */
function readClasses_(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const fmt = v => (v instanceof Date) ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : '';
  const sh = ss.getSheetByName('DS_Lop'); const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 15).getValues()
    .filter(r => r[1])
    .map(r => ({
      name: String(r[1]).trim(), kind: String(r[2] || ''),
      from: fmt(r[5]), to: fmt(r[6]),
      days: String(r[9] || '').replace(/\D/g, ''),
      status: String(r[12] || ''), time: String(r[14] || '')
    }));
}

function readOptions_(ss) {
  const sh = ss.getSheetByName('DS_EF'); const last = sh.getLastRow();
  const res = { people: [], statuses: [], teams: [], efColors: {} };
  if (last < 2) return res;
  sh.getRange(2, 1, last - 1, 6).getDisplayValues().forEach(r => {
    const v = String(r[0]).trim(), type = String(r[1]).trim();
    if (!v) return;
    const bg = String(r[3] || '').trim(), fg = String(r[4] || '').trim();
    if (/^EF:/.test(v) || type === 'EF') {
      const label = v.replace(/^EF:\s*/, '');
      res.people.push({ v: v, label: label, kind: 'EF' });
      if (bg || fg) res.efColors[label] = { bg: bg, fg: fg };
    } else if (type === 'Giáo viên') {
      res.people.push({ v: v, label: v, kind: 'GV' });
      if (bg || fg) res.efColors[v] = { bg: bg, fg: fg };
    } else if (type === 'Team') {
      res.teams.push({ v: v });
    } else {
      res.statuses.push({ v: v, need: String(r[5]).trim() === 'Có' });
    }
  });
  return res;
}

/* ============ API 1: tải dữ liệu cho khoảng ngày ============ */
function getData(fromStr, toStr) {
  if (!fromStr || !toStr || fromStr > toStr) throw new Error('Khoảng ngày không hợp lệ.');
  const days = dayList_(fromStr, toStr);
  if (days.length > MAX_DAYS) throw new Error('Mỗi lần chỉ mở tối đa ' + MAX_DAYS + ' ngày.');

  const ss = ss_();
  const tz = ss.getSpreadsheetTimeZone();
  const classes = readClasses_(ss)
    .filter(c => c.from && c.from <= toStr && (!c.to || c.to >= fromStr))
    .map(c => { c.hm = isHoangMinh_(c.name); return c; })
    // Lớp Hoàng Minh lên đầu, sau đó các lớp khác; trong mỗi nhóm xếp theo giờ học trong ngày
    .sort((a, b) => (b.hm - a.hm) || (a.time || '99').localeCompare(b.time || '99') || a.name.localeCompare(b.name));

  // Giá trị hiện có trong các tab năm
  const values = {};
  const byYear = {};
  days.forEach(d => { const y = ymdParts_(d).y; (byYear[y] = byYear[y] || []).push(d); });
  Object.keys(byYear).forEach(y => {
    const sh = ss.getSheetByName(tabName_(Number(y)));
    if (!sh) return;
    const ds = byYear[y];
    const c0 = DAY1_COL - 1 + dayOfYear_(ds[0]);
    const nRows = LAST_ROW - FIRST_ROW + 1;
    const names = sh.getRange(FIRST_ROW, 2, nRows, 1).getValues().map(r => String(r[0]).trim());
    const grid = sh.getRange(FIRST_ROW, c0, nRows, ds.length).getValues();
    names.forEach((n, i) => {
      if (!n) return;
      ds.forEach((d, j) => {
        const v = grid[i][j];
        if (v !== '' && v !== null) values[n + '|' + d] = String(v).trim();
      });
    });
  });

  const opt = readOptions_(ss);
  return {
    days: days, classes: classes, values: values,
    people: opt.people, statuses: opt.statuses, teams: opt.teams, efColors: opt.efColors,
    user: Session.getActiveUser().getEmail(),
    today: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'),
    loadedAt: Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy HH:mm')
  };
}

/* ============ API 2: lưu thay đổi ============ */
/** changes: [{cls, d:'yyyy-MM-dd', oldV, newV}] */
function saveChanges(changes) {
  if (!changes || !changes.length) return { saved: 0, conflicts: [] };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Hệ thống đang bận lưu cho người khác. Vui lòng thử lại sau vài giây.');
  try {
    const ss = ss_();
    const user = Session.getActiveUser().getEmail() || '(không rõ)';
    const now = new Date();
    const rowCache = {};
    const hist = [], conflicts = [];
    let saved = 0;

    changes.forEach(c => {
      const y = ymdParts_(c.d).y;
      const sh = ensureYearTab_(ss, y);
      const row = findOrAddClassRow_(sh, c.cls, rowCache);
      const col = DAY1_COL - 1 + dayOfYear_(c.d);
      const cell = sh.getRange(row, col);
      const cur = String(cell.getValue()).trim();
      const oldV = String(c.oldV || '').trim();
      const newV = String(c.newV || '').trim();
      if (cur !== oldV) { conflicts.push({ cls: c.cls, d: c.d, current: cur }); return; }
      if (cur === newV) return;
      if (newV) cell.setValue(newV); else cell.clearContent();
      hist.push([now, user, sh.getName(), cell.getA1Notation(), c.cls, c.d, cur, newV]);
      saved++;
    });

    if (hist.length) {
      let h = ss.getSheetByName(HISTORY_SHEET);
      if (!h) { h = ss.insertSheet(HISTORY_SHEET); h.appendRow(['Thời gian', 'Người nhập', 'Tab', 'Ô', 'Lớp', 'Ngày học', 'Giá trị cũ', 'Giá trị mới']); h.setFrozenRows(1); }
      h.getRange(h.getLastRow() + 1, 1, hist.length, 8).setValues(hist);
    }
    SpreadsheetApp.flush();
    return { saved: saved, conflicts: conflicts };
  } catch (e) {
    if (/permission|quyền/i.test(String(e))) throw new Error('Tài khoản của bạn chưa có quyền CHỈNH SỬA file lịch. Vui lòng liên hệ quản trị.');
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/* ============ Tìm / thêm dòng lớp ============ */
function findOrAddClassRow_(sh, cls, cache) {
  const key = sh.getName();
  if (!cache[key]) {
    const names = sh.getRange(FIRST_ROW, 2, LAST_ROW - FIRST_ROW + 1, 1).getValues().map(r => String(r[0]).trim());
    cache[key] = names;
  }
  const names = cache[key];
  let i = names.indexOf(cls);
  if (i >= 0) return FIRST_ROW + i;
  i = names.indexOf('');
  if (i < 0) throw new Error('Tab ' + key + ' đã đủ ' + (LAST_ROW - FIRST_ROW + 1) + ' lớp, không thêm được "' + cls + '".');
  sh.getRange(FIRST_ROW + i, 2).setValue(cls);
  names[i] = cls;
  return FIRST_ROW + i;
}

/* ============ Tạo tab năm mới ============ */
function ensureYearTab_(ss, y) {
  const name = tabName_(y);
  let sh = ss.getSheetByName(name);
  if (sh) return sh;

  const tabs = ss.getSheets().filter(s => /^Schedule-\d{2}$/.test(s.getName()))
    .sort((a, b) => a.getName().localeCompare(b.getName()));
  if (!tabs.length) throw new Error('Không tìm thấy tab Schedule mẫu để tạo ' + name + '.');
  const tpl = tabs.filter(s => s.getName() < name).pop() || tabs[0];

  sh = tpl.copyTo(ss).setName(name);
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(tpl.getIndex() + 1);

  // Bỏ nhóm dòng/cột cũ
  sh.expandAllRowGroups(); sh.expandAllColumnGroups();
  sh.showRows(1, sh.getMaxRows()); sh.showColumns(1, sh.getMaxColumns());
  for (let r = 1; r <= sh.getMaxRows(); r++) { const d = sh.getRowGroupDepth(r); if (d > 0) sh.getRange(r, 1).shiftRowGroupDepth(-d); }
  for (let c = 1; c <= sh.getMaxColumns(); c++) { const d = sh.getColumnGroupDepth(c); if (d > 0) sh.getRange(1, c).shiftColumnGroupDepth(-d); }

  // Xóa dữ liệu, đặt năm
  const nRows = LAST_ROW - FIRST_ROW + 1;
  sh.getRange(FIRST_ROW, 1, nRows, 2).clearContent();
  sh.getRange(FIRST_ROW, DAY1_COL, nRows, sh.getMaxColumns() - DAY1_COL + 1).clearContent().clearNote();
  sh.getRange('A1').setValue(y);

  // Nhãn tháng ở dòng 1 + nhóm cột theo tháng (ngày 1 luôn hiện)
  sh.getRange(1, DAY1_COL, 1, sh.getMaxColumns() - DAY1_COL + 1).clearContent();
  const label = '="Tháng "&MONTH(INDEX($D$3:$NE$3,1,COLUMN()-3))&" ▸"';
  for (let m = 1; m <= 12; m++) {
    const first = Date.UTC(y, m - 1, 1), next = Date.UTC(y, m, 1);
    const firstDoy = Math.round((first - Date.UTC(y, 0, 1)) / 864e5) + 1;
    const len = Math.round((next - first) / 864e5);
    const col = DAY1_COL - 1 + firstDoy;
    sh.getRange(1, col).setFormula(label);
    if (len > 1) sh.getRange(1, col + 1, 1, len - 1).shiftColumnGroupDepth(1);
  }

  // Danh sách lớp có học trong năm (theo DS_Lop), sắp theo Eff_From
  const y0 = y + '-01-01', y1 = y + '-12-31';
  const list = readClasses_(ss)
    .filter(c => c.from && c.from <= y1 && (!c.to || c.to >= y0))
    .sort((a, b) => a.from.localeCompare(b.from) || a.name.localeCompare(b.name))
    .map(c => [c.name]);
  if (list.length) sh.getRange(FIRST_ROW, 2, Math.min(list.length, nRows), 1).setValues(list.slice(0, nRows));

  // Ghi tên tab vào Cấu hình để Log đọc được
  const cfg = ss.getSheetByName(CONFIG_SHEET);
  const col = cfg.getRange('A2:A30').getValues().map(r => String(r[0]).trim());
  if (col.indexOf(name) < 0) {
    const i = col.indexOf('');
    if (i >= 0) cfg.getRange(2 + i, 1, 1, 2).setValues([[name, 'Năm ' + y + ' (tự tạo)']]);
  }
  SpreadsheetApp.flush();
  return sh;
}

/* ============ Hẹn giờ tạo tab năm sau ============ */
/** Chạy tự động ngày 1 hằng tháng; chỉ làm việc vào tháng 12. */
function taoTabNamSau() {
  const now = new Date();
  if (now.getMonth() !== 11) return;
  ensureYearTab_(ss_(), now.getFullYear() + 1);
}

/** Chạy tay để tạo ngay tab năm sau (dùng khi kiểm thử). */
function taoTabNamSauNgay() {
  const sh = ensureYearTab_(ss_(), new Date().getFullYear() + 1);
  Logger.log('Đã có tab ' + sh.getName());
}

/** Chạy MỘT LẦN trong trình chỉnh sửa để cài lịch hẹn giờ. */
function caiDatHenGio() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'taoTabNamSau')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('taoTabNamSau').timeBased().onMonthDay(1).atHour(6).create();
  Logger.log('Đã cài: ngày 1 hằng tháng lúc 6h, chỉ tạo tab vào tháng 12.');
}
