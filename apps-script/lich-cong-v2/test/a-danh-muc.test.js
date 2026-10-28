const test = require('node:test');
const assert = require('node:assert');
const { napGs } = require('./nap-gs');
const g = napGs('_chung/Chung.gs', 'a-danh-muc/QuyenLogic.gs');

const q = (email, vt, hl = 'Có', d = 2) => ({ email, vai_tro_he_thong: vt, dang_hieu_luc: hl, _dong: d });
const lop = (id, pt, tt = 'ACTIVE') => ({ class_id: id, phu_trach_email: pt, trang_thai: tt, _dong: 2 });
// kết quả từ vm có prototype khác: chuẩn hóa qua JSON
const j = (x) => JSON.parse(JSON.stringify(x));

test('mỗi vai trò hệ thống nhận đúng quyền trên ⓐⓑⓒ', () => {
  const k = j(g.tinhKeHoachQuyen([], [
    q('qt@x.vn', 'QUAN_TRI'), q('dm@x.vn', 'DANH_MUC'), q('nl@x.vn', 'NHAP_LIEU'), q('xem@x.vn', 'XEM')]));
  assert.deepStrictEqual(k.fileA.editors, ['dm@x.vn', 'qt@x.vn']);
  assert.deepStrictEqual(k.fileA.viewers, ['nl@x.vn', 'xem@x.vn']);
  assert.deepStrictEqual(k.fileB.editors, ['nl@x.vn', 'qt@x.vn']);
  assert.deepStrictEqual(k.fileB.viewers, ['dm@x.vn']);
  assert.deepStrictEqual(k.fileC.editors, ['qt@x.vn']);
  assert.deepStrictEqual(k.fileC.viewers, ['dm@x.vn', 'nl@x.vn', 'xem@x.vn']);
  assert.deepStrictEqual(k.loi, []);
});

test('nhiều vai trò: lấy quyền cao nhất mỗi file, không trùng giữa editors và viewers', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G1', 'a@x.vn')], [
    q('qt@x.vn', 'QUAN_TRI'), q('a@x.vn', 'XEM'), q('a@x.vn', 'DANH_MUC'), q('a@x.vn', 'NHAP_LIEU')]));
  // a: A sửa (DANH_MUC), B sửa (NHAP_LIEU/phụ trách), C xem
  assert.ok(k.fileA.editors.includes('a@x.vn') && !k.fileA.viewers.includes('a@x.vn'));
  assert.ok(k.fileB.editors.includes('a@x.vn') && !k.fileB.viewers.includes('a@x.vn'));
  assert.ok(k.fileC.viewers.includes('a@x.vn') && !k.fileC.editors.includes('a@x.vn'));
});

test('email viết hoa / có khoảng trắng được chuẩn hóa', () => {
  const k = j(g.tinhKeHoachQuyen([], [q('  QT@X.vn ', 'quan_tri')]));
  assert.deepStrictEqual(k.fileA.editors, ['qt@x.vn']);
});

test('người phụ trách: xem ⓐ, sửa ⓑ, không có ⓒ', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G1', 'pt@x.vn')], [q('qt@x.vn', 'QUAN_TRI')]));
  assert.ok(k.fileA.viewers.includes('pt@x.vn'));
  assert.ok(k.fileB.editors.includes('pt@x.vn'));
  assert.ok(!k.fileC.editors.includes('pt@x.vn') && !k.fileC.viewers.includes('pt@x.vn'));
});

test('nhiều phụ trách cách dấu phẩy, có khoảng trắng và xuống dòng', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G1', 'a@x.vn, B@x.vn ,\nc@x.vn;a@x.vn')], [q('qt@x.vn', 'QUAN_TRI')]));
  assert.deepStrictEqual(k.tabLop[0].editors, ['a@x.vn', 'b@x.vn', 'c@x.vn', 'qt@x.vn']);
});

test('tabLop editors = phụ trách + NHAP_LIEU + QUAN_TRI (không gồm DANH_MUC, XEM)', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G1', 'pt@x.vn')], [
    q('qt@x.vn', 'QUAN_TRI'), q('nl@x.vn', 'NHAP_LIEU'), q('dm@x.vn', 'DANH_MUC'), q('xem@x.vn', 'XEM')]));
  assert.deepStrictEqual(k.tabLop, [{ class_id: 'G1', editors: ['nl@x.vn', 'pt@x.vn', 'qt@x.vn'] }]);
});

test('lớp COMPLETED: phụ trách không còn sửa tab, nhưng vẫn xem ⓐ', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G0', 'pt@x.vn', 'completed'), lop('G1', 'pt@x.vn')], [
    q('qt@x.vn', 'QUAN_TRI'), q('nl@x.vn', 'NHAP_LIEU')]));
  assert.deepStrictEqual(k.tabLop.find(t => t.class_id === 'G0').editors, ['nl@x.vn', 'qt@x.vn']);
  assert.ok(k.tabLop.find(t => t.class_id === 'G1').editors.includes('pt@x.vn'));
  assert.ok(k.fileA.viewers.includes('pt@x.vn'));
});

test('phụ trách chỉ có lớp COMPLETED: không được sửa file ⓑ', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G0', 'pt@x.vn', 'COMPLETED')], [q('qt@x.vn', 'QUAN_TRI')]));
  assert.ok(!k.fileB.editors.includes('pt@x.vn'));
  assert.ok(k.fileA.viewers.includes('pt@x.vn'));
});

