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

const NHAP_COT = ['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Tình trạng', 'Kết quả', 'Mã xử lý'];
const bang = taoBang({
  CAI_DAT: [['Nhãn', 'Giá trị'], ['Email admin', ADMIN]],
  NHOM: [['Mã nhóm', 'Tên nhóm', 'Loại', 'Thuộc', 'Nhánh', 'Thương hiệu', 'Trạng thái', 'Email nhóm', 'ID thư mục', 'Kết quả'],
    ['L3', 'EF cấp L3', 'Cấp', '', '', 'EWIT', 'Đang'], ['L2', 'EF cấp L2', 'Cấp', '', '', 'EWIT', 'Đang'],
    ['ME02', 'IELTS Mentor 02', 'Lớp', '', 'ME', 'EWIT', 'Đang'],
    ['ME02-07', 'Nhóm 07', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'], ['ME02-08', 'Nhóm 08', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'],
    ['KIND', 'Kind English', 'Dự án', '', '', 'EWIT', 'Đang'], ['CU', 'Dự án cũ', 'Dự án', '', '', 'EWIT', 'Ngừng'],
    ['RAW', 'Tri thức Raw', 'Tri thức', '', '', 'MLWIT', 'Đang'], ['BTC', 'Ban tổ chức', 'Tổ chức', '', '', 'EWIT', 'Đang']],
  NHAP: [NHAP_COT],
  NGUOI: [['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Cấp', 'Trạng thái', 'Ngày vào', 'Cập nhật', 'ID ổ', 'Kết quả Drive']],
  THANH_VIEN: [['Email', 'Họ tên', 'Mã nhóm', 'Loại nhóm', 'Vai trong nhóm', 'Quyền', 'Trạng thái', 'Ngày thêm', 'Cập nhật', 'Nguồn', 'Lịch sử', 'Kết quả Drive']],
  NHAT_KY: [['Thời gian', 'Lệnh', 'Phần', 'Việc', 'Đối tượng']]
});
const themNhap = rows => rows.forEach(r => bang.tabs.NHAP.v.push([r[0], r[1] || '', r[2] || '', r[3] || '', r[4] || '', r[5] || '', r[6] || '', r[7] || '', '', '', '', '']));
const chay = ai => moiTruong(bang, ai).sdDuaVaoTong();
const kqNhap = () => bang.tabs.NHAP.v.slice(1).map(r => r[10]);
const tvMap = () => { const v = bang.tabs.THANH_VIEN.v; const h = v[0]; const m = {}; v.slice(1).forEach(r => { const o = {}; h.forEach((c, i) => o[c] = r[i]); m[o['Email'] + '|' + o['Mã nhóm']] = o; }); return m; };
const nguoiMap = () => { const v = bang.tabs.NGUOI.v; const h = v[0]; const m = {}; v.slice(1).forEach(r => { const o = {}; h.forEach((c, i) => o[c] = r[i]); m[o['Email']] = o; }); return m; };

let dat = 0, truot = 0;
function nhom(ten, fn) { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } }

nhom('1. Chỉ admin chạy được', () => {
  themNhap([['hv1@example.com', 'HV Một', 'K22-901', 'HV', 'ME02-08']]);
  chay('ai@example.com');
  assert.strictEqual(bang.tabs.THANH_VIEN.v.length, 1, 'không được ghi gì');
  assert(bang.tabs.NHAT_KY.v.some(r => /Chỉ admin@example.com/.test(r[4])));
});

nhom('2. Người mới + nhóm nhỏ tự vào lớp', () => {
  chay();
  assert(/^✔ người mới, thêm vào ME02-08 \(tự vào lớp ME02\)$/.test(kqNhap()[0]), kqNhap()[0]);
  const m = tvMap();
  assert.strictEqual(m['hv1@example.com|ME02-08']['Trạng thái'], 'Đang');
  assert.strictEqual(m['hv1@example.com|ME02']['Nguồn'], 'tự thêm từ nhóm nhỏ ME02-08');
  assert.strictEqual(nguoiMap()['hv1@example.com']['Mã người'], 'K22-901');
});

nhom('3. Dòng đã ✔ không xử lý lại; trùng hoàn toàn thì bỏ qua', () => {
  const truoc = JSON.stringify(bang.tabs.THANH_VIEN.v);
  chay();
  assert.strictEqual(JSON.stringify(bang.tabs.THANH_VIEN.v), truoc, 'chạy lại không được đổi gì');
  themNhap([['HV1@example.com', '', '', '', 'me02-08']]);
  chay();
  assert(/đã có trong ME02-08, bỏ qua/.test(kqNhap()[1]), kqNhap()[1]);
});

nhom('4. Cùng nhóm khác quyền: cập nhật dòng cũ, ghi lịch sử', () => {
  themNhap([['ef1@example.com', 'EF Một', '', 'EF', 'KIND', '', 'Xem'], ['ef1@example.com', '', '', '', 'KIND', '', 'Sửa']]);
  chay();
  const k = kqNhap();
  assert(/thêm vào KIND/.test(k[2]) && /cập nhật KIND: Xem→Sửa/.test(k[3]), k.join(' | '));
  const t = tvMap()['ef1@example.com|KIND'];
  assert.strictEqual(t['Quyền'], 'Sửa');
  assert(/Xem→Sửa/.test(t['Lịch sử']));
  assert.strictEqual(bang.tabs.THANH_VIEN.v.filter(r => r[0] === 'ef1@example.com' && r[2] === 'KIND').length, 1, 'chỉ một dòng');
});

