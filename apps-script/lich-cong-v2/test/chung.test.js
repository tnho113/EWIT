const test = require('node:test');
const assert = require('node:assert');
const { napGs } = require('./nap-gs');

const g = napGs('_chung/Chung.gs');

test('bangThanhObject bỏ dòng trống, gắn _dong', () => {
  const r = g.bangThanhObject([['a', 'b'], ['1', '2'], ['', ''], ['3', '']]);
  assert.strictEqual(r.length, 2);
  assert.strictEqual(r[1].a, '3');
  assert.strictEqual(r[1]._dong, 4);
});

test('ngayKey đọc Date, dd/MM/yyyy, yyyy-MM-dd', () => {
  assert.strictEqual(g.ngayKey(new Date(2026, 9, 28)), '2026-10-28');
  assert.strictEqual(g.ngayKey('6/1/2026'), '2026-01-06');
  assert.strictEqual(g.ngayKey('2026-1-6'), '2026-01-06');
  assert.strictEqual(g.ngayKey('abc'), '');
});

test('thuCuaNgay theo quy ước 2..8', () => {
  assert.strictEqual(g.thuCuaNgay('2026-10-26'), 2); // thứ Hai
  assert.strictEqual(g.thuCuaNgay('2026-11-01'), 8); // Chủ nhật
  assert.strictEqual(g.nhanThu(8), 'CN');
});

test('emailTheoVaiTro lọc hiệu lực và email hợp lệ', () => {
  const q = [
    { email: 'A@x.com', vai_tro_he_thong: 'NHAP_LIEU', dang_hieu_luc: 'Có' },
    { email: 'b@x.com', vai_tro_he_thong: 'NHAP_LIEU', dang_hieu_luc: 'Không' },
    { email: 'sai', vai_tro_he_thong: 'NHAP_LIEU', dang_hieu_luc: 'Có' },
  ];
  assert.deepStrictEqual(Array.from(g.emailTheoVaiTro(q, 'NHAP_LIEU')), ['a@x.com']);
});
