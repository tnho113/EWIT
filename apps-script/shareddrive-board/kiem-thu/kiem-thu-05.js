/**
 * Kiểm thử Đợt 2b · Phiên Y: Mã hệ thống, Sửa thông tin, Đổi email, Thêm không đổi thông tin người cũ,
 * sdNangCapBang, công thức Tình trạng (cấu trúc). Chạy: node kiem-thu/kiem-thu-05.js (đứng ở apps-script/shareddrive-board).
 */
const assert = require('assert');
const { taoBang, taoMoiTruong, bangMau } = require('./gia-lap');

let dat = 0, truot = 0;
function nhom(ten, fn) { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } }

/* ---------- Dữ liệu mẫu ---------- */
const bang = bangMau();
bang.tabs.NHOM.v.push(
  ['L3', 'EF Level 3', 'Level', '', '', 'EWIT', 'Đang'], ['L2', 'EF Level 2', 'Level', '', '', 'EWIT', 'Đang'],
  ['ME02', 'IELTS Mentor 02', 'Lớp', '', 'ME', 'EWIT', 'Đang'], ['ME02-07', 'Nhóm 07', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'],
  ['KIND', 'Kind English', 'Dự án', '', '', 'EWIT', 'Đang']);
bang.tabs.LS_NHAP.v[0].push('Email mới');   // như sau sdNangCapBang
const N = bang.tabs.NHAP;
const themNhap = rows => {   // rows: [email, ten, ma, vai, nhom, vaiNhom, quyen, viec, ghiChu, emailMoi]
  let i = 1; while (i < N.v.length && N.v[i][0]) i++;
  rows.forEach(r => { N.v[i] = [r[0], r[1] || '', r[2] || '', r[3] || '', r[4] || '', r[5] || '', r[6] || '', r[7] || '', r[8] || '', '', '', r[9] || '']; i++; });
};
let lsTruoc = 0;
const chay = () => { lsTruoc = bang.tabs.LS_NHAP.v.length; taoMoiTruong(bang).sdDuaVaoTong(); };
const lsMoi = () => bang.tabs.LS_NHAP.v.slice(Math.max(1, lsTruoc)).map(r => r[10]);
const conLai = () => N.v.slice(1).filter(r => r[0]).map(r => r[10]);
const tab2Map = (ten, khoa) => { const v = bang.tabs[ten].v, h = v[0], m = {}; v.slice(1).forEach(r => { const o = {}; h.forEach((c, i) => o[c] = r[i]); m[khoa(o)] = o; }); return m; };
const nguoiMap = () => tab2Map('NGUOI', o => o['Email']);
const tvMap = () => tab2Map('THANH_VIEN', o => o['Email'] + '|' + o['Mã nhóm']);

nhom('1. Mã hệ thống: người mới U00001.., tiếp số lớn nhất, không tái dùng', () => {
  themNhap([['a@example.com', 'A', '', 'HV', 'ME02-07'], ['b@example.com', 'B', 'K22-002', 'EF', 'L3']]);
  chay();
  let n = nguoiMap();
  assert.strictEqual(n['a@example.com']['Mã hệ thống'], 'U00001');
  assert.strictEqual(n['b@example.com']['Mã hệ thống'], 'U00002');
  // có số lớn hơn (người đã bị xóa khỏi giữa chừng không ảnh hưởng): đặt U00009 rồi thêm người mới
  bang.tabs.NGUOI.v[1][10] = 'U00009';
  themNhap([['c@example.com', 'C', '', 'HV', 'ME02-07']]);
  chay();
  assert.strictEqual(nguoiMap()['c@example.com']['Mã hệ thống'], 'U00010');
  // người cũ không đổi mã khi Thêm tiếp
  themNhap([['a@example.com', '', '', '', 'KIND']]);
  chay();
  assert.strictEqual(nguoiMap()['a@example.com']['Mã hệ thống'], 'U00009');
  bang.tabs.NGUOI.v[1][10] = 'U00001';
});

nhom('2. Thêm người cũ mà thông tin KHÁC: không đổi thông tin, vẫn thêm nhóm, ghi chú', () => {
  themNhap([['a@example.com', 'Tên khác', 'MA-KHAC', 'EF', 'KIND', '', 'Sửa']]);
  chay();
  const k = lsMoi().join(' | ');
  assert(/bỏ qua thông tin khác — dùng Việc 'Sửa thông tin'/.test(k), k);
  const a = nguoiMap()['a@example.com'];
  assert.strictEqual(a['Họ tên'], 'A'); assert.strictEqual(a['Vai trò'], 'HV'); assert.strictEqual(a['Mã người'], '');
  assert.strictEqual(tvMap()['a@example.com|KIND']['Quyền'], 'Sửa');
  // không đổi gì khác → không có ghi chú
  themNhap([['a@example.com', 'A', '', 'HV', 'KIND', '', 'Sửa']]);
  chay();
  assert(!/bỏ qua thông tin khác/.test(lsMoi().join('|')));
  // Level cho người cũ vai HV (dù ô Vai trò ghi EF) → vẫn LỖI vì dùng vai đã có
  themNhap([['a@example.com', '', '', 'EF', 'L3']]);
  chay();
  assert(conLai().some(x => /LỖI: Level chỉ dành cho EF \(người này là HV\)/.test(x)), conLai().join('|'));
  N.v = [N.v[0]];
});

nhom('3. Sửa thông tin: đổi Họ tên (cả THANH_VIEN), Mã người, Vai trò; ô trống giữ nguyên', () => {
  themNhap([['a@example.com', 'A Mới', 'K22-111', '', '', '', '', 'Sửa thông tin'], ['a@example.com', '', '', 'GV', '', '', '', 'Sửa thông tin']]);
  chay();
  const a = nguoiMap()['a@example.com'];
  assert.strictEqual(a['Họ tên'], 'A Mới'); assert.strictEqual(a['Mã người'], 'K22-111'); assert.strictEqual(a['Vai trò'], 'GV');
  assert.strictEqual(a['Mã hệ thống'], 'U00001');
  const tv = Object.values(tvMap()).filter(t => t['Email'] === 'a@example.com');
  assert(tv.length >= 2 && tv.every(t => t['Họ tên'] === 'A Mới'));
  assert(lsMoi().some(x => /Họ tên A→A Mới/.test(x)) && lsMoi().some(x => /Vai trò HV→GV/.test(x)), lsMoi().join('|'));
  assert(bang.tabs.NHAT_KY.v.some(r => /Sửa thông tin/.test(r[3])));
});

nhom('4. Sửa thông tin: lỗi (người lạ, không ghi ô nào, Vai trò sai, EF đang Level)', () => {
  themNhap([['la@example.com', 'X', '', '', '', '', '', 'Sửa thông tin'], ['a@example.com', '', '', '', '', '', '', 'Sửa thông tin'],
    ['a@example.com', '', '', 'XX', '', '', '', 'Sửa thông tin'], ['b@example.com', '', '', 'HV', '', '', '', 'Sửa thông tin'],
    ['b@example.com', 'B2', '', 'EF', '', '', '', 'Sửa thông tin']]);
  chay();
  const k = conLai();
  assert(/chưa có người này/.test(k[0]), k.join('|'));
  assert(/chưa ghi ô nào để đổi/.test(k[1]));
  assert(/Vai trò phải là/.test(k[2]));
  assert(/đang ở Level L3.*Gỡ khỏi Level trước/.test(k[3]));
  assert.strictEqual(k.length, 4);
  assert.strictEqual(nguoiMap()['b@example.com']['Vai trò'], 'EF');
  assert.strictEqual(nguoiMap()['b@example.com']['Họ tên'], 'B2');   // dòng 5 hợp lệ: đổi tên
  N.v = [N.v[0]];
});

nhom('5. Đổi email: đổi ở NGUOI + mọi dòng THANH_VIEN, giữ Mã hệ thống/ID ổ, ghi Lịch sử', () => {
  bang.tabs.NGUOI.v.find(r => r[0] === 'b@example.com')[8] = 'DRIVE-ID-B';
  themNhap([['B@example.com', '', '', '', '', '', '', 'Đổi email', '', 'b.moi@example.com']]);
  chay();
  assert(lsMoi().some(x => /^✔ đổi email từ b@example.com \(\d+ dòng nhóm, giữ Mã hệ thống U00002\)/.test(x)), lsMoi().join('|'));
  const n = nguoiMap();
  assert(!n['b@example.com']); assert.strictEqual(n['b.moi@example.com']['Mã hệ thống'], 'U00002');
  assert.strictEqual(n['b.moi@example.com']['ID ổ'], 'DRIVE-ID-B');
  const tv = tvMap();
  assert(!Object.keys(tv).some(k => k.indexOf('b@example.com|') === 0));
  const t = tv['b.moi@example.com|L3'];
  assert(t && /đổi email từ b@example.com/.test(t['Lịch sử']));
  // LS_NHAP ghi được cột Email mới
  const h = bang.tabs.LS_NHAP.v[0], r = bang.tabs.LS_NHAP.v[bang.tabs.LS_NHAP.v.length - 1];
  assert.strictEqual(r[h.indexOf('Email mới')], 'b.moi@example.com');
  // sau đó Thêm theo email mới nhận ra người cũ (không tạo người mới)
  themNhap([['b.moi@example.com', '', '', '', 'KIND']]);
  chay();
  assert(!/người mới/.test(lsMoi().join('|')));
  assert.strictEqual(Object.keys(nguoiMap()).filter(e => /^b/.test(e)).length, 1);
});

nhom('6. Đổi email: lỗi (thiếu, sai định dạng, trùng cũ, đã có, người lạ)', () => {
  themNhap([['a@example.com', '', '', '', '', '', '', 'Đổi email', '', ''], ['a@example.com', '', '', '', '', '', '', 'Đổi email', '', 'khong-hop-le'],
    ['a@example.com', '', '', '', '', '', '', 'Đổi email', '', 'a@example.com'], ['a@example.com', '', '', '', '', '', '', 'Đổi email', '', 'C@example.com'],
    ['la@example.com', '', '', '', '', '', '', 'Đổi email', '', 'moi@example.com']]);
  chay();
  const k = conLai();
  assert(/thiếu Email mới/.test(k[0]), k.join('|')); assert(/Email mới không hợp lệ/.test(k[1]));
  assert(/trùng email cũ/.test(k[2])); assert(/đã có ở danh sách tổng/.test(k[3])); assert(/chưa có ở danh sách tổng/.test(k[4]));
  assert(nguoiMap()['a@example.com']);
  N.v = [N.v[0]];
});

nhom('7. Việc không hợp lệ báo đủ danh sách; chạy lại bộ cũ vẫn đúng (Nghỉ, Gỡ)', () => {
  themNhap([['a@example.com', '', '', '', 'ME02', '', '', 'Xoá']]);
  chay();
  assert(/Sửa thông tin, Đổi email/.test(conLai()[0]), conLai().join('|'));
  N.v = [N.v[0]];
  themNhap([['c@example.com', '', '', '', '', '', '', 'Nghỉ']]);
  chay();
  assert.strictEqual(nguoiMap()['c@example.com']['Trạng thái'], 'Nghỉ');
});

/* ---------- Nâng cấp bảng ---------- */
function bangCu() {
  return taoBang({
    CAI_DAT: [['Nhãn', 'Giá trị'], ['Email admin', 'admin@example.com']],
    NHOM: [['Mã nhóm', 'Tên nhóm', 'Loại', 'Thuộc', 'Trạng thái'], ['L3', 'L3', 'Level', '', 'Đang'], ['ME02', 'ME02', 'Lớp', '', 'Đang'],
      ['L2', 'L2', 'Level', '', 'Đang'], ['PIONEER', 'P', 'Level', '', 'Đang']],
    NHAP: [['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Tình trạng', 'Lỗi']],
    NGUOI: [['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Level', 'Trạng thái', 'Ngày vào', 'Cập nhật', 'ID ổ', 'Kết quả Drive'],
      ['a@example.com', 'A', '', 'HV', '', 'Đang'], ['b@example.com', 'B', '', 'EF', 'L3', 'Đang'], ['c@example.com', 'C', '', 'GV', '', 'Nghỉ']],
    THANH_VIEN: [['Email', 'Họ tên', 'Mã nhóm', 'Loại nhóm', 'Vai trong nhóm', 'Quyền', 'Trạng thái']],
    LS_NHAP: [['Thời gian xử lý', 'Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Kết quả']],
    CAU_TRUC: [['Mã', 'Ổ', 'Đường dẫn', 'Loại', 'Nguồn / Đích / Áp cho', 'Quyền chủ ổ / người dùng', 'Ghi chú', 'ID'],
      ['HS_NG', 'Hồ sơ học tập', '{người}', 'Thư mục theo người', '', 'Xem', 'gốc'],
      ['CN_CA_NHAN', 'Mọi ổ cá nhân', '90_CA-NHAN', 'Thư mục theo người', '', 'Sửa', 'ghi chú cũ']],
    NHAT_KY: [['Thời gian', 'Lệnh', 'Phần', 'Việc', 'Đối tượng']]
  });
}

nhom('8. sdNangCapBang: thêm cột, Thứ tự, HS_TL, bỏ CN_CA_NHAN, cấp Mã hệ thống, gắn ô chọn; ghi nhật ký', () => {
  const b = bangCu(), goi = [];
  const nhapGoc = b.tabs.NHAP.getRange;
  b.tabs.NHAP.getRange = (...a) => Object.assign(nhapGoc(...a), { setDataValidation: v => goi.push({ a, v }) });
  const ctx = taoMoiTruong(b);
  ctx.SpreadsheetApp.newDataValidation = () => { const x = { dsach: null };
    x.requireValueInList = l => { x.dsach = l; return x; }; x.setAllowInvalid = () => x; x.setHelpText = () => x; x.build = () => x; return x; };
  ctx.sdNangCapBang();
  assert(b.tabs.NGUOI.v[0].includes('Mã hệ thống'));
  assert(b.tabs.NHAP.v[0].includes('Email mới'));
  assert(b.tabs.NHOM.v[0].includes('Thứ tự'));
  assert(b.tabs.LS_NHAP.v[0].includes('Email mới'));
  const h = b.tabs.NHOM.v[0], tt = h.indexOf('Thứ tự');
  const th = ma => b.tabs.NHOM.v.find(r => r[0] === ma)[tt];
  assert.strictEqual(th('L3'), 1); assert.strictEqual(th('L2'), 2); assert.strictEqual(th('PIONEER'), 3);
  assert.strictEqual(b.tabs.NHOM.v.find(r => r[0] === 'ME02')[tt] || '', '');
  const hm = b.tabs.NGUOI.v[0].indexOf('Mã hệ thống');
  assert.deepStrictEqual(b.tabs.NGUOI.v.slice(1).map(r => r[hm]), ['U00001', 'U00002', 'U00003']);
  const ct = b.tabs.CAU_TRUC.v, hs = ct.find(r => r[0] === 'HS_TL'), cn = ct.find(r => r[0] === 'CN_CA_NHAN');
  assert.deepStrictEqual(hs.slice(0, 7), ['HS_TL', 'Hồ sơ học tập', '{người}/00_TAI-LIEU-CUA-TOI', 'Thư mục con theo người', 'Nhóm riêng của người', 'Tải lên', 'HV tải lên tự do; giữ khi nghỉ']);
  assert.strictEqual(cn[3], 'BỎ'); assert(/^BỎ \(Đợt 2b\)/.test(cn[6]));
  assert.strictEqual(goi.length, 1); assert.deepStrictEqual(Array.from(goi[0].v.dsach), ['Thêm', 'Gỡ', 'Nghỉ', 'Sửa thông tin', 'Đổi email']);
  assert(b.tabs.NHAT_KY.v.some(r => r[2] === 'Nâng cấp' && /HS_TL/.test(r[3])));
  // idempotent
  const anh = JSON.stringify(Object.keys(b.tabs).map(k => b.tabs[k].v));
  const nkTruoc = b.tabs.NHAT_KY.v.length;
  taoMoiTruong(b).sdNangCapBang();
  const nk = b.tabs.NHAT_KY.v.slice(nkTruoc);
  assert(nk.every(r => r[2] !== 'Nâng cấp'), 'lần 2 không được thêm gì: ' + JSON.stringify(nk));
  assert.strictEqual(JSON.stringify(Object.keys(b.tabs).map(k => b.tabs[k].v).filter((_, i) => Object.keys(b.tabs)[i] !== 'NHAT_KY')),
    JSON.stringify(JSON.parse(anh).filter((_, i) => Object.keys(b.tabs)[i] !== 'NHAT_KY')));
  assert(nk.some(r => /Bảng đã đủ/.test(r[4])), JSON.stringify(nk));
  // sau nâng cấp: nhập liệu chạy được, người mới nhận U00004
  b.tabs.NHAP.v.push(['n@example.com', 'N', '', 'HV', 'ME02', '', '', '', '', '', '', '']);
  taoMoiTruong(b).sdDuaVaoTong();
  assert.strictEqual(b.tabs.NGUOI.v.find(r => r[0] === 'n@example.com')[hm], 'U00004');
});

nhom('9. sdNangCapBang: Thứ tự đã có số thì giữ, Level mới điền tiếp số lớn nhất; không có mock validation vẫn chạy', () => {
  const b = bangCu();
  b.tabs.NHOM.v[0].push('Thứ tự'); b.tabs.NHOM.v[1][5] = 5; // L3 = 5
  taoMoiTruong(b).sdNangCapBang();
  const tt = b.tabs.NHOM.v[0].indexOf('Thứ tự');
  assert.deepStrictEqual(b.tabs.NHOM.v.filter(r => ['L3', 'L2', 'PIONEER'].includes(r[0])).map(r => r[tt]), [5, 6, 7]);
});

/* ---------- Công thức Tình trạng ---------- */
nhom('10. Công thức Tình trạng: cân ngoặc, biến khai báo trước khi dùng, không AND/OR, đủ nhánh', () => {
  const f = taoMoiTruong(bangMau()).congThucTinhTrang_();
  let d = 0, q = 0, kt = 0;
  for (const ch of f) { if (ch === '"') q ^= 1; if (q) continue; if (ch === '(') d++; if (ch === ')') d--; if (d < 0) break; }
  assert.strictEqual(q, 0, 'ngoặc kép lệch'); assert.strictEqual(d, 0, 'ngoặc đơn lệch');
  const ngoai = f.replace(/"[^"]*"/g, '""');
  assert(!/\b(AND|OR)\(/.test(ngoai), 'không dùng AND/OR trong ARRAYFORMULA');
  assert(!/,/.test(ngoai), 'locale vi_VN: dùng ; không dùng ,');
  assert(f.startsWith('={"Tình trạng";ARRAYFORMULA(LET('));
  // biến dùng sau khi khai báo
  const kb = []; const re = /^  (v[A-Za-z]+);/gm; let m; while ((m = re.exec(f))) kb.push({ ten: m[1], vt: m.index });
  kb.forEach((x, i) => {
    const truoc = f.slice(0, x.vt);
    const dung = new RegExp('\\b' + x.ten + '\\b').test(f.slice(x.vt + x.ten.length + 3));
    assert(dung, 'biến không dùng: ' + x.ten);
    kb.slice(i).forEach(y => { if (y.ten !== x.ten && new RegExp('\\b' + y.ten + '\\b').test(truoc)) { /* dùng trước khai báo */ assert.fail(y.ten + ' dùng trước khi khai báo (' + x.ten + ')'); } });
  });
  ['email sai định dạng', 'dòng trùng trong NHAP', 'Sửa thông tin', 'Email mới', 'khác thông tin đã có — dùng Việc \'Sửa thông tin\'', 'sẽ rời Level', 'sẽ tự vào lớp',
    'thiếu Mã nhóm', 'Level chỉ dành cho EF', 'không có vai Phụ trách', 'người mới cần Họ tên và Vai trò', 'đã có', 'chưa đưa vào', 'đã có ở danh sách tổng', 'thiếu Email mới']
    .forEach(s => assert(f.includes(s), 'thiếu nhánh: ' + s));
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
