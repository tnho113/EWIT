/**
 * Kiểm thử Shared Drive Board v2 (Đợt 1: Đưa vào danh sách tổng) ngoài Google.
 * Chạy: node shareddrive-kit/v2/kiem-thu/kiem-thu.js   (đứng ở thư mục Tool_Quan_Tri)
 * Chỉ dùng email @example.com.
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const THU_MUC = path.join(__dirname, '..', 'apps-script');
const MA = fs.readdirSync(THU_MUC).filter(f => f.endsWith('.gs')).sort().map(f => fs.readFileSync(path.join(THU_MUC, f), 'utf8')).join('\n');
const ADMIN = 'admin@example.com';

function taoBang(duLieu) {
  const tabs = {};
  const taoTab = (ten, v) => {
    const t = { ten, v: v.map(r => r.slice()) };
    const rong = () => Math.max(1, ...t.v.map(r => r.length));
    const dat = (r, c, val) => { while (t.v.length < r) t.v.push([]); const row = t.v[r - 1]; while (row.length < c) row.push(''); row[c - 1] = val; };
    Object.assign(t, {
      getDataRange: () => ({ getValues: () => t.v.map(r => { const x = r.slice(); while (x.length < rong()) x.push(''); return x; }) }),
      getLastRow: () => t.v.length, getLastColumn: () => rong(),
      getRange: (r, c, nr = 1, nc = 1) => ({
        getValues: () => { const o = []; for (let i = 0; i < nr; i++) { o.push([]); for (let j = 0; j < nc; j++) o[i].push(((t.v[r - 1 + i] || [])[c - 1 + j]) ?? ''); } return o; },
        setValues: vals => vals.forEach((row, i) => row.forEach((val, j) => dat(r + i, c + j, val))),
        setValue: val => dat(r, c, val)
      }),
      appendRow: row => t.v.push(row.slice())
    });
    tabs[ten] = t; return t;
  };
  Object.keys(duLieu).forEach(k => taoTab(k, duLieu[k]));
  return { tabs, getSheetByName: n => tabs[n] || null, insertSheet: n => taoTab(n, []), toast: () => {} };
}

function moiTruong(bang, nguoiChay = ADMIN) {
  const ctx = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => bang, getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addSubMenu() { return this; }, addToUi() {} }) }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => nguoiChay }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    Utilities: { formatDate: (d, tz, f) => f === 'dd/MM/yyyy' ? '15/11/2026' : '15/11/2026 10:00' }
  };
  vm.createContext(ctx); vm.runInContext(MA, ctx);
  return ctx;
}

const NHAP_COT = ['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Tình trạng', 'Lỗi'];
const bang = taoBang({
  CAI_DAT: [['Nhãn', 'Giá trị'], ['Email admin', ADMIN]],
  NHOM: [['Mã nhóm', 'Tên nhóm', 'Loại', 'Thuộc', 'Nhánh', 'Thương hiệu', 'Trạng thái', 'Email nhóm', 'ID thư mục', 'Kết quả'],
    ['L3', 'EF Level 3', 'Level', '', '', 'EWIT', 'Đang'], ['L2', 'EF Level 2', 'Level', '', '', 'EWIT', 'Đang'],
    ['ME02', 'IELTS Mentor 02', 'Lớp', '', 'ME', 'EWIT', 'Đang'],
    ['ME02-07', 'Nhóm 07', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'], ['ME02-08', 'Nhóm 08', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'],
    ['KIND', 'Kind English', 'Dự án', '', '', 'EWIT', 'Đang'], ['CU', 'Dự án cũ', 'Dự án', '', '', 'EWIT', 'Ngừng'],
    ['RAW', 'Tri thức Raw', 'Tri thức', '', '', 'MLWIT', 'Đang'], ['BTC', 'Ban tổ chức', 'Tổ chức', '', '', 'EWIT', 'Đang']],
  NHAP: [NHAP_COT],
  NGUOI: [['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Level', 'Trạng thái', 'Ngày vào', 'Cập nhật', 'ID ổ', 'Kết quả Drive']],
  THANH_VIEN: [['Email', 'Họ tên', 'Mã nhóm', 'Loại nhóm', 'Vai trong nhóm', 'Quyền', 'Trạng thái', 'Ngày thêm', 'Cập nhật', 'Nguồn', 'Lịch sử', 'Kết quả Drive']],
  NHAT_KY: [['Thời gian', 'Lệnh', 'Phần', 'Việc', 'Đối tượng']]
});
const N = bang.tabs.NHAP;
/** Ghi các dòng vào NHAP từ dòng 2 (như người nhập trên tab trống), giữ dòng lỗi còn lại ở trên. */
const themNhap = rows => {
  let i = 1; while (i < N.v.length && N.v[i][0]) i++;
  rows.forEach(r => { N.v[i] = [r[0], r[1] || '', r[2] || '', r[3] || '', r[4] || '', r[5] || '', r[6] || '', r[7] || '', '', '', '']; i++; });
};
let lsTruoc = 0;
const chay = ai => { lsTruoc = (bang.tabs.LS_NHAP ? bang.tabs.LS_NHAP.v.length : 0); moiTruong(bang, ai).sdDuaVaoTong(); };
/** Kết quả của lần chạy vừa rồi: dòng ✔ (từ LS_NHAP) + dòng còn ở NHAP (lỗi). */
const lsMoi = () => bang.tabs.LS_NHAP ? bang.tabs.LS_NHAP.v.slice(Math.max(1, lsTruoc)).map(r => r[10]) : [];
const conLai = () => N.v.slice(1).filter(r => r[0]).map(r => r[10]);
const coKq = re => lsMoi().concat(conLai()).some(x => re.test(x));
const tvMap = () => { const v = bang.tabs.THANH_VIEN.v; const h = v[0]; const m = {}; v.slice(1).forEach(r => { const o = {}; h.forEach((c, i) => o[c] = r[i]); m[o['Email'] + '|' + o['Mã nhóm']] = o; }); return m; };
const nguoiMap = () => { const v = bang.tabs.NGUOI.v; const h = v[0]; const m = {}; v.slice(1).forEach(r => { const o = {}; h.forEach((c, i) => o[c] = r[i]); m[o['Email']] = o; }); return m; };

