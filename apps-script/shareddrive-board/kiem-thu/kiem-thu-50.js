/** Kiểm thử 50_Quet.gs: quét báo cáo, dọn dẹp, thu ổ người nghỉ. Giả lập Drive v3 (mở rộng từ bản thử v1). */
const assert = require('assert');
const { taoBang, taoMoiTruong, bangMau } = require('./gia-lap');
const ADMIN = 'admin@example.com', TM = 'application/vnd.google-apps.folder', LT = 'application/vnd.google-apps.shortcut';
const MB = 1024 * 1024, NGAY = 86400000;

function taoDrive() {
  const S = { o: {}, tep: {}, dem: 0, xoa: [] };
  const id = p => p + (++S.dem);
  const loi = m => { throw new Error(m); };
  const dsLoc = (q, opts) => {
    let ds = Object.values(S.tep).filter(t => !t.trashed), m;
    if (opts.corpora === 'drive') ds = ds.filter(t => t.driveId === opts.driveId);
    if (opts.corpora === 'user') ds = ds.filter(t => !t.driveId);
    if ((m = q.match(/'([^']+)' in parents/))) ds = ds.filter(t => t.parents[0] === m[1]);
    if ((m = q.match(/mimeType\s*=\s*'([^']+)'/))) ds = ds.filter(t => t.mimeType === m[1]);
    if ((m = q.match(/name\s*=\s*'((?:[^'\\]|\\.)*)'/))) { const ten = m[1].replace(/\\'/g, "'"); ds = ds.filter(t => t.name === ten); }
    for (const x of q.matchAll(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/g)) ds = ds.filter(t => (t.appProperties || {})[x[1]] === x[2]);
    if (/visibility/.test(q)) ds = ds.filter(t => ['anyoneWithLink', 'anyoneCanFind'].includes(t.visibility));
    return ds;
  };
  const capNhatO = (t, d) => { t.driveId = d; Object.values(S.tep).filter(x => x.parents[0] === t.id).forEach(x => capNhatO(x, d)); };
  const Drive = {
    Drives: {
      list: o => { assert(o.useDomainAdminAccess, 'Drives.list cần useDomainAdminAccess'); return { drives: Object.values(S.o).map(d => ({ id: d.id, name: d.name })) }; },
      get: (d) => S.o[d] || loi('Không có ổ ' + d),
      remove: (d, o) => { assert(o && o.useDomainAdminAccess && o.allowItemDeletion, 'Drives.remove thiếu tham số'); S.o[d] || loi('Không có ổ ' + d);
        Object.values(S.tep).filter(t => t.driveId === d).forEach(t => delete S.tep[t.id]); delete S.o[d]; S.xoa.push(d); }
    },
    Files: {
      list: o => {
        const ds = dsLoc(o.q || '', o), bd = Number(o.pageToken || 0), n = o.pageSize || 100;
        return { files: ds.slice(bd, bd + n).map(t => Object.assign({}, t)), nextPageToken: bd + n < ds.length ? String(bd + n) : undefined };
      },
      create: (res, blob, o) => {
        const cha = res.parents[0], d = S.o[cha] ? cha : (S.tep[cha] || loi('cha không có')).driveId;
        const f = id('tm'); S.tep[f] = { id: f, name: res.name, mimeType: res.mimeType, parents: [cha], driveId: d, appProperties: res.appProperties, modifiedTime: new Date().toISOString() };
        return { id: f };
      },
      update: (res, f, blob, o) => {
        const t = S.tep[f] || loi('Không có tệp ' + f); o = o || {};
        if (S.hongChuyen && S.hongChuyen === t.name) loi('Không chuyển được (giả lập)');
        Object.assign(t, res);
        if (o.addParents) { const d = S.o[o.addParents] ? o.addParents : S.tep[o.addParents].driveId; t.parents = [o.addParents]; capNhatO(t, d); }
        return t;
      }
    },
    Permissions: {
      list: f => ({ permissions: Object.entries(S.o[f].tv).map(([e, r]) => ({ id: 'p:' + e, type: 'user', emailAddress: e, role: r })) }),
      remove: (f, pid, o) => { delete S.o[f].tv[pid.slice(2)]; }
    }
  };
  const them = (o, ten, cha, x = {}) => { const f = id('f'); S.tep[f] = Object.assign({ id: f, name: ten, mimeType: 'text/plain', parents: [cha || o], driveId: o === 'root' ? null : o,
    size: 0, quotaBytesUsed: x.size || 0, modifiedTime: new Date(Date.now() - 10 * NGAY).toISOString() }, x); if (o === 'root') S.tep[f].driveId = null; return f; };
  const to = (d, ten, tv = {}) => { S.o[d] = { id: d, name: ten, tv: Object.assign({ [ADMIN]: 'organizer' }, tv) }; };
  return { Drive, S, them, to };
}

