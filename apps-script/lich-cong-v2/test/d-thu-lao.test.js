const test = require('node:test');
const assert = require('node:assert');
const { napGs } = require('./nap-gs');

const g = napGs('_chung/Chung.gs', 'd-thu-lao/BaoCaoLogic.gs');

const d = (id, ngay, o = {}) => Object.assign({
  assignment_id: id, session_id: 's' + id, ngay, class_id: 'G1-K22', ten_lop: 'Grade 1 K22', nhom_lop: 'GRADE1',
  ef_id: 'EF01', ten_ef: 'An', role_id: 'TIC', ten_vai_tro: 'Teacher in charge', level_id: 'L1', ten_level: 'L1'
}, o);
const loc = { tu: '2026-11-01', den: '2026-11-30' };
const lap = (dl, bl, qt, gl) => g.lapBaoCaoLogic(dl, Object.assign({}, loc, bl), qt || [], gl || {});

test('gom nhóm theo ef × level × vai trò × lớp, liệt kê ngày', () => {
  const r = lap([d('1', new Date(2026, 10, 5)), d('2', new Date(2026, 10, 3)),
    d('3', new Date(2026, 10, 3), { class_id: 'G2-K1', ten_lop: 'G2' }),
    d('4', new Date(2026, 10, 4), { ef_id: 'EF02', ten_ef: 'Bình' })]);
  assert.strictEqual(r.length, 3);
  const a = r.find((x) => x.ten_ef === 'An' && x.ten_lop === 'Grade 1 K22');
  assert.strictEqual(a.so_buoi, 2);
  assert.strictEqual(a.cac_ngay, '03/11, 05/11');
  assert.strictEqual(a.khoa, 'EF01|L1|TIC|G1-K22');
});

test('khoảng ngày gồm cả hai đầu, loại ngoài khoảng', () => {
  const r = lap([d('1', '2026-10-31'), d('2', '2026-11-01'), d('3', '2026-11-30'), d('4', '2026-12-01')]);
  assert.strictEqual(r[0].so_buoi, 2);
  assert.throws(() => g.lapBaoCaoLogic([], {}, [], {}));
});

test('lọc theo tên hoặc id', () => {
  const dl = [d('1', '2026-11-02'), d('2', '2026-11-03', { ef_id: 'EF02', ten_ef: 'Bình', role_id: 'HOE', ten_vai_tro: 'H.O.E' })];
  assert.strictEqual(lap(dl, { ef: 'bình' }).length, 1);
  assert.strictEqual(lap(dl, { ef: 'EF01' })[0].ten_ef, 'An');
  assert.strictEqual(lap(dl, { vaiTro: 'H.O.E' })[0].ten_ef, 'Bình');
  assert.strictEqual(lap(dl, { lop: 'G1-K22' }).length, 2);
  assert.strictEqual(lap(dl, { lop: 'khong co' }).length, 0);
});

test('ưu tiên quy tắc: class_id > nhom_lop > trống', () => {
  const qt = [
    { rule_id: 'a', muc_moi_buoi: 100 },
    { rule_id: 'b', nhom_lop: 'GRADE1', muc_moi_buoi: 200 },
    { rule_id: 'c', class_id: 'G1-K22', role_id: 'TIC', muc_moi_buoi: 300 }
  ];
  const r = lap([d('1', '2026-11-02'), d('2', '2026-11-09')], {}, qt);
  assert.strictEqual(r[0].muc_de_xuat, 300);
  assert.strictEqual(r[0].thanh_tien_de_xuat, 600);
  const r2 = lap([d('1', '2026-11-02', { class_id: 'X', ten_lop: 'X' })], {}, qt);
  assert.strictEqual(r2[0].muc_de_xuat, 200);
  const r3 = lap([d('1', '2026-11-02', { class_id: 'X', ten_lop: 'X', nhom_lop: 'KIDS' })], {}, qt);
  assert.strictEqual(r3[0].muc_de_xuat, 100);
});

test('quy tắc role/level khác thì không áp dụng; ô trống = mọi giá trị', () => {
  const qt = [{ class_id: 'G1-K22', role_id: 'HOE', muc_moi_buoi: 999 }, { nhom_lop: 'GRADE1', level_id: 'L1', muc_moi_buoi: 50 }];
  assert.strictEqual(lap([d('1', '2026-11-02')], {}, qt)[0].muc_de_xuat, 50);
  assert.strictEqual(lap([d('1', '2026-11-02', { level_id: 'L2', ten_level: 'L2' })], {}, qt)[0].muc_de_xuat, '');
});