let dat = 0, truot = 0;
function nhom(ten, fn) { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } }

nhom('1. Chỉ admin chạy được', () => {
  themNhap([['hv1@example.com', 'HV Một', 'K22-901', 'HV', 'ME02-08']]);
  chay('ai@example.com');
  assert.strictEqual(bang.tabs.THANH_VIEN.v.length, 1, 'không được ghi gì');
  assert.strictEqual(N.v[1][0], 'hv1@example.com', 'NHAP giữ nguyên');
  assert(bang.tabs.NHAT_KY.v.some(r => /Chỉ admin@example.com/.test(r[4])));
});

nhom('2. Người mới + nhóm nhỏ tự vào lớp; NHAP được dọn trống, lịch sử sang LS_NHAP', () => {
  chay();
  assert(coKq(/^✔ người mới, thêm vào ME02-08 \(tự vào lớp ME02\)$/), lsMoi().join(' | '));
  assert(!N.v.slice(1).some(r => r.slice(0, 9).join('') !== '' || r[10] !== ''), 'NHAP phải trống');
  assert.strictEqual(bang.tabs.LS_NHAP.v[0][0], 'Thời gian xử lý');
  assert.strictEqual(bang.tabs.LS_NHAP.v[1][1], 'hv1@example.com');
  const m = tvMap();
  assert.strictEqual(m['hv1@example.com|ME02']['Nguồn'], 'tự thêm từ nhóm nhỏ ME02-08');
  assert.strictEqual(nguoiMap()['hv1@example.com']['Mã người'], 'K22-901');
});

nhom('3. Chạy khi NHAP trống: không đổi gì; trùng hoàn toàn thì bỏ qua', () => {
  const truoc = JSON.stringify(bang.tabs.THANH_VIEN.v);
  chay();
  assert.strictEqual(JSON.stringify(bang.tabs.THANH_VIEN.v), truoc);
  themNhap([['HV1@example.com', '', '', '', 'me02-08']]);
  chay();
  assert(coKq(/đã có trong ME02-08, bỏ qua/), lsMoi().join(' | '));
});

nhom('4. Cùng nhóm khác quyền: cập nhật dòng cũ, ghi lịch sử', () => {
  themNhap([['ef1@example.com', 'EF Một', '', 'EF', 'KIND', '', 'Xem'], ['ef1@example.com', '', '', '', 'KIND', '', 'Sửa']]);
  chay();
  assert(coKq(/thêm vào KIND/) && coKq(/cập nhật KIND: Xem→Sửa/), lsMoi().join(' | '));
  const t = tvMap()['ef1@example.com|KIND'];
  assert.strictEqual(t['Quyền'], 'Sửa');
  assert(/Xem→Sửa/.test(t['Lịch sử']));
  assert.strictEqual(bang.tabs.THANH_VIEN.v.filter(r => r[0] === 'ef1@example.com' && r[2] === 'KIND').length, 1);
});

nhom('5. EF lên Level: tự rời Level cũ', () => {
  themNhap([['ef1@example.com', '', '', '', 'L3'], ['ef1@example.com', '', '', '', 'L2']]);
  chay();
  const m = tvMap();
  assert.strictEqual(m['ef1@example.com|L3']['Trạng thái'], 'Gỡ');
  assert.strictEqual(m['ef1@example.com|L2']['Trạng thái'], 'Đang');
  assert.strictEqual(nguoiMap()['ef1@example.com']['Level'], 'L2');
  assert(coKq(/rời Level L3/));
});