/* ---------- Dựng dữ liệu ---------- */
function dung() {
  const bang = bangMau(), T = bang.tabs, D = taoDrive();
  T.CAU_TRUC.v.push(
    ['O_QT', 'QT', 'MLWIT · Quản trị', 'Ổ', '', '', '', 'dQT'], ['O_DL', 'DL', 'MLWIT · Dữ liệu', 'Ổ', '', '', '', 'dDL'], ['O_RAW', 'RAW', 'MLWIT · Tri thức – Raw', 'Ổ', '', '', '', 'dRAW'],
    ['CN_TEN', 'Ổ cá nhân', 'MLWIT · {Mã người} · {Họ tên}', 'Ổ'],
    ['QT_BC', 'QT', 'BAO-CAO', 'Thư mục'], ['QT_SL', 'QT', 'SAO-LUU', 'Thư mục'],
    ['HS_NG', 'DL', '{Mã người} · {Họ tên}', 'Thư mục theo người'], ['CN_CA_NHAN', 'Mọi ổ cá nhân', '90_CA-NHAN', 'Thư mục']);
  T.VAI_TRO.v.push(['HV', 'Vai trò', 'Không', 'Thu ổ', 'Ổ HV']); // trùng khóa, bản cuối ghi đè: giữ HV = Thu ổ
  T.NGUOI.v.push(
    ['hv1@example.com', 'HV Một', 'K1', 'HV', '', 'Đang', '', '', 'dP1'],
    ['hv2@example.com', 'HV Hai', 'K2', 'HV', '', 'Nghỉ', '', '', 'dP2'],
    ['hv3@example.com', 'HV Ba', 'K3', 'HV', '', 'Nghỉ', '', '', 'dP3'],
    ['ef1@example.com', 'EF Một', '', 'EF', '', 'Nghỉ', '', '', 'dP4']);
  T.THANH_VIEN.v.push(['hv1@example.com', 'HV Một', 'ME', 'Lớp', 'Thành viên', 'Xem', 'Đang']);
  // Ổ
  D.to('dQT', 'MLWIT · Quản trị'); D.to('dDL', 'MLWIT · Dữ liệu'); D.to('dRAW', 'MLWIT · Tri thức – Raw');
  D.to('dP1', 'MLWIT · K1 · HV Một', { 'hv1@example.com': 'reader' });
  D.to('dP2', 'MLWIT · K2 · HV Hai', { 'hv2@example.com': 'reader' });
  D.to('dP3', 'MLWIT · K3 · HV Ba', { 'hv3@example.com': 'reader' });
  D.to('dP4', 'MLWIT · EF Một', { 'ef1@example.com': 'reader' });
  D.to('dX', 'Ổ lạ bên ngoài');
  // QT
  const bc = D.them('dQT', 'BAO-CAO', null, { mimeType: TM, appProperties: { sdma: 'QT_BC' } });
  const sl = D.them('dQT', 'SAO-LUU', null, { mimeType: TM, appProperties: { sdma: 'QT_SL' } });
  // DL: cây sâu + dọn dẹp
  const A = D.them('dDL', 'A', null, { mimeType: TM });
  D.them('dDL', 'big.bin', A, { size: 150 * MB });
  D.them('dDL', 'old.txt', A, { size: 100, modifiedTime: new Date(Date.now() - 400 * NGAY).toISOString() });
  D.them('dDL', 'dup.txt', A, { size: 50 }); D.them('dDL', 'dup.txt', A, { size: 50 });
  D.them('dDL', 'rong', A, { mimeType: TM });
  const B = D.them('dDL', 'B', A, { mimeType: TM, appProperties: { sdma: 'ZZ_BYE' } });
  const Cc = D.them('dDL', 'C', B, { mimeType: TM }), Dd = D.them('dDL', 'D', Cc, { mimeType: TM });
  D.them('dDL', 'deep.txt', Dd, { size: 1000 });
  const hs2 = D.them('dDL', 'K2 · HV Hai', null, { mimeType: TM, appProperties: { sdma: 'HS_NG', sdemail: 'hv2@example.com' } });
  D.them('dDL', 'dang-dung', hs2, { size: 5 });
  // RAW
  D.them('dRAW', 'video.mp4', null, { mimeType: 'video/mp4', size: 20 * MB }); D.them('dRAW', 'song.mp3', null, { mimeType: 'audio/mpeg', size: 5 * MB });
  D.them('dRAW', 'doc.pdf', null, { mimeType: 'application/pdf', size: MB });
  // Cá nhân
  D.them('dP1', 'x.txt', null, { size: 10 });
  const cn2 = D.them('dP2', '90_CA-NHAN', null, { mimeType: TM, appProperties: { sdma: 'CN_CA_NHAN' } });
  D.them('dP2', 'bai1.docx', cn2, { size: 7 }); D.them('dP2', 'bai2.docx', cn2, { size: 8 });
  const cn3 = D.them('dP3', '90_CA-NHAN', null, { mimeType: TM, appProperties: { sdma: 'CN_CA_NHAN' } });
  D.them('dP3', 'bai3.docx', cn3, { size: 9 });
  const cn4 = D.them('dP4', '90_CA-NHAN', null, { mimeType: TM, appProperties: { sdma: 'CN_CA_NHAN' } });
  D.them('dP4', 'bai4.docx', cn4, { size: 9 });
  // Ngoài hệ thống + công khai
  D.them('dX', 'cong-khai.pdf', null, { size: 3 * MB, visibility: 'anyoneWithLink' });
  // Drive của admin
  D.them('root', 'a.txt', null, { size: 10 });
  return { bang, D, ids: { bc, sl, hs2 } };
}