test('quy tắc hết hiệu lực / chưa hiệu lực bị bỏ qua', () => {
  const qt = [
    { class_id: 'G1-K22', tu_ngay: '2026-01-01', den_ngay: '2026-11-10', muc_moi_buoi: 100 },
    { class_id: 'G1-K22', tu_ngay: new Date(2026, 10, 11), muc_moi_buoi: 150 }
  ];
  const r = lap([d('1', '2026-11-10'), d('2', '2026-11-11')], {}, qt);
  assert.strictEqual(r[0].muc_de_xuat, 'nhiều mức');
  assert.strictEqual(r[0].thanh_tien_de_xuat, 250);
  const r2 = lap([d('1', '2026-12-01')], { den: '2026-12-31' }, [qt[0]]);
  assert.strictEqual(r2[0].muc_de_xuat, '');
  assert.strictEqual(r2[0].thanh_tien_de_xuat, '');
});

test('giữ lại thù lao đã nhập theo khóa', () => {
  const dl = [d('1', '2026-11-02'), d('2', '2026-11-03', { ef_id: 'EF02', ten_ef: 'Bình' })];
  const giu = g.taoGiuLai([
    { khoa: 'EF01|L1|TIC|G1-K22', thu_lao_quyet_dinh: 123, ghi_chu: 'ok' },
    { khoa: 'EF09|L1|TIC|G1-K22', thu_lao_quyet_dinh: 5, ghi_chu: '' },
    { khoa: 'EF02|L1|TIC|G1-K22', thu_lao_quyet_dinh: '', ghi_chu: '' },
    { khoa: '', thu_lao_quyet_dinh: 1, ghi_chu: '' }
  ]);
  assert.strictEqual(Object.keys(giu).length, 2);
  const r = lap(dl, {}, [], giu);
  const an = r.find((x) => x.ten_ef === 'An'), bi = r.find((x) => x.ten_ef === 'Bình');
  assert.strictEqual(an.thu_lao_quyet_dinh, 123);
  assert.strictEqual(an.ghi_chu, 'ok');
  assert.strictEqual(bi.thu_lao_quyet_dinh, '');
});

test('quyền: SUA + QUAN_TRI là editor, XEM là viewer, bỏ dòng hết hiệu lực', () => {
  const q = g.tinhQuyenThuLao([
    { email: 'A@x.com', quyen: 'SUA', dang_hieu_luc: 'Có' },
    { email: 'b@x.com', quyen: 'XEM', dang_hieu_luc: 'Có' },
    { email: 'c@x.com', quyen: 'XEM', dang_hieu_luc: 'Có' },
    { email: 'd@x.com', quyen: 'SUA', dang_hieu_luc: 'Không' },
    { email: 'sai', quyen: 'SUA', dang_hieu_luc: 'Có' }
  ], ['C@x.com', 'admin@x.com']);
  assert.deepStrictEqual([...q.editors].sort(), ['a@x.com', 'admin@x.com', 'c@x.com']);
  assert.deepStrictEqual([...q.viewers], ['b@x.com']);
});

test('kế hoạch quyền không đụng chủ file; gỡ, hạ, nâng', () => {
  const ke = g.keHoachQuyen({ editors: ['a@x.com', 'n@x.com'], viewers: ['b@x.com', 'c@x.com'] },
    { editors: ['chu@x.com', 'b@x.com', 'z@x.com'], viewers: ['c@x.com', 'n@x.com'] }, 'chu@x.com');
  const m = Object.fromEntries(ke.map((k) => [k.email, k.hanh_dong]));
  assert.deepStrictEqual({ ...m }, { 'a@x.com': 'CAP_SUA', 'b@x.com': 'HA_XUONG_XEM', 'n@x.com': 'CAP_SUA', 'z@x.com': 'GO' });
});

test('chốt kỳ: thiếu thù lao, so sánh điều chỉnh, lọc trùng', () => {
  assert.strictEqual(g.demThieuThuLao([{ so_buoi: 2, thu_lao_quyet_dinh: '' }, { so_buoi: 1, thu_lao_quyet_dinh: 0 }]), 1);
  assert.strictEqual(g.idKy('2026-11-01', new Date(2026, 10, 30)), 'KY_20261101_20261130');
  const chup = g.assignmentTrongKhoang([d('1', '2026-11-02'), d('2', '2026-11-03')], '2026-11-01', '2026-11-30');
  const ht = g.assignmentTrongKhoang([d('2', '2026-11-03'), d('3', '2026-11-04'), d('9', '2026-12-04')], '2026-11-01', '2026-11-30');
  const kq = g.soSanhKy(ht, chup);
  assert.deepStrictEqual(Array.from(kq.them.map((x) => x.assignment_id)), ['3']);
  assert.deepStrictEqual(Array.from(kq.bot.map((x) => x.assignment_id)), ['1']);
  const moi = [{ ky_id: 'K', assignment_id: '3', loai: 'THEM' }, { ky_id: 'K', assignment_id: '1', loai: 'BOT' }];
  assert.strictEqual(g.locDieuChinhMoi(moi, [{ ky_id: 'K', assignment_id: '3', loai: 'THEM' }]).length, 1);
});
