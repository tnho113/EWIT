/**
 * Giả lập dùng chung cho mọi bộ kiểm thử Board v2 (Sheets + môi trường Apps Script cơ bản).
 * const { taoBang, taoMoiTruong, maNguon } = require('./gia-lap');
 * Mỗi tệp kiểm thử tự thêm giả lập riêng (Drive, AdminDirectory, …) qua tham số `them`.
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const THU_MUC = path.join(__dirname, '..', 'apps-script');
const maNguon = () => fs.readdirSync(THU_MUC).filter(f => f.endsWith('.gs')).sort()
  .map(f => fs.readFileSync(path.join(THU_MUC, f), 'utf8')).join('\n');

function taoBang(duLieu) {
  const tabs = {};
  const taoTab = (ten, v) => {
    const t = { ten, v: v.map(r => r.slice()) };
    const rong = () => Math.max(1, ...t.v.map(r => r.length));
    const dat = (r, c, val) => { while (t.v.length < r) t.v.push([]); const row = t.v[r - 1]; while (row.length < c) row.push(''); row[c - 1] = val; };
    Object.assign(t, {
      getName: () => ten, getSheetId: () => ten,
      getDataRange: () => ({ getValues: () => t.v.map(r => { const x = r.slice(); while (x.length < rong()) x.push(''); return x; }) }),
      getLastRow: () => t.v.length, getLastColumn: () => rong(),
      getRange: (r, c, nr = 1, nc = 1) => ({
        getValues: () => { const o = []; for (let i = 0; i < nr; i++) { o.push([]); for (let j = 0; j < nc; j++) o[i].push(((t.v[r - 1 + i] || [])[c - 1 + j]) ?? ''); } return o; },
        setValues: vals => vals.forEach((row, i) => row.forEach((val, j) => dat(r + i, c + j, val))),
        setValue: val => dat(r, c, val),
        clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (t.v[r - 1 + i]) t.v[r - 1 + i][c - 1 + j] = ''; }
      }),
      appendRow: row => t.v.push(row.slice()),
      clear: () => { t.v = []; },
      setFrozenRows: () => {}
    });
    tabs[ten] = t; return t;
  };
  Object.keys(duLieu).forEach(k => taoTab(k, duLieu[k]));
  return { tabs, getSheetByName: n => tabs[n] || null, insertSheet: n => taoTab(n, []), toast: () => {},
    getId: () => 'BANG', getUrl: () => 'https://docs.google.com/spreadsheets/d/BANG' };
}

/** Tạo môi trường chạy toàn bộ .gs. them: các đối tượng toàn cục giả (Drive, AdminDirectory, MailApp…). */
function taoMoiTruong(bang, them = {}, nguoiChay = 'admin@example.com') {
  const props = {};
  const ctx = Object.assign({
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => bang, openById: () => bang, create: () => taoBang({}),
      getUi: () => ({ alert: () => 'YES', Button: { YES: 'YES', NO: 'NO' }, ButtonSet: { YES_NO: 1, OK: 0 },
        createMenu: () => ({ addItem() { return this; }, addSubMenu() { return this; }, addSeparator() { return this; }, addToUi() {} }) })
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => nguoiChay }), getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    Utilities: { formatDate: (d, tz, f) => f === 'dd/MM/yyyy' ? '15/11/2026' : '15/11/2026 10:00', sleep: () => {}, getUuid: () => 'u' + Math.random() },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; } }) },
    ScriptApp: { newTrigger: () => ({ timeBased() { return this; }, after() { return this; }, create() { return { getUniqueId: () => 't1' }; } }),
      getProjectTriggers: () => [], deleteTrigger: () => {} },
    MailApp: { sendEmail: () => {} }
  }, them);
  vm.createContext(ctx); vm.runInContext(maNguon(), ctx);
  return ctx;
}

/** Bảng mẫu đầy đủ tiêu đề v2 (dữ liệu tối thiểu). */
function bangMau() {
  return taoBang({
    CAI_DAT: [['Nhãn', 'Giá trị'], ['Email admin', 'admin@example.com'], ['Tên miền', 'example.com'], ['Tiền tố nhóm', 'sd-'], ['Thương hiệu mặc định', 'EWIT'], ['Gửi thư chào', 'Có']],
    NHOM: [['Mã nhóm', 'Tên nhóm', 'Loại', 'Thuộc', 'Nhánh', 'Thương hiệu', 'Trạng thái', 'Email nhóm', 'ID thư mục', 'Kết quả']],
    NHAP: [['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Tình trạng', 'Lỗi']],
    NGUOI: [['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Level', 'Trạng thái', 'Ngày vào', 'Cập nhật', 'ID ổ', 'Kết quả Drive']],
    THANH_VIEN: [['Email', 'Họ tên', 'Mã nhóm', 'Loại nhóm', 'Vai trong nhóm', 'Quyền', 'Trạng thái', 'Ngày thêm', 'Cập nhật', 'Nguồn', 'Lịch sử', 'Kết quả Drive']],
    VAI_TRO: [['Vai trò / Level', 'Loại', 'Được chia sẻ', 'Khi nghỉ', 'Khuôn ổ cá nhân', 'Ghi chú'],
      ['HV', 'Vai trò', 'Không', 'Thu ổ', 'Ổ HV'], ['EF', 'Vai trò', 'Không', 'Giữ ổ', 'Ổ EF'], ['GV', 'Vai trò', 'Có', 'Giữ ổ', 'Ổ GV'],
      ['Tổ chức', 'Vai trò', 'Có', 'Giữ ổ', 'Ổ EF'], ['L3', 'Level', 'Không'], ['L2', 'Level', 'Không'], ['PIONEER', 'Level', 'Có']],
    CAU_TRUC: [['Mã', 'Ổ', 'Đường dẫn', 'Loại', 'Nguồn / Đích / Áp cho', 'Quyền chủ ổ / người dùng', 'Ghi chú', 'ID']],
    LS_NHAP: [['Thời gian xử lý', 'Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Kết quả']],
    NHAT_KY: [['Thời gian', 'Lệnh', 'Phần', 'Việc', 'Đối tượng']]
  });
}

module.exports = { taoBang, taoMoiTruong, bangMau, maNguon };