function moiTruong(bang, D, tuyChinh = {}) {
  const baoCao = {}, ds = [], props = {};
  const ScriptApp = { newTrigger: h => ({ timeBased() { return this; }, after() { return this; }, create() { const t = { h, getHandlerFunction: () => h }; ds.push(t); return t; } }),
    getProjectTriggers: () => ds.slice(), deleteTrigger: t => { const i = ds.indexOf(t); if (i >= 0) ds.splice(i, 1); } };
  const SpreadsheetApp = { getActiveSpreadsheet: () => bang, openById: id => baoCao[id] || (baoCao[id] = taoBang({})),
    getUi: () => ({ alert: () => tuyChinh.traLoi || 'YES', Button: { YES: 'YES', NO: 'NO' }, ButtonSet: { YES_NO: 1 } }) };
  const PropertiesService = { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; } }) };
  const ctx = taoMoiTruong(bang, { Drive: D.Drive, ScriptApp, SpreadsheetApp, PropertiesService });
  return { ctx, baoCao, hen: ds, props };
}

/* ---------- Kịch bản ---------- */
let dat = 0, truot = 0;
const nhom = (ten, fn) => { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.stack.split('\n').slice(0, 3).join(' | ')); truot++; } };
const loiNK = b => b.tabs.NHAT_KY.v.filter(r => r[2] === 'LỖI');
const bang_ = (E, ten) => { const id = Object.keys(E.baoCao)[0]; return E.baoCao[id].tabs[ten]; };
const hang = (tab, ten, cotTen = 1) => tab.v.find(r => r[cotTen] === ten);

const M = dung(), E = moiTruong(M.bang, M.D), nSauQuet = () => Object.values(M.D.S.tep).filter(t => t.appProperties && t.appProperties.sdbaocao).length;

nhom('1. Báo cáo: tạo một lần, lần sau ghi đè', () => {
  E.ctx.sdQuet();
  assert.strictEqual(loiNK(M.bang).length, 0, JSON.stringify(loiNK(M.bang)));
  assert.strictEqual(nSauQuet(), 1);
  const f = Object.values(M.D.S.tep).find(t => t.appProperties && t.appProperties.sdbaocao);
  assert.strictEqual(f.parents[0], M.ids.bc, 'nằm trong QT_BC');
  const n1 = bang_(E, 'TOM_TAT').v.length;
  E.ctx.sdQuet();
  assert.strictEqual(nSauQuet(), 1, 'không tạo file mới');
  assert.strictEqual(Object.keys(E.baoCao).length, 1);
  assert.strictEqual(bang_(E, 'TOM_TAT').v.length, n1, 'ghi đè, không nối thêm');
  assert(M.bang.tabs.CAI_DAT.v.some(r => r[0] === 'Link báo cáo' && r[1].includes(f.id)));
  assert.strictEqual(E.props.SD_QUET, undefined);
  assert.strictEqual(E.hen.length, 0);
});

