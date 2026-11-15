/** Kiểm thử 15_DuLieu.gs (mô hình dữ liệu chung). */
const assert = require('assert');
const { taoMoiTruong, bangMau } = require('./gia-lap');
const bang = bangMau();
const T = bang.tabs;
T.NHOM.v.push(['L3', 'EF Level 3', 'Level', '', '', 'EWIT', 'Đang'], ['L2', 'EF Level 2', 'Level', '', '', 'EWIT', 'Đang'], ['PIONEER', 'Pioneer', 'Level', '', '', 'EWIT', 'Đang'],
  ['ME02-08', 'Nhóm 08', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'], ['DAO-TẠO', 'Đào tạo', 'Ban', '', '', 'EWIT', 'Đang']);
T.NGUOI.v.push(['ef1@example.com', 'EF Một', '', 'EF', 'L2', 'Đang'], ['hv1@example.com', 'HV Một', 'K22-901', 'HV', '', 'Đang'],
  ['ef9@example.com', 'EF Chín', '', 'EF', 'PIONEER', 'Đang'], ['gv1@example.com', 'GV Một', '', 'GV', '', 'Nghỉ']);
T.THANH_VIEN.v.push(['ef1@example.com', 'EF Một', 'L2', 'Level', 'Thành viên', 'Xem', 'Đang'], ['hv1@example.com', 'HV Một', 'ME02-08', 'Nhóm nhỏ', 'Thành viên', 'Xem', 'Đang'],
  ['gv1@example.com', 'GV Một', 'ME02-08', 'Nhóm nhỏ', 'Phụ trách', 'Xem', 'Gỡ']);
T.CAU_TRUC.v.push(['CN_TEN', 'Ổ cá nhân', 'MLWIT · {Mã người} · {Họ tên}', 'Ổ'], ['CN_CAP', 'Ổ EF', '10_LEVEL', 'Chỗ đặt lối tắt'], ['CN_X', 'Ổ EF, Ổ GV', 'X', 'Thư mục'], ['CN_ALL', 'Mọi ổ cá nhân', '90', 'Thư mục']);
const ctx = taoMoiTruong(bang);
ctx.P = { ss: bang, nk: [], loi: 0 };
const C = ctx.taiDuLieu_();
let dat = 0, truot = 0;
const nhom = (ten, fn) => { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } };

nhom('slug và email nhóm', () => {
  assert.strictEqual(ctx.slug_('ME02-08'), 'me02-08');
  assert.strictEqual(ctx.slug_('DAO-TẠO'), 'dao-tao');
  assert.strictEqual(ctx.emailNhom_(C, 'ME02-08', 'pt'), 'sd-me02-08-pt@example.com');
  assert.strictEqual(ctx.emailNhom_(C, 'L2', ''), 'sd-l2@example.com');
  assert.strictEqual(ctx.emailTong_(C, 'hv'), 'sd-all-hv@example.com');
  assert.strictEqual(ctx.hauToCua_({ vai: 'Thành viên', quyen: 'Sửa' }), 'sua');
});
nhom('Level: thấy cấp mình và thấp hơn; thư mục Level được cấp cao xem', () => {
  assert.deepStrictEqual(Array.from(ctx.dsLevel_(C)), ['L3', 'L2', 'PIONEER']);
  assert.deepStrictEqual(Array.from(ctx.levelThayDuoc_(C, C.nguoi['ef1@example.com'])), ['L3', 'L2']);
  assert.deepStrictEqual(Array.from(ctx.levelDuocXem_(C, 'L3')), ['L3', 'L2', 'PIONEER']);
});
nhom('Chia sẻ, khuôn ổ, có ổ', () => {
  assert.strictEqual(ctx.duocChiaSe_(C, C.nguoi['ef1@example.com']), false);
  assert.strictEqual(ctx.duocChiaSe_(C, C.nguoi['ef9@example.com']), true);
  assert.strictEqual(ctx.duocChiaSe_(C, C.nguoi['gv1@example.com']), true);
  assert.strictEqual(ctx.khuonO_(C, C.nguoi['hv1@example.com']), 'Ổ HV');
  assert.strictEqual(ctx.khiNghi_(C, C.nguoi['hv1@example.com']), 'Thu ổ');
  assert.strictEqual(ctx.coOCaNhan_(C, C.nguoi['hv1@example.com']), true);
  assert.strictEqual(ctx.coOCaNhan_(C, C.nguoi['ef9@example.com']), false, 'chưa có nhóm thì chưa tạo ổ');
  assert.strictEqual(ctx.coOCaNhan_(C, C.nguoi['gv1@example.com']), false);
});
nhom('Tên ổ và dòng cấu trúc áp cho ổ', () => {
  assert.strictEqual(ctx.tenOCaNhan_(C, C.nguoi['hv1@example.com']), 'MLWIT · K22-901 · HV Một');
  assert.strictEqual(ctx.tenOCaNhan_(C, C.nguoi['ef1@example.com']), 'MLWIT · EF Một');
  const hv = C.nguoi['hv1@example.com'], gv = C.nguoi['gv1@example.com'];
  assert.strictEqual(ctx.apChoO_(C, ctx.dongCauTruc_(C, 'CN_CAP'), hv), false);
  assert.strictEqual(ctx.apChoO_(C, ctx.dongCauTruc_(C, 'CN_X'), gv), true);
  assert.strictEqual(ctx.apChoO_(C, ctx.dongCauTruc_(C, 'CN_ALL'), hv), true);
  assert.strictEqual(ctx.dienMau_('{Nhánh}/{Mã nhóm} · {Tên nhóm}', null, C.nhom['ME02-08']), 'KHAC/ME02-08 · Nhóm 08');
});
console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