test('email sai định dạng vào loi và bị bỏ qua', () => {
  const k = j(g.tinhKeHoachQuyen([lop('G1', 'ok@x.vn, sai.com, @x.vn')], [
    q('qt@x.vn', 'QUAN_TRI'), q('khong-phai-email', 'XEM', 'Có', 5), q('', 'XEM', 'Có', 6)]));
  assert.strictEqual(k.loi.length, 4);
  assert.ok(k.loi.some(m => m.includes('quyen dòng 5')));
  assert.deepStrictEqual(k.tabLop[0].editors, ['ok@x.vn', 'qt@x.vn']);
  assert.ok(!k.fileA.viewers.includes('sai.com'));
});

test('vai trò hệ thống lạ vào loi', () => {
  const k = j(g.tinhKeHoachQuyen([], [q('qt@x.vn', 'QUAN_TRI'), q('a@x.vn', 'SIEU_NHAN')]));
  assert.strictEqual(k.loi.length, 1);
  assert.ok(!k.fileA.viewers.includes('a@x.vn') && !k.fileA.editors.includes('a@x.vn'));
});

test('dang_hieu_luc = Không hoặc trống thì bỏ qua (kể cả email sai thì không báo lỗi)', () => {
  const k = j(g.tinhKeHoachQuyen([], [
    q('qt@x.vn', 'QUAN_TRI'), q('cu@x.vn', 'QUAN_TRI', 'Không'), q('rong@x.vn', 'XEM', ''), q('hong', 'XEM', 'Không')]));
  assert.deepStrictEqual(k.fileA.editors, ['qt@x.vn']);
  assert.deepStrictEqual(k.fileA.viewers, []);
  assert.deepStrictEqual(k.loi, []);
});

test('thiếu QUAN_TRI hiệu lực: báo loi và quanTri rỗng', () => {
  const k = j(g.tinhKeHoachQuyen([], [q('qt@x.vn', 'QUAN_TRI', 'Không')]));
  assert.deepStrictEqual(k.quanTri, []);
  assert.ok(k.loi.some(m => m.includes('QUAN_TRI')));
});

test('class_id trống bị bỏ, trùng class_id vào loi', () => {
  const k = j(g.tinhKeHoachQuyen([lop('', 'a@x.vn'), lop('G1', ''), lop('G1', 'b@x.vn')], [q('qt@x.vn', 'QUAN_TRI')]));
  assert.strictEqual(k.tabLop.length, 1);
  assert.ok(k.loi.some(m => m.includes('trùng')));
  assert.ok(!k.fileA.viewers.includes('a@x.vn'));
});

test('đầu vào undefined không làm lỗi', () => {
  const k = j(g.tinhKeHoachQuyen(undefined, undefined));
  assert.deepStrictEqual(k.tabLop, []);
});

test('soSanhChiaSe: thêm, hạ cấp, gỡ; không gỡ chủ file', () => {
  const s = j(g.soSanhChiaSe(
    { editors: ['a@x.vn', 'moi@x.vn'], viewers: ['b@x.vn', 'c@x.vn'] },
    { editors: ['a@x.vn', 'b@x.vn', 'thua@x.vn'], viewers: ['c@x.vn', 'v@x.vn'], chu: 'Chu@x.vn' }));
  assert.deepStrictEqual(s.themEditors, ['moi@x.vn']);
  assert.deepStrictEqual(s.themViewers, []);
  assert.deepStrictEqual(s.haCap, ['b@x.vn']);
  assert.deepStrictEqual(s.go.sort(), ['thua@x.vn', 'v@x.vn']);
  const s2 = j(g.soSanhChiaSe({ editors: [], viewers: [] }, { editors: ['chu@x.vn'], viewers: [], chu: 'chu@x.vn' }));
  assert.deepStrictEqual(s2.go, []);
});

test('soSanhChiaSe: viewer lên editor thì chỉ thêm editor', () => {
  const s = j(g.soSanhChiaSe({ editors: ['v@x.vn'], viewers: [] }, { editors: [], viewers: ['v@x.vn'], chu: '' }));
  assert.deepStrictEqual(s.themEditors, ['v@x.vn']);
  assert.deepStrictEqual(s.go, []);
});

test('tabCanCapNhat', () => {
  assert.strictEqual(g.tabCanCapNhat(null, { e: ['a'], v: '' }, true), 'AP_DUNG');
  assert.strictEqual(g.tabCanCapNhat({ e: ['b', 'a'], v: 'x' }, { e: ['a', 'b'], v: 'x' }, true), 'KHONG_DOI');
  assert.strictEqual(g.tabCanCapNhat({ e: ['a'], v: 'x' }, { e: ['a', 'b'], v: 'x' }, true), 'AP_DUNG');
  assert.strictEqual(g.tabCanCapNhat({ e: ['a', 'b'], v: 'x' }, { e: ['a'], v: 'x' }, true), 'CAN_TAY');
  assert.strictEqual(g.tabCanCapNhat({ e: ['a', 'b'], v: 'x' }, { e: ['a'], v: 'x' }, false), 'AP_DUNG');
});

test('chiSoCotThanhChu', () => {
  assert.strictEqual(g.chiSoCotThanhChu(1), 'A');
  assert.strictEqual(g.chiSoCotThanhChu(26), 'Z');
  assert.strictEqual(g.chiSoCotThanhChu(27), 'AA');
  assert.strictEqual(g.chiSoCotThanhChu(52), 'AZ');
  assert.strictEqual(g.chiSoCotThanhChu(703), 'AAA');
});