nhom('2. TOM_TAT: phân loại và dung lượng', () => {
  const t = bang_(E, 'TOM_TAT');
  const loai = ten => hang(t, ten)[2];
  assert.strictEqual(loai('MLWIT · Dữ liệu'), 'Ổ gốc');
  assert.strictEqual(loai('MLWIT · Quản trị'), 'Ổ gốc');
  assert.strictEqual(loai('MLWIT · K1 · HV Một'), 'Ổ cá nhân');
  assert.strictEqual(loai('Ổ lạ bên ngoài'), 'Ngoài hệ thống');
  assert.strictEqual(loai('Drive của admin'), 'Drive của admin');
  const dl = hang(t, 'MLWIT · Dữ liệu');
  assert.strictEqual(dl[5], 150 * MB + 100 + 50 + 50 + 1000 + 5, 'dung lượng byte');
  assert.strictEqual(dl[3], 6, 'số tệp'); assert.strictEqual(dl[4], 6, 'số thư mục: A, rong, B, C, D, HS2');
  assert.strictEqual(hang(t, 'Ổ lạ bên ngoài')[5], 3 * MB);
  assert.strictEqual(hang(t, 'Drive của admin')[3], 1);
  assert.strictEqual(t.v[1][0], '15/11/2026 10:00');
});

nhom('3. CAY: tới độ sâu 3', () => {
  const c = bang_(E, 'CAY').v.filter(r => r[0] === 'MLWIT · Dữ liệu').map(r => r[1]);
  assert(c.includes('  A') && c.includes('    B') && c.includes('      C'), c.join('|'));
  assert(!c.some(x => x.trim() === 'D'), 'không có cấp 4');
  const a = bang_(E, 'CAY').v.find(r => r[1] === '  A');
  assert.strictEqual(a[2], 5, 'A có 5 tệp con cháu: big, old, dup×2, deep');
});

nhom('4. DON_DEP', () => {
  const d = bang_(E, 'DON_DEP').v.slice(1), co = (loai, ten) => d.some(r => r[0].startsWith(loai) && (ten === undefined || r[3] === ten));
  assert(co('Tệp lớn', 'big.bin'));
  assert(co('Tệp không sửa', 'old.txt') && !co('Tệp không sửa', 'big.bin'));
  assert(co('Thư mục rỗng', 'rong'));
  assert(co('Trùng tên', 'dup.txt'));
  assert(co('Mã sdma ngoài cấu hình', 'B') && !d.some(r => r[0].startsWith('Mã sdma') && r[3] === 'K2 · HV Hai'), 'HS_NG hợp lệ không bị báo');
  assert(co('Ổ cá nhân của người Nghỉ', 'dP2') && co('Ổ cá nhân của người Nghỉ', 'dP4'), 'cả Thu ổ và Giữ ổ đều được liệt kê');
  const gc = d.find(r => r[3] === 'dP4'); assert(/Giữ ổ/.test(gc[4]));
});

nhom('5. CAN_CHU_Y: link công khai, audio/video trong Raw, ổ ngoài', () => {
  const c = bang_(E, 'CAN_CHU_Y').v.slice(1);
  assert(c.some(r => r[0].startsWith('Chia sẻ công khai') && r[3] === 'cong-khai.pdf'));
  assert(c.some(r => r[0].startsWith('Audio/video') && r[3] === 'video.mp4') && c.some(r => r[3] === 'song.mp3' && r[0].startsWith('Audio/video')));
  assert(!c.some(r => r[3] === 'doc.pdf'));
  assert(c.some(r => r[0] === 'Ổ ngoài hệ thống' && r[1] === 'Ổ lạ bên ngoài'));
});

nhom('6. Quét hết giờ: lưu con trỏ, hẹn chạy tiếp; lần sau hoàn tất', () => {
  E.ctx.QT_TRANG = 3; E.ctx.QT_HAN_MS = 0;
  E.ctx.sdQuet();
  assert(E.props.SD_QUET, 'phải lưu con trỏ');
  assert.strictEqual(E.hen.length, 1); assert.strictEqual(E.hen[0].h, 'sdQuetTiep');
  const tt = JSON.parse(E.props.SD_QUET); assert(tt.trang >= 1);
  assert(M.bang.tabs.NHAT_KY.v.some(r => /Chưa xong/.test(r[3])));
  let vong = 0;
  while (E.props.SD_QUET && vong++ < 200) E.ctx.sdQuetTiep();
  assert(vong > 3, 'phải qua nhiều lượt: ' + vong);
  assert.strictEqual(E.props.SD_QUET, undefined, 'xóa con trỏ');
  assert.strictEqual(E.hen.length, 0, 'xóa trình kích hoạt');
  const dl = hang(bang_(E, 'TOM_TAT'), 'MLWIT · Dữ liệu');
  assert.strictEqual(dl[5], 150 * MB + 100 + 50 + 50 + 1000 + 5, 'kết quả nhiều lượt vẫn đúng');
  assert.strictEqual(nSauQuet(), 1);
  assert.strictEqual(bang_(E, '_TAM').v.length, 0, 'dọn tab tạm');
  E.ctx.QT_HAN_MS = 270000; E.ctx.QT_TRANG = 1000;
  assert.strictEqual(loiNK(M.bang).length, 0);
});