nhom('6. Chuyển nhóm nhỏ cùng lớp; phụ trách nhiều nhóm không bị gỡ', () => {
  themNhap([['hv1@example.com', '', '', '', 'ME02-07'],
    ['gv1@example.com', 'GV Một', '', 'GV', 'ME02-07', 'Phụ trách'], ['gv1@example.com', '', '', '', 'ME02-08', 'Phụ trách']]);
  chay();
  const m = tvMap();
  assert.strictEqual(m['hv1@example.com|ME02-08']['Trạng thái'], 'Gỡ');
  assert.strictEqual(m['hv1@example.com|ME02-07']['Trạng thái'], 'Đang');
  assert.strictEqual(m['gv1@example.com|ME02-07']['Trạng thái'], 'Đang');
  assert.strictEqual(m['gv1@example.com|ME02-08']['Trạng thái'], 'Đang');
  assert(!m['gv1@example.com|ME02']);
});

nhom('7. Gỡ khỏi lớp thì gỡ luôn nhóm nhỏ', () => {
  themNhap([['hv1@example.com', '', '', '', 'ME02', '', '', 'Gỡ']]);
  chay();
  const m = tvMap();
  assert.strictEqual(m['hv1@example.com|ME02']['Trạng thái'], 'Gỡ');
  assert.strictEqual(m['hv1@example.com|ME02-07']['Trạng thái'], 'Gỡ');
  assert(coKq(/gỡ luôn 1 nhóm nhỏ/));
});

nhom('8. Nghỉ rồi quay lại', () => {
  themNhap([['ef1@example.com', '', '', '', '', '', '', 'Nghỉ']]);
  chay();
  assert.strictEqual(nguoiMap()['ef1@example.com']['Trạng thái'], 'Nghỉ');
  assert(Object.values(tvMap()).filter(t => t['Email'] === 'ef1@example.com').every(t => t['Trạng thái'] === 'Gỡ'));
  themNhap([['ef1@example.com', '', '', '', 'RAW', '', 'Sửa']]);
  chay();
  assert.strictEqual(nguoiMap()['ef1@example.com']['Trạng thái'], 'Đang');
  assert(coKq(/quay lại/));
});

nhom('9. Báo lỗi: dòng lỗi ở lại NHAP (dồn lên đầu), dòng ✔ sang LS_NHAP; không tạo người khi lỗi', () => {
  themNhap([['sai-email', 'X', '', 'HV', 'ME02'], ['moi@example.com', '', '', '', 'ME02'], ['ok@example.com', 'Ổn', '', 'HV', 'ME02'],
    ['moi2@example.com', 'Mới Hai', '', 'HV', 'XX'], ['moi3@example.com', 'Mới Ba', '', 'HV', 'L3'], ['moi4@example.com', 'Mới Bốn', '', 'EF', 'CU'],
    ['moi5@example.com', 'Mới Năm', '', 'EF', 'BTC', 'Phụ trách'], ['hv1@example.com', '', '', '', 'KIND', '', '', 'Gỡ']]);
  chay();
  const k = conLai();
  assert.strictEqual(k.length, 6, k.join(' | '));
  assert(/LỖI: email không hợp lệ/.test(k[0]));
  assert(/LỖI: người mới cần Họ tên và Vai trò/.test(k[1]));
  assert(/LỖI: chưa có nhóm XX/.test(k[2]));
  assert(/LỖI: Level chỉ dành cho EF/.test(k[3]));
  assert(/LỖI: nhóm CU đang "Ngừng"/.test(k[4]));
  assert(/LỖI: nhóm loại Tổ chức không có vai Phụ trách/.test(k[5]));
  assert(coKq(/người mới, thêm vào ME02/) && coKq(/không có trong KIND, bỏ qua/));
  assert(!N.v.slice(7).some(r => r[0]), 'phần dưới NHAP phải trống');
  const n = nguoiMap();
  ['moi@example.com', 'moi2@example.com', 'moi3@example.com', 'moi4@example.com', 'moi5@example.com'].forEach(e => assert(!n[e], 'không được tạo ' + e));
});

nhom('10. Sửa dòng lỗi rồi chạy lại: tự xử lý, chuyển sang LS_NHAP', () => {
  N.v[2][1] = 'Mới Một'; N.v[2][3] = 'HV';      // dòng moi@example.com
  chay();
  assert(coKq(/^✔ người mới, thêm vào ME02$/), lsMoi().join(' | '));
  assert.strictEqual(conLai().length, 5);
});

nhom('11. Dòng chỉ còn chữ ở cột khác, không Email: bỏ qua và xóa', () => {
  let i = 1; while (N.v[i] && N.v[i][0]) i++;
  N.v[i] = ['', '', '', '', '', '', '', '', 'ghi chú lạc', '', ''];
  chay();
  assert(!N.v.slice(1).some(r => r[8] === 'ghi chú lạc'));
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