nhom('5. EF lên cấp: tự rời cấp cũ', () => {
  themNhap([['ef1@example.com', '', '', '', 'L3'], ['ef1@example.com', '', '', '', 'L2']]);
  chay();
  const m = tvMap();
  assert.strictEqual(m['ef1@example.com|L3']['Trạng thái'], 'Gỡ');
  assert.strictEqual(m['ef1@example.com|L2']['Trạng thái'], 'Đang');
  assert.strictEqual(nguoiMap()['ef1@example.com']['Cấp'], 'L2');
  assert(/rời cấp L3/.test(kqNhap()[5]));
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
  assert(!m['gv1@example.com|ME02'], 'phụ trách nhóm nhỏ không tự vào lớp');
});

nhom('7. Gỡ khỏi lớp thì gỡ luôn nhóm nhỏ', () => {
  themNhap([['hv1@example.com', '', '', '', 'ME02', '', '', 'Gỡ']]);
  chay();
  const m = tvMap();
  assert.strictEqual(m['hv1@example.com|ME02']['Trạng thái'], 'Gỡ');
  assert.strictEqual(m['hv1@example.com|ME02-07']['Trạng thái'], 'Gỡ');
  assert(/gỡ luôn 1 nhóm nhỏ/.test(kqNhap().slice(-1)[0]));
});

nhom('8. Nghỉ rồi quay lại', () => {
  themNhap([['ef1@example.com', '', '', '', '', '', '', 'Nghỉ']]);
  chay();
  assert.strictEqual(nguoiMap()['ef1@example.com']['Trạng thái'], 'Nghỉ');
  assert(Object.values(tvMap()).filter(t => t['Email'] === 'ef1@example.com').every(t => t['Trạng thái'] === 'Gỡ'));
  themNhap([['ef1@example.com', '', '', '', 'RAW', '', 'Sửa']]);
  chay();
  assert.strictEqual(nguoiMap()['ef1@example.com']['Trạng thái'], 'Đang');
  assert(/quay lại/.test(kqNhap().slice(-1)[0]));
});

nhom('9. Báo lỗi theo dòng, không tạo người khi lỗi', () => {
  themNhap([['sai-email', 'X', '', 'HV', 'ME02'], ['moi@example.com', '', '', '', 'ME02'], ['moi2@example.com', 'Mới Hai', '', 'HV', 'XX'],
    ['moi3@example.com', 'Mới Ba', '', 'HV', 'L3'], ['moi4@example.com', 'Mới Bốn', '', 'EF', 'CU'], ['moi5@example.com', 'Mới Năm', '', 'EF', 'BTC', 'Phụ trách'],
    ['hv1@example.com', '', '', '', 'KIND', '', '', 'Gỡ']]);
  chay();
  const k = kqNhap().slice(-7);
  assert(/LỖI: email không hợp lệ/.test(k[0]));
  assert(/LỖI: người mới cần Họ tên và Vai trò/.test(k[1]));
  assert(/LỖI: chưa có nhóm XX/.test(k[2]));
  assert(/LỖI: chỉ EF mới vào nhóm Cấp/.test(k[3]));
  assert(/LỖI: nhóm CU đang "Ngừng"/.test(k[4]));
  assert(/LỖI: nhóm loại Tổ chức không có vai Phụ trách/.test(k[5]));
  assert(/không có trong KIND, bỏ qua/.test(k[6]));
  const n = nguoiMap();
  ['moi@example.com', 'moi2@example.com', 'moi3@example.com', 'moi4@example.com', 'moi5@example.com'].forEach(e => assert(!n[e], 'không được tạo ' + e));
});

nhom('10. Sửa dòng lỗi rồi xóa ô Kết quả thì chạy lại được', () => {
  const v = bang.tabs.NHAP.v; const i = v.length - 6; // dòng moi@example.com
  v[i][1] = 'Mới Một'; v[i][3] = 'HV'; v[i][10] = '';
  chay();
  assert(/^✔ người mới, thêm vào ME02$/.test(v[i][10]), v[i][10]);
});

nhom('11. Ghi đè dòng cũ (còn ✔) bằng nội dung mới: tự xử lý lại', () => {
  const v = bang.tabs.NHAP.v;
  const i = 2; // dòng hv1 · ME02-08 cũ (dòng 3 trên bảng là ef1? lấy dòng 2)
  v[1] = ['ef1@example.com', '', '', '', 'KIND', '', 'Xem', 'Thêm', '', '', v[1][10], v[1][11]];
  const truocLS = tvMap()['ef1@example.com|KIND']['Lịch sử'];
  chay();
  assert(/cập nhật KIND/.test(v[1][10]), v[1][10]);
  assert.strictEqual(tvMap()['ef1@example.com|KIND']['Quyền'], 'Xem');
  const sau = JSON.stringify(bang.tabs.THANH_VIEN.v);
  chay();
  assert.strictEqual(JSON.stringify(bang.tabs.THANH_VIEN.v), sau, 'nội dung không đổi thì không xử lý lại');
});

nhom('12. Dòng chỉ còn Kết quả cũ, không có Email: bỏ qua, không báo lỗi', () => {
  bang.tabs.NHAP.v.push(['', '', '', '', '', '', '', '', '', '', '✔ kết quả cũ', '']);
  chay();
  assert.strictEqual(bang.tabs.NHAP.v.slice(-1)[0][10], '✔ kết quả cũ', 'dòng không email phải được bỏ qua');
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