nhom('7. Thu ổ Xem trước: không đổi gì', () => {
  const truoc = JSON.stringify([M.D.S.o, M.D.S.tep]);
  E.ctx.sdThuOXemTruoc();
  assert.strictEqual(JSON.stringify([M.D.S.o, M.D.S.tep]), truoc, 'Drive không đổi');
  assert.strictEqual(M.D.S.xoa.length, 0);
  const nguoi = M.bang.tabs.NGUOI.v;
  assert.strictEqual(nguoi.find(r => r[0] === 'hv2@example.com')[8], 'dP2', 'ID ổ còn nguyên');
  assert(/sẽ thu ổ/.test(nguoi.find(r => r[0] === 'hv2@example.com')[9]));
  assert(!nguoi.find(r => r[0] === 'ef1@example.com')[9], 'người Giữ ổ không bị đụng');
  assert.strictEqual(loiNK(M.bang).length, 0, JSON.stringify(loiNK(M.bang)));
});

nhom('8. Thu ổ Áp dụng', () => {
  E.ctx.sdThuOApDung();
  assert.strictEqual(loiNK(M.bang).length, 0, JSON.stringify(loiNK(M.bang)));
  assert.deepStrictEqual(M.D.S.xoa.sort(), ['dP2', 'dP3']);
  assert(M.D.S.o.dP1 && M.D.S.o.dP4, 'HV Đang và EF Giữ ổ còn');
  const luu = Object.values(M.D.S.tep).find(t => t.name === '90_CA-NHAN (lưu)');
  assert(luu && luu.parents[0] === M.ids.hs2 && luu.driveId === 'dDL');
  assert.deepStrictEqual(Object.values(M.D.S.tep).filter(t => t.parents[0] === luu.id).map(t => t.name).sort(), ['bai1.docx', 'bai2.docx']);
  const ten3 = Object.values(M.D.S.tep).find(t => t.name === 'MLWIT · K3 · HV Ba' && t.parents[0] === M.ids.sl);
  assert(ten3 && ten3.driveId === 'dQT', 'không có HS_NG → QT_SL/<tên ổ>');
  assert(Object.values(M.D.S.tep).some(t => t.name === 'bai3.docx' && t.parents[0] === ten3.id));
  const n = M.bang.tabs.NGUOI.v;
  assert.strictEqual(n.find(r => r[0] === 'hv2@example.com')[8], '');
  assert.strictEqual(n.find(r => r[0] === 'hv2@example.com')[9], 'đã thu ổ 15/11/2026');
  assert.strictEqual(n.find(r => r[0] === 'ef1@example.com')[8], 'dP4', 'Giữ ổ: không thu');
});

nhom('9. Không xác nhận / lỗi chuyển thì không xóa', () => {
  const M2 = dung(); M2.D.S.hongChuyen = 'bai2.docx';
  const E2 = moiTruong(M2.bang, M2.D, { traLoi: 'NO' });
  E2.ctx.sdThuOApDung();
  assert.strictEqual(M2.D.S.xoa.length, 0, 'không xác nhận thì không xóa');
  const E3 = moiTruong(M2.bang, M2.D);
  E3.ctx.sdThuOApDung();
  assert(!M2.D.S.xoa.includes('dP2'), 'chuyển lỗi thì giữ ổ');
  assert(M2.D.S.xoa.includes('dP3'), 'ổ khác vẫn thu');
  assert(loiNK(M2.bang).length >= 1);
  assert.strictEqual(M2.bang.tabs.NGUOI.v.find(r => r[0] === 'hv2@example.com')[8], 'dP2');
});

nhom('10. Mở báo cáo: ghi link; chưa có thì báo', () => {
  const M2 = dung(), E2 = moiTruong(M2.bang, M2.D);
  E2.ctx.sdMoBaoCao();
  assert(M2.bang.tabs.NHAT_KY.v.some(r => /Chưa có/.test(r[3])));
  E2.ctx.sdQuet(); E2.ctx.sdMoBaoCao();
  assert(M2.bang.tabs.NHAT_KY.v.some(r => r[2] === 'Báo cáo' && /docs\.google\.com/.test(r[4])));
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
