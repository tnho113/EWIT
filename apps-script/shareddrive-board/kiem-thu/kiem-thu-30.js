/**
 * Kiểm thử 30_Drive.gs ngoài Google: giả lập Sheets (gia-lap.js) + Drive v3 + MailApp + ScriptApp.
 * Chạy: node kiem-thu/kiem-thu-30.js   (đứng ở apps-script/shareddrive-board). Chỉ dùng email @example.com.
 * dongBoNhom_ (25_Nhom) được thay bằng stub: nhóm có thật = nhóm có thành viên Đang theo THANH_VIEN (+ nhóm riêng sd-u-).
 * Đợt 2b: Drive giả mô phỏng `properties` công khai và `appProperties` RIÊNG THEO DỰ ÁN (D.S.duAn): dự án khác không đọc được.
 */
const assert = require('assert');
const { taoMoiTruong, bangMau } = require('./gia-lap');
const ADMIN = 'admin@example.com';
const MIME_TM = 'application/vnd.google-apps.folder', MIME_LT = 'application/vnd.google-apps.shortcut';

/* ---------- Drive v3 giả ---------- */
function taoDrive() {
  const S = { o: {}, tep: {}, dem: 0, ghi: 0, duAn: 'A' };
  const id = p => p + (++S.dem);
  const loi = m => { throw new Error(m); };
  const tepCua = f => S.tep[f] || loi('Không có tệp ' + f);
  const oCua = f => S.o[f] ? f : tepCua(f).driveId;
  const HANG = { reader: 1, commenter: 2, writer: 3, fileOrganizer: 4, organizer: 5 };
  const toTien = f => { const kq = []; let t = S.tep[f]; while (t) { const cha = t.parents[0]; if (S.o[cha]) break; t = S.tep[cha]; if (t) kq.push(t); } return kq; };
  const sao = t => ({ id: t.id, name: t.name, mimeType: t.mimeType, parents: t.parents.slice(), driveId: t.driveId,
    properties: t.properties ? Object.assign({}, t.properties) : undefined,
    appProperties: t.appP[S.duAn] ? Object.assign({}, t.appP[S.duAn]) : undefined, shortcutDetails: t.shortcutDetails ? Object.assign({}, t.shortcutDetails) : undefined });

  function dsQuyen(f) {
    const ct = {};
    const them = (e, q, inh) => { (ct[e] = ct[e] || { type: q.type, d: [] }).d.push({ role: q.role, inherited: inh }); };
    if (S.o[f]) Object.entries(S.o[f].tv).forEach(([e, q]) => them(e, q, false));
    else {
      const t = tepCua(f);
      Object.entries(S.o[t.driveId].tv).forEach(([e, q]) => them(e, q, true));
      toTien(f).forEach(a => Object.entries(a.q).forEach(([e, q]) => them(e, q, true)));
      Object.entries(t.q).forEach(([e, q]) => them(e, q, false));
    }
    return Object.entries(ct).map(([e, x]) => ({ id: 'p:' + e, type: x.type, emailAddress: e,
      role: x.d.reduce((a, d) => HANG[d.role] > HANG[a] ? d.role : a, x.d[0].role), permissionDetails: S.o[f] ? undefined : x.d }));
  }
  const coQuyen = (e, f) => dsQuyen(f).some(p => p.emailAddress === e);

  function loc(q, o) {
    let ds = Object.values(S.tep), m;
    if (/trashed\s*=\s*false/.test(q)) ds = ds.filter(t => !t.trashed);
    if ((m = q.match(/'([^']+)' in parents/))) ds = ds.filter(t => t.parents.includes(m[1]));
    const reM = /mimeType\s*(!=|=)\s*'([^']+)'/g;
    while ((m = reM.exec(q))) { const op = m[1], v = m[2]; ds = ds.filter(t => op === '=' ? t.mimeType === v : t.mimeType !== v); }
    if ((m = q.match(/(?:^|\s)name\s*=\s*'((?:[^'\\]|\\.)*)'/))) { const ten = m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'); ds = ds.filter(t => t.name === ten); }
    const reA = /appProperties has \{ key='([^']+)' and value='([^']*)' \}/g;
    while ((m = reA.exec(q))) { const k = m[1], v = m[2]; ds = ds.filter(t => (t.appP[S.duAn] || {})[k] === v); }
    const reP = /(?:^|[^A-Za-z])properties has \{ key='([^']+)' and value='([^']*)' \}/g;
    while ((m = reP.exec(q))) { const k = m[1], v = m[2]; ds = ds.filter(t => (t.properties || {})[k] === v); }
    if (o.corpora === 'drive') { if (!o.driveId) loi('corpora drive cần driveId'); ds = ds.filter(t => t.driveId === o.driveId); }
    return ds.map(sao);
  }

  const taoTep = (res, cha) => {
    const d = oCua(cha);
    const loai = res.mimeType === MIME_TM ? 'tm' : res.mimeType === MIME_LT ? 'lt' : 'f';
    const f = id(loai);
    S.tep[f] = { id: f, name: res.name, mimeType: res.mimeType, parents: [cha], driveId: d, trashed: false, q: {},
      properties: res.properties ? Object.assign({}, res.properties) : undefined,
      appP: res.appProperties ? { [S.duAn]: Object.assign({}, res.appProperties) } : {},
      shortcutDetails: res.shortcutDetails ? Object.assign({}, res.shortcutDetails) : undefined };
    return f;
  };

  const Drive = {
    Drives: {
      create: res => { S.ghi++; const d = id('o'); S.o[d] = { id: d, name: res.name, tv: { [ADMIN]: { role: 'organizer', type: 'user' } }, restrictions: {} }; return { id: d, name: res.name }; },
      update: (res, d) => { S.ghi++; const o = S.o[d] || loi('Không có ổ ' + d); if (res.name) o.name = res.name; Object.assign(o.restrictions, res.restrictions || {}); return o; },
      get: d => { const o = S.o[d] || loi('Không có ổ ' + d); return { id: o.id, name: o.name, restrictions: Object.assign({}, o.restrictions) }; },
      list: () => ({ drives: Object.values(S.o).map(o => ({ id: o.id, name: o.name })) })
    },
    Files: {
      list: o => ({ files: loc(o.q || '', o) }),
      create: (res, blob, o) => {
        S.ghi++;
        if (res.mimeType === MIME_LT && !S.tep[res.shortcutDetails.targetId]) loi('Đích lối tắt không có');
        return { id: taoTep(res, res.parents[0]) };
      },
      update: (res, f, blob, o) => {
        S.ghi++; const t = tepCua(f);
        ['name', 'trashed'].forEach(k => { if (res[k] !== undefined) t[k] = res[k]; });
        if (res.properties) t.properties = Object.assign({}, t.properties || {}, res.properties);
        if (res.appProperties) t.appP[S.duAn] = Object.assign({}, t.appP[S.duAn] || {}, res.appProperties);
        if (o && o.addParents) { t.parents = [o.addParents]; t.driveId = oCua(o.addParents); }
        return sao(t);
      },
      copy: (res, f) => { S.ghi++; const nguon = tepCua(f); return { id: taoTep(Object.assign({ mimeType: nguon.mimeType }, res), res.parents[0]) }; },
      get: f => sao(tepCua(f))
    },
    Permissions: {
      list: f => ({ permissions: dsQuyen(f) }),
      create: (res, f) => {
        S.ghi++;
        if (!/@example\.com$/.test(res.emailAddress)) loi('email lạ');
        const q = { role: res.role, type: res.type };
        if (S.o[f]) S.o[f].tv[res.emailAddress] = q; else tepCua(f).q[res.emailAddress] = q;
        return { id: 'p:' + res.emailAddress };
      },
      update: (res, f, pid) => {
        S.ghi++; const e = pid.slice(2);
        const kho = S.o[f] ? S.o[f].tv : tepCua(f).q;
        if (!kho[e]) loi('không có quyền trực tiếp'); kho[e].role = res.role;
      },
      remove: (f, pid) => {
        S.ghi++; const e = pid.slice(2);
        const kho = S.o[f] ? S.o[f].tv : tepCua(f).q;
        if (!kho[e]) loi('không có quyền trực tiếp'); delete kho[e];
      }
    }
  };
  return { Drive, S, coQuyen, taoTep };
}

/* ---------- Bảng mẫu ---------- */
const bang = bangMau();
const T = bang.tabs;
T.NHOM.v.push(
  ['L3', 'EF Level 3', 'Level', '', '', 'EWIT', 'Đang'], ['L2', 'EF Level 2', 'Level', '', '', 'EWIT', 'Đang'], ['L1', 'EF Level 1', 'Level', '', '', 'EWIT', 'Đang'],
  ['ME02', 'IELTS Mentor 02', 'Lớp', '', 'ME', 'EWIT', 'Đang'],
  ['ME02-07', 'Nhóm 07', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'], ['ME02-08', 'Nhóm 08', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'],
  ['PA03', 'Phát âm 03', 'Lớp', '', 'PA', 'EWIT', 'Đang'], ['PA03-01', 'Nhóm PA 01', 'Nhóm nhỏ', 'PA03', '', 'EWIT', 'Đang'],
  ['KIND', 'Kind English', 'Dự án', '', '', 'EWIT', 'Đang'], ['DAO-TAO', 'Ban Đào tạo', 'Ban', '', '', 'EWIT', 'Đang'],
  ['CU', 'Dự án cũ', 'Dự án', '', '', 'EWIT', 'Ngừng'],
  ['RAW', 'Tri thức Raw', 'Tri thức', '', '', 'MLWIT', 'Đang'], ['WIKI', 'Tri thức Wiki', 'Tri thức', '', '', 'MLWIT', 'Đang'],
  ['DULIEU', 'Dữ liệu học viên', 'Dữ liệu', '', '', 'MLWIT', 'Đang']);
const ng = (e, ten, ma, vai, lv, tt, maHT) => [e, ten, ma, vai, lv, tt, '', '', '', '', maHT || ''];
T.NGUOI.v.push(
  ng('ef1@example.com', 'EF Một', '', 'EF', 'L2', 'Đang', 'U00001'), ng('ef2@example.com', 'EF Hai', '', 'EF', 'L3', 'Đang', 'U00002'),
  ng('gv1@example.com', 'GV Một', '', 'GV', '', 'Đang', 'U00003'), ng('hv1@example.com', 'HV Một', 'K22-901', 'HV', '', 'Đang', 'U00004'),
  ng('hv2@example.com', 'HV Hai', 'K22-902', 'HV', '', 'Đang', 'U00005'), ng('dl1@example.com', 'Dữ Liệu Một', '', 'Tổ chức', '', 'Đang', 'U00006'));
const tv = (e, ma, loai, vai = 'Thành viên', quyen = 'Xem', tt = 'Đang') => [e, '', ma, loai, vai, quyen, tt];
T.THANH_VIEN.v.push(
  tv('ef1@example.com', 'L2', 'Level'), tv('ef1@example.com', 'ME02', 'Lớp', 'Phụ trách'), tv('ef1@example.com', 'ME02-08', 'Nhóm nhỏ', 'Phụ trách'),
  tv('ef1@example.com', 'KIND', 'Dự án', 'Thành viên', 'Sửa'), tv('ef1@example.com', 'RAW', 'Tri thức'),
  tv('ef2@example.com', 'L3', 'Level'), tv('ef2@example.com', 'ME02-07', 'Nhóm nhỏ', 'Phụ trách'), tv('ef2@example.com', 'DAO-TAO', 'Ban'),
  tv('gv1@example.com', 'PA03', 'Lớp', 'Phụ trách'), tv('gv1@example.com', 'PA03-01', 'Nhóm nhỏ', 'Phụ trách'), tv('gv1@example.com', 'KIND', 'Dự án'),
  tv('gv1@example.com', 'WIKI', 'Tri thức'),
  tv('hv1@example.com', 'ME02', 'Lớp'), tv('hv1@example.com', 'ME02-08', 'Nhóm nhỏ'), tv('hv1@example.com', 'PA03', 'Lớp'),
  tv('hv1@example.com', 'PA03-01', 'Nhóm nhỏ'), tv('hv1@example.com', 'RAW', 'Tri thức'),
  tv('hv2@example.com', 'ME02', 'Lớp'), tv('hv2@example.com', 'ME02-07', 'Nhóm nhỏ'),
  tv('dl1@example.com', 'DULIEU', 'Dữ liệu', 'Phụ trách'));
const ct = (ma, o, duong, loai, nguon = '', quyen = '') => [ma, o, duong, loai, nguon, quyen, '', ''];
T.CAU_TRUC.v.push(
  ct('O_QT', 'Quản trị', 'MLWIT · Quản trị', 'Ổ'), ct('O_DL', 'Dữ liệu học viên', 'MLWIT · Dữ liệu học viên', 'Ổ'),
  ct('O_RAW', 'Tri thức – Raw', 'MLWIT · Tri thức – Raw', 'Ổ'), ct('O_WIKI', 'Tri thức – Wiki', 'MLWIT · Tri thức – Wiki', 'Ổ'),
  ct('O_TTC', 'Thông tin chung', 'EWIT · Thông tin chung', 'Ổ'), ct('O_TV', 'Thư viện EF', 'EWIT · Thư viện EF', 'Ổ'),
  ct('O_DA', 'Dự án & Ban', 'EWIT · Dự án & Ban', 'Ổ'), ct('O_LOP', 'Lớp học', 'EWIT · Lớp học', 'Ổ'),
  ct('O_HS', 'Hồ sơ học tập', 'EWIT · Hồ sơ học tập', 'Ổ'),
  ct('CN_TEN', 'Ổ cá nhân', 'MLWIT · {Mã người} · {Họ tên}', 'Ổ'),
  ct('QT_BANG', 'Quản trị', '00_BANG', 'Thư mục'), ct('QT_BC', 'Quản trị', '10_BAO-CAO', 'Thư mục'),
  ct('QT_MAU', 'Quản trị', '20_MAU', 'Thư mục'), ct('QT_SL', 'Quản trị', '90_SAO-LUU', 'Thư mục'),
  ct('TTC_EF', 'Thông tin chung', 'EF', 'Thư mục'),
  ct('TTC_EF_1', 'Thông tin chung', 'EF/01_GIOI-THIEU', 'Thư mục'), ct('TTC_EF_2', 'Thông tin chung', 'EF/02_QUY-TRINH', 'Thư mục'),
  ct('TTC_EF_3', 'Thông tin chung', 'EF/03_BIEU-MAU', 'Thư mục'), ct('TTC_EF_4', 'Thông tin chung', 'EF/04_DAO-TAO', 'Thư mục'),
  ct('TTC_EF_5', 'Thông tin chung', 'EF/05_THONG-BAO', 'Thư mục'),
  ct('TTC_HV', 'Thông tin chung', 'HOC-VIEN', 'Thư mục'),
  ct('TTC_HV_1', 'Thông tin chung', 'HOC-VIEN/01_GIOI-THIEU', 'Thư mục'), ct('TTC_HV_2', 'Thông tin chung', 'HOC-VIEN/02_NOI-QUY', 'Thư mục'),
  ct('TTC_HV_3', 'Thông tin chung', 'HOC-VIEN/03_THONG-BAO', 'Thư mục'),
  ct('TV_CAP', 'Thư viện EF', '{Mã nhóm}', 'Thư mục theo nhóm', 'Nhóm loại: Level'),
  ct('DA_NHOM', 'Dự án & Ban', '{Mã nhóm} · {Tên nhóm}', 'Thư mục theo nhóm', 'Nhóm loại: Dự án, Ban'),
  ct('DA_K1', 'Dự án & Ban', '{nhóm}/10_KE-HOACH', 'Thư mục con của nhóm'), ct('DA_K2', 'Dự án & Ban', '{nhóm}/20_TAI-LIEU', 'Thư mục con của nhóm'),
  ct('DA_K3', 'Dự án & Ban', '{nhóm}/30_SAN-PHAM', 'Thư mục con của nhóm'), ct('DA_K4', 'Dự án & Ban', '{nhóm}/40_BIEN-BAN-HOP', 'Thư mục con của nhóm'),
  ct('LOP_NHOM', 'Lớp học', '{Nhánh}/{Mã nhóm} · {Tên nhóm}', 'Thư mục theo nhóm', 'Nhóm loại: Lớp'),
  ct('LOP_VIDEO', 'Lớp học', '{nhóm}/VIDEO', 'Thư mục con của nhóm'), ct('LOP_TL', 'Lớp học', '{nhóm}/TAI-LIEU', 'Thư mục con của nhóm'),
  ct('RAW_NG', 'Tri thức – Raw', '{Mã người} · {Họ tên}', 'Thư mục theo người', 'Nhóm: RAW'),
  ct('WIKI_NG', 'Tri thức – Wiki', '{Mã người} · {Họ tên}', 'Thư mục theo người', 'Nhóm: WIKI'),
  ct('HS_NG', 'Hồ sơ học tập', '{Mã người} · {Họ tên}', 'Thư mục theo người', 'Vai trò: HV'),
  ct('HS_NOP', 'Hồ sơ học tập', '{người}/{Mã lớp}', 'Thư mục con theo lớp'),
  ct('HS_NK', 'Hồ sơ học tập', '{người}/Nhật ký trưởng thành', 'Tệp mẫu'),
  ct('HS_TL', 'Hồ sơ học tập', '{người}/00_TAI-LIEU-CUA-TOI', 'Thư mục con theo người', '', 'Tải lên'),
  ct('CN_TTC_EF', 'Ổ EF, Ổ GV', '00 · Thông tin chung', 'Lối tắt', '→ TTC_EF'),
  ct('CN_TTC_HV', 'Ổ HV', '00 · Thông tin học viên', 'Lối tắt', '→ TTC_HV'),
  ct('CN_RAW', 'Mọi ổ cá nhân', '05 · Tri thức Raw', 'Lối tắt', '→ RAW_NG (nếu tham gia)'),
  ct('CN_WIKI', 'Mọi ổ cá nhân', '06 · Tri thức Wiki', 'Lối tắt', '→ WIKI_NG (nếu tham gia)'),
  ct('CN_CAP', 'Ổ EF', '10_LEVEL', 'Chỗ đặt lối tắt', 'Nguồn: Level'),
  ct('CN_LOP_DANG', 'Ổ HV', '10_LOP-DANG-HOC', 'Chỗ đặt lối tắt', 'Nguồn: Lớp đang học'),
  ct('CN_LOP_DA', 'Ổ HV', '11_LOP-DA-HOC', 'Chỗ đặt lối tắt', 'Nguồn: Lớp đã học'),
  ct('CN_DA', 'Ổ EF, Ổ GV', '20_DU-AN', 'Chỗ đặt lối tắt', 'Nguồn: Dự án tham gia'),
  ct('CN_HS', 'Ổ HV', '20 · Hồ sơ học tập', 'Lối tắt', '→ HS_NG của chính người đó'),
  ct('CN_LOP_PT', 'Ổ EF, Ổ GV', '30_LOP-PHU-TRACH', 'Chỗ đặt lối tắt', 'Nguồn: Lớp phụ trách'),
  ct('CN_HV_PT', 'Ổ EF, Ổ GV', '40_HOC-VIEN-PHU-TRACH', 'Chỗ đặt lối tắt', 'Nguồn: Học viên phụ trách'),
  ct('CN_CA_NHAN', 'Mọi ổ cá nhân', '90_CA-NHAN', 'Thư mục', '', 'Tải lên'));

/* ---------- Môi trường ---------- */
const D = taoDrive();
const thu = [], hen = [];
const ScriptApp = {
  newTrigger: fn => ({ timeBased() { return this; }, after() { return this; }, everyDays() { return this; }, atHour() { return this; },
    nearMinute() { return this; }, inTimezone() { return this; }, create() { const t = { fn, getHandlerFunction: () => fn }; hen.push(t); return t; } }),
  getProjectTriggers: () => hen.slice(),
  deleteTrigger: t => { const i = hen.indexOf(t); if (i >= 0) hen.splice(i, 1); }
};
const ctx = taoMoiTruong(bang, { Drive: D.Drive, GmailApp: { sendEmail: (to, tieuDe, than, opt) => thu.push({ to, tieuDe, than, opt }) },
  MailApp: { sendEmail: () => { throw new Error('phải dùng GmailApp khi có'); } }, ScriptApp }, ADMIN);
let lech = 0;                                                  // giả thời gian trôi cho hàng đợi thư chào
ctx.drBayGioMs_ = () => Date.now() + lech;
const quaGio = () => { lech += 61 * 60000; ctx.sdThuChaoDenHan(); };
ctx.dongBoNhom_ = C => {
  const co = {};
  C.dsNhom.forEach(g => {
    if (g.tt === 'Đóng' || g.tt === 'Ngừng') return;
    ctx.thanhVienNhom_(C, g.ma).forEach(t => { co[ctx.emailNhom_(C, g.ma, ctx.hauToCua_(t))] = true; });
  });
  const dang = n => n.tt === 'Đang' && ctx.coOCaNhan_(C, n);
  if (C.dsNguoi.some(n => dang(n) && ['EF', 'GV', 'Tổ chức'].includes(n.vaiTro))) co[ctx.emailTong_(C, 'ef')] = true;
  if (C.dsNguoi.some(n => dang(n) && n.vaiTro === 'HV')) co[ctx.emailTong_(C, 'hv')] = true;
  C.dsNguoi.forEach(n => { if (dang(n) && n.maHT) co[ctx.emailNhomRieng_(C, n)] = true; });
  return { nhomCo: co, chuaXong: false };
};
const goc_drHetGio_ = ctx.drHetGio_;

/* ---------- Trợ giúp ---------- */
let nkTruoc = 0;
const xemTruoc = () => { nkTruoc = T.NHAT_KY.v.length; ctx.sdDriveXemTruoc(); };
const apDung = () => { nkTruoc = T.NHAT_KY.v.length; ctx.sdDriveApDung(); };
const nkMoi = () => T.NHAT_KY.v.slice(nkTruoc);
const loiMoi = () => nkMoi().filter(r => r[2] === 'LỖI');
const khongLoi = () => assert.strictEqual(loiMoi().length, 0, 'có LỖI: ' + JSON.stringify(loiMoi()));
const oTen = ten => Object.values(D.S.o).find(o => o.name === ten);
const tep = (ap, oId) => Object.values(D.S.tep).find(t => !t.trashed && (!oId || t.driveId === oId) &&
  Object.entries(ap).every(([k, v]) => (t.properties || {})[k] === v));
const tepTen = (ten, cha) => Object.values(D.S.tep).find(t => !t.trashed && t.name === ten && (!cha || t.parents[0] === cha));
const q = f => { const x = D.S.o[f] ? D.S.o[f].tv : D.S.tep[f].q; const m = {}; Object.entries(x).forEach(([e, v]) => { m[e] = v.role; }); return m; };
const lt = oId => Object.values(D.S.tep).filter(t => t.driveId === oId && t.mimeType === MIME_LT && !t.trashed);
const ltTrong = (oId, cha) => lt(oId).filter(t => t.parents[0] === cha);
const tenLt = (oId, cha) => ltTrong(oId, cha).map(t => t.name).sort();
const cot = (tab, ten) => { const v = T[tab].v; const c = v[0].indexOf(ten); return v.slice(1).map(r => r[c]); };
const dongNguoi = e => T.NGUOI.v.findIndex(r => r[0] === e);
const tvDong = (e, ma) => T.THANH_VIEN.v.find(r => r[0] === e && r[2] === ma);
const nhomDong = ma => T.NHOM.v.find(r => r[0] === ma);
const oCN = e => D.S.o[T.NGUOI.v[dongNguoi(e)][8]];
const tmCN = (e, ma) => tep({ sdma: ma }, oCN(e).id);
const nop = (e, lop) => tep({ sdma: 'HS_NOP', sdemail: e, sdlop: lop });
const tmLop = ma => tep({ sdma: 'LOP_NHOM', sdnhom: ma });
const tmDa = ma => tep({ sdma: 'DA_NHOM', sdnhom: ma });
const tmTv = ma => tep({ sdma: 'TV_CAP', sdnhom: ma });
const sd = (ma, hau) => 'sd-' + ma.toLowerCase() + (hau ? '-' + hau : '') + '@example.com';
const MAHT = { 'ef1@example.com': 'U00001', 'ef2@example.com': 'U00002', 'gv1@example.com': 'U00003', 'hv1@example.com': 'U00004', 'hv2@example.com': 'U00005', 'dl1@example.com': 'U00006' };
const sdU = e => 'sd-u-' + MAHT[e].toLowerCase() + '@example.com';     // nhóm riêng (Đợt 2b)

let dat = 0, truot = 0;
function nhom(ten, fn) { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } }

/* ================= KỊCH BẢN ================= */

nhom('1. Xem trước: không ghi gì lên Drive/Mail, báo "sẽ …"', () => {
  xemTruoc();
  khongLoi();
  assert.strictEqual(D.S.ghi, 0, 'không được gọi lệnh ghi Drive');
  assert.strictEqual(Object.keys(D.S.o).length, 0);
  assert.strictEqual(thu.length, 0, 'không gửi thư');
  assert.strictEqual(hen.length, 0);
  assert(cot('CAU_TRUC', 'ID').every(x => !x), 'không ghi ID');
  const kq = cot('NGUOI', 'Kết quả Drive');
  assert(kq.every(x => /^sẽ tạo ổ/.test(x)), kq.join(' | '));
  assert(nkMoi().some(r => r[2] === 'Ổ gốc' && r[3] === 'Sẽ tạo ổ' && r[4] === 'EWIT · Lớp học'));
  assert(nkMoi().some(r => r[2] === 'Quyền' && /Sẽ cấp/.test(r[3])));
});

let oG = {};
nhom('2. Áp dụng: 9 ổ gốc + thư mục + ghi ID, O_DL chỉ nhóm DULIEU', () => {
  apDung();
  khongLoi();
  const ten = ['MLWIT · Quản trị', 'MLWIT · Dữ liệu học viên', 'MLWIT · Tri thức – Raw', 'MLWIT · Tri thức – Wiki', 'EWIT · Thông tin chung',
    'EWIT · Thư viện EF', 'EWIT · Dự án & Ban', 'EWIT · Lớp học', 'EWIT · Hồ sơ học tập'];
  ten.forEach(t => { oG[t] = oTen(t); assert(oG[t], 'thiếu ổ ' + t); });
  const id = cot('CAU_TRUC', 'ID');
  assert.deepStrictEqual(id.slice(0, 9), ten.map(t => oG[t].id), 'ghi ID ổ gốc');
  ten.forEach(t => assert.deepStrictEqual(oG[t].restrictions, { driveMembersOnly: false, domainUsersOnly: false, sharingFoldersRequiresOrganizerPermission: true }));
  assert.deepStrictEqual(q(oG['MLWIT · Dữ liệu học viên'].id), { [ADMIN]: 'organizer', [sd('DULIEU', 'pt')]: 'fileOrganizer' });
  assert.deepStrictEqual(Object.keys(q(oG['EWIT · Lớp học'].id)), [ADMIN], 'ổ gốc khác không thêm thành viên');
  const ttc = oG['EWIT · Thông tin chung'].id, ef = tep({ sdma: 'TTC_EF' }, ttc);
  assert.strictEqual(ef.name, 'EF');
  assert.strictEqual(tep({ sdma: 'TTC_EF_1' }).parents[0], ef.id, 'EF/01 nằm trong EF');
  assert.strictEqual(tep({ sdma: 'TTC_HV_2' }).parents[0], tep({ sdma: 'TTC_HV' }).id);
  assert.strictEqual(id[T.CAU_TRUC.v.findIndex(r => r[0] === 'TTC_EF') - 1], ef.id, 'ghi ID thư mục ở CAU_TRUC');
  // Lớp: nhánh trung gian + VIDEO/TAI-LIEU; Dự án: khung 4 thư mục
  const me02 = tmLop('ME02'), nhanh = D.S.tep[me02.parents[0]];
  assert.strictEqual(me02.name, 'ME02 · IELTS Mentor 02');
  assert.strictEqual(nhanh.name, 'ME'); assert.strictEqual(nhanh.properties.sdma, 'LOP_NHOM_NHANH');
  assert(tepTen('VIDEO', me02.id) && tepTen('TAI-LIEU', me02.id));
  assert.deepStrictEqual(['10_KE-HOACH', '20_TAI-LIEU', '30_SAN-PHAM', '40_BIEN-BAN-HOP'].map(x => !!tepTen(x, tmDa('KIND').id)), [true, true, true, true]);
  assert(!tmDa('CU'), 'dự án Ngừng: không tạo');
  assert.strictEqual(cot('NHOM', 'ID thư mục')[T.NHOM.v.indexOf(nhomDong('ME02')) - 1], me02.id, 'ghi ID thư mục nhóm');
  assert.strictEqual(tmTv('L3').name, 'L3');
});

// Đợt 2b: chủ ổ là thành viên writer (Người đóng góp); không tạo 90_CA-NHAN (CN_CA_NHAN bỏ, dù dòng còn trên bảng).
nhom('3. Ổ cá nhân EF/GV/HV đúng khuôn, ghi ID ổ, chủ ổ là Người đóng góp', () => {
  const ten = { 'ef1@example.com': 'MLWIT · EF Một', 'gv1@example.com': 'MLWIT · GV Một', 'hv1@example.com': 'MLWIT · K22-901 · HV Một' };
  Object.entries(ten).forEach(([e, t]) => { const o = oTen(t); assert(o, 'thiếu ổ ' + t); assert.strictEqual(T.NGUOI.v[dongNguoi(e)][8], o.id); assert.strictEqual(q(o.id)[e], 'writer'); });
  const thuMuc = e => Object.values(D.S.tep).filter(t => t.driveId === oCN(e).id && t.mimeType === MIME_TM && !t.trashed && t.parents[0] === oCN(e).id).map(t => t.name).sort();
  assert.deepStrictEqual(thuMuc('ef1@example.com'), ['10_LEVEL', '20_DU-AN', '30_LOP-PHU-TRACH', '40_HOC-VIEN-PHU-TRACH']);
  assert.deepStrictEqual(thuMuc('gv1@example.com'), ['20_DU-AN', '30_LOP-PHU-TRACH', '40_HOC-VIEN-PHU-TRACH'], 'GV không có 10_LEVEL');
  assert.deepStrictEqual(thuMuc('hv1@example.com'), ['10_LOP-DANG-HOC', '11_LOP-DA-HOC']);
  assert(!tep({ sdma: 'CN_CA_NHAN' }), 'không tạo 90_CA-NHAN');
  assert.strictEqual(Object.keys(D.S.o).length, 9 + 6);
  assert(cot('NGUOI', 'Kết quả Drive').every(x => /đã tạo ổ/.test(x)));
});

nhom('4. Lối tắt đúng nguồn', () => {
  const e1 = 'ef1@example.com', o1 = oCN(e1).id;
  const dich = (oId, cha) => ltTrong(oId, cha).map(t => t.shortcutDetails.targetId).sort();
  assert.deepStrictEqual(dich(o1, tmCN(e1, 'CN_CAP').id), [tmTv('L3').id, tmTv('L2').id].sort(), 'Level: thấy L3 + L2, không thấy L1');
  assert.deepStrictEqual(tenLt(o1, tmCN(e1, 'CN_CAP').id), ['L2 · EF Level 2', 'L3 · EF Level 3']);
  assert.deepStrictEqual(dich(o1, tmCN(e1, 'CN_DA').id), [tmDa('KIND').id]);
  assert.deepStrictEqual(dich(o1, tmCN(e1, 'CN_LOP_PT').id), [tmLop('ME02').id]);
  const sub = tep({ sdma: 'CN_HV_PT_SUB', sdnhom: 'ME02-08' }, o1);
  assert.strictEqual(sub.name, 'ME02-08');
  assert.deepStrictEqual(dich(o1, sub.id), [nop('hv1@example.com', 'ME02').id], 'phụ trách ME02-08 thấy bài hv1');
  assert.deepStrictEqual(tenLt(o1, sub.id), ['K22-901 · HV Một']);
  assert.deepStrictEqual(tenLt(o1, o1), ['00 · Thông tin chung', '05 · Tri thức Raw']);
  assert.strictEqual(ltTrong(o1, o1).find(t => t.name === '05 · Tri thức Raw').shortcutDetails.targetId, tep({ sdma: 'RAW_NG', sdemail: e1 }).id);
  const o2 = oCN('ef2@example.com').id, sub2 = tep({ sdma: 'CN_HV_PT_SUB', sdnhom: 'ME02-07' }, o2);
  assert.deepStrictEqual(dich(o2, sub2.id), [nop('hv2@example.com', 'ME02').id]);
  assert.deepStrictEqual(dich(o2, tmCN('ef2@example.com', 'CN_DA').id), [tmDa('DAO-TAO').id], 'Ban cũng là dự án tham gia');
  const og = oCN('gv1@example.com').id;
  assert.deepStrictEqual(dich(og, tmCN('gv1@example.com', 'CN_LOP_PT').id), [tmLop('PA03').id]);
  assert.deepStrictEqual(tenLt(og, og), ['00 · Thông tin chung', '06 · Tri thức Wiki']);
  const h = 'hv1@example.com', oh = oCN(h).id;
  assert.deepStrictEqual(dich(oh, tmCN(h, 'CN_LOP_DANG').id), [tmLop('ME02').id, tmLop('PA03').id].sort());
  assert.deepStrictEqual(ltTrong(oh, tmCN(h, 'CN_LOP_DA').id), []);
  assert.deepStrictEqual(tenLt(oh, oh), ['00 · Thông tin học viên', '05 · Tri thức Raw', '20 · Hồ sơ học tập']);
  assert.strictEqual(ltTrong(oh, oh).find(t => t.name === '20 · Hồ sơ học tập').shortcutDetails.targetId, tep({ sdma: 'HS_NG', sdemail: h }).id);
  assert.strictEqual(ltTrong(oh, oh).find(t => t.name === '00 · Thông tin học viên').shortcutDetails.targetId, tep({ sdma: 'TTC_HV' }).id);
  const oh2 = oCN('hv2@example.com').id;
  assert.deepStrictEqual(tenLt(oh2, oh2), ['00 · Thông tin học viên', '20 · Hồ sơ học tập'], 'hv2 không tham gia Raw');
  lt(oh).forEach(t => assert(t.properties.sdlt === '1' && t.properties.sdkhoa, 'lối tắt gắn sdlt/sdkhoa'));
});

nhom('5. Quyền thư mục cho nhóm đúng bảng 2.2', () => {
  assert.deepStrictEqual(q(tep({ sdma: 'TTC_EF' }).id), { [sd('all', 'ef')]: 'reader' });
  assert.deepStrictEqual(q(tep({ sdma: 'TTC_HV' }).id), { [sd('all', 'hv')]: 'reader' });
  assert.deepStrictEqual(q(tep({ sdma: 'TTC_EF_1' }).id), {}, 'thư mục con: thừa kế');
  assert.deepStrictEqual(q(tmTv('L3').id), { [sd('L3')]: 'reader', [sd('L2')]: 'reader' }, 'L3: cấp L3 và cao hơn (L1 chưa có nhóm)');
  assert.deepStrictEqual(q(tmTv('L2').id), { [sd('L2')]: 'reader' });
  assert.deepStrictEqual(q(tmDa('KIND').id), { [sd('KIND')]: 'reader', [sd('KIND', 'sua')]: 'writer' });
  assert.deepStrictEqual(q(tmLop('ME02').id), { [sd('ME02')]: 'reader', [sd('ME02', 'pt')]: 'writer' });
  assert.deepStrictEqual(q(tep({ sdma: 'LOP_VIDEO', sdnhom: 'ME02' }).id), {}, 'VIDEO thừa kế');
  const h = 'hv1@example.com';
  // Đợt 2b: quyền theo người cấp cho nhóm riêng sd-u-<Mã hệ thống>, không cho email
  assert.deepStrictEqual(q(tep({ sdma: 'HS_NG', sdemail: h }).id), { [sdU(h)]: 'reader' });
  assert.strictEqual(tep({ sdma: 'HS_NG', sdemail: h }).properties.sdma_u, 'U00004', 'nhãn sdma_u');
  assert.deepStrictEqual(q(nop(h, 'ME02').id), { [sdU(h)]: 'writer', [sd('ME02-08', 'pt')]: 'commenter' });
  assert.deepStrictEqual(q(nop(h, 'PA03').id), { [sdU(h)]: 'writer', [sd('PA03-01', 'pt')]: 'commenter' });
  assert.deepStrictEqual(q(tep({ sdma: 'RAW_NG', sdemail: h }).id), { [sdU(h)]: 'writer' });
  assert.deepStrictEqual(q(tep({ sdma: 'WIKI_NG', sdemail: 'gv1@example.com' }).id), { [sdU('gv1@example.com')]: 'reader' });
  const tl = tep({ sdma: 'HS_TL', sdma_u: 'U00004' });
  assert(tl && tl.name === '00_TAI-LIEU-CUA-TOI' && tl.parents[0] === tep({ sdma: 'HS_NG', sdemail: h }).id, 'HS_TL trong HS_NG');
  assert.deepStrictEqual(q(tl.id), { [sdU(h)]: 'writer' }, 'HS_TL: nhóm riêng writer, không có nhóm phụ trách');
  // mọi lối tắt dẫn tới chỗ chủ ổ có quyền (qua nhóm: kiểm theo nhóm chủ ổ thuộc)
  const nhomCua = e => { const C = ctx.taiDuLieu_(); const co = ctx.dongBoNhom_(C).nhomCo;
    return [e, ctx.emailNhomRieng_(C, C.nguoi[e])].concat(ctx.nhomCuaNguoi_(C, e).map(t => ctx.emailNhom_(C, t.ma, ctx.hauToCua_(t))), [sd('all', 'ef'), sd('all', 'hv')]).filter(x => x === e || co[x]); };
  ctx.P = { ss: bang, nk: [], loi: 0 };
  ['ef1@example.com', 'gv1@example.com', 'hv1@example.com'].forEach(e => {
    const ai = nhomCua(e).filter(x => x === e || !/all-(ef|hv)/.test(x) || (/all-hv/.test(x) ? e.startsWith('hv') : !e.startsWith('hv')));
    lt(oCN(e).id).forEach(t => assert(ai.some(x => D.coQuyen(x, t.shortcutDetails.targetId)), e + ' không mở được ' + t.name));
  });
});

nhom('6. HV khóa chia sẻ (driveMembersOnly true), GV mở, EF (Level Không) khóa', () => {
  assert.strictEqual(oCN('hv1@example.com').restrictions.driveMembersOnly, true);
  assert.strictEqual(oCN('gv1@example.com').restrictions.driveMembersOnly, false);
  assert.strictEqual(oCN('ef1@example.com').restrictions.driveMembersOnly, true);
  assert.strictEqual(oCN('dl1@example.com').restrictions.driveMembersOnly, false, 'Tổ chức: Có');
  Object.values(D.S.o).forEach(o => assert.strictEqual(o.restrictions.sharingFoldersRequiresOrganizerPermission, true));
});

// Đợt 2b: thư chào KHÔNG gửi ngay; xếp hàng, gửi khi đã ≥ 60 phút; tiêu đề/nội dung mới; dùng GmailApp.
nhom('7. Thư chào: xếp hàng khi tạo ổ, gửi một lần sau 60 phút', () => {
  assert.strictEqual(thu.length, 0, 'chưa gửi ngay');
  assert(hen.some(t => t.fn === 'sdThuChaoDenHan'), 'hẹn gửi sau 60 phút');
  ctx.sdThuChaoDenHan();
  assert.strictEqual(thu.length, 0, 'chưa đủ 60 phút');
  quaGio();
  assert.strictEqual(thu.length, 6);
  assert(!hen.some(t => t.fn === 'sdThuChaoDenHan'), 'hết hàng đợi thì xóa hẹn');
  const t = thu.find(x => x.to === 'hv1@example.com');
  assert.strictEqual(t.tieuDe, 'Ổ làm việc của bạn trên EWIT đã sẵn sàng');
  assert(t.than.includes('HV Một') && t.than.includes('https://drive.google.com/drive/folders/' + oCN('hv1@example.com').id));
  assert(/Request access/.test(t.than) && /30 phút/.test(t.than) && /Bộ nhớ dùng chung/.test(t.than) && /Hồ sơ học tập/.test(t.than) && /trả lời thư/.test(t.than));
  assert(!/Hồ sơ học tập/.test(thu.find(x => x.to === 'gv1@example.com').than), 'GV không có đoạn HV');
  assert(/thư chào ✔/.test(cot('NGUOI', 'Kết quả Drive')[dongNguoi('hv1@example.com') - 1]));
  quaGio();
  assert.strictEqual(thu.length, 6, 'không gửi lại');
});

nhom('8. Chạy lại: không đổi gì, không gửi thêm thư', () => {
  const g = D.S.ghi;
  apDung();
  khongLoi();
  const doi = nkMoi().filter(r => ['Quyền', 'Lối tắt', 'Thư mục', 'Ổ cá nhân', 'Ổ gốc', 'Hạn chế ổ', 'Thư chào'].includes(r[2]));
  assert.strictEqual(D.S.ghi, g, 'có lệnh ghi thừa: ' + JSON.stringify(doi));
  assert.strictEqual(doi.length, 0);
  assert.strictEqual(thu.length, 6);
  assert(cot('NGUOI', 'Kết quả Drive').every(x => x === 'ổ ✔'), cot('NGUOI', 'Kết quả Drive').join(' | '));
  xemTruoc();
  assert.strictEqual(D.S.ghi, g);
  assert(cot('NGUOI', 'Kết quả Drive').every(x => x === 'ổ ✔'), 'Xem trước sau khi áp dụng: không còn việc');
});

nhom('9. Đổi Đường dẫn một mã → đổi tên, không tạo mới', () => {
  const r = T.CAU_TRUC.v.find(x => x[0] === 'TTC_EF_1');
  const truoc = tep({ sdma: 'TTC_EF_1' }), soTep = Object.keys(D.S.tep).length;
  r[2] = 'EF/01_GIOI-THIEU-CHUNG';
  apDung();
  khongLoi();
  const sau = tep({ sdma: 'TTC_EF_1' });
  assert.strictEqual(sau.id, truoc.id);
  assert.strictEqual(sau.name, '01_GIOI-THIEU-CHUNG');
  assert.strictEqual(Object.keys(D.S.tep).length, soTep, 'không tạo thêm');
  // chuyển chỗ: sang HOC-VIEN
  r[2] = 'HOC-VIEN/01_GIOI-THIEU-CHUNG';
  apDung();
  assert.strictEqual(tep({ sdma: 'TTC_EF_1' }).parents[0], tep({ sdma: 'TTC_HV' }).id, 'chuyển sang thư mục cha mới');
  r[2] = 'EF/01_GIOI-THIEU';
  apDung();
  assert.strictEqual(tep({ sdma: 'TTC_EF_1' }).parents[0], tep({ sdma: 'TTC_EF' }).id);
  assert.strictEqual(Object.keys(D.S.tep).length, soTep);
});

nhom('10. Đổi phụ trách nhóm nhỏ → lối tắt chuyển người', () => {
  tvDong('ef1@example.com', 'ME02-08')[6] = 'Gỡ';
  T.THANH_VIEN.v.push(tv('ef2@example.com', 'ME02-08', 'Nhóm nhỏ', 'Phụ trách'));
  apDung();
  khongLoi();
  const o1 = oCN('ef1@example.com').id, o2 = oCN('ef2@example.com').id;
  const sub1 = tep({ sdma: 'CN_HV_PT_SUB', sdnhom: 'ME02-08' }, o1);
  assert(sub1, 'thư mục cũ giữ nguyên');
  assert.deepStrictEqual(ltTrong(o1, sub1.id), [], 'ef1 bỏ lối tắt');
  const sub2 = tep({ sdma: 'CN_HV_PT_SUB', sdnhom: 'ME02-08' }, o2);
  assert.deepStrictEqual(ltTrong(o2, sub2.id).map(t => t.shortcutDetails.targetId), [nop('hv1@example.com', 'ME02').id]);
  assert(/\+1/.test(cot('NGUOI', 'Kết quả Drive')[dongNguoi('ef2@example.com') - 1]));
  assert(/−1 lối tắt/.test(cot('NGUOI', 'Kết quả Drive')[dongNguoi('ef1@example.com') - 1]));
});

nhom('11. Lớp PA03 Kết thúc → lối tắt sang Đã học, gỡ writer + commenter ở HS_NOP', () => {
  nhomDong('PA03')[6] = 'Kết thúc';
  apDung();
  khongLoi();
  const h = 'hv1@example.com', oh = oCN(h).id, pa = tmLop('PA03').id;
  assert(ltTrong(oh, tmCN(h, 'CN_LOP_DA').id).some(t => t.shortcutDetails.targetId === pa), 'sang Đã học');
  assert(!ltTrong(oh, tmCN(h, 'CN_LOP_DANG').id).some(t => t.shortcutDetails.targetId === pa), 'bỏ khỏi Đang học');
  assert.deepStrictEqual(q(nop(h, 'PA03').id), {}, 'HS_NOP: chỉ còn xem thừa kế');
  assert(D.coQuyen(sdU(h), nop(h, 'PA03').id), 'vẫn xem được bài cũ (qua nhóm riêng)');
  assert.deepStrictEqual(q(tmLop('PA03').id), { [sd('PA03')]: 'reader', [sd('PA03', 'pt')]: 'writer' }, 'lớp Kết thúc vẫn giữ quyền');
  const og = oCN('gv1@example.com').id;
  assert(ltTrong(og, tmCN('gv1@example.com', 'CN_LOP_PT').id).some(t => t.shortcutDetails.targetId === pa), 'GV vẫn thấy lớp Kết thúc');
  assert.deepStrictEqual(ltTrong(og, tep({ sdma: 'CN_HV_PT_SUB', sdnhom: 'PA03-01' }, og).id), [], 'bỏ lối tắt bài HV khi lớp hết Đang');
});

nhom('12. Lớp PA03 Đóng → gỡ quyền lớp, bỏ lối tắt, không xóa thư mục', () => {
  nhomDong('PA03')[6] = 'Đóng';
  apDung();
  khongLoi();
  const h = 'hv1@example.com', oh = oCN(h).id, pa = tmLop('PA03');
  assert(pa, 'thư mục lớp vẫn còn');
  assert.deepStrictEqual(q(pa.id), {}, 'gỡ quyền nhóm lớp');
  assert(!lt(oh).some(t => t.shortcutDetails.targetId === pa.id), 'HV bỏ lối tắt');
  assert(!lt(oCN('gv1@example.com').id).some(t => t.shortcutDetails.targetId === pa.id), 'GV bỏ lối tắt');
  assert(nop(h, 'PA03'), 'bài nộp vẫn còn');
});

nhom('13. Người Nghỉ "Giữ ổ" → gỡ thành viên, đổi tên ZZ · Nghỉ (một lần)', () => {
  const e = 'ef2@example.com', r = T.NGUOI.v[dongNguoi(e)];
  r[5] = 'Nghỉ';
  T.THANH_VIEN.v.forEach(x => { if (x[0] === e) x[6] = 'Gỡ'; });
  apDung();
  khongLoi();
  const o = oCN(e);
  assert(o, 'ổ vẫn còn');
  assert.strictEqual(o.name, 'ZZ · Nghỉ · MLWIT · EF Hai');
  assert(!q(o.id)[e], 'gỡ khỏi thành viên');
  const g = D.S.ghi;
  apDung();
  assert.strictEqual(oCN(e).name, 'ZZ · Nghỉ · MLWIT · EF Hai', 'không đổi tên lần hai');
  assert.strictEqual(D.S.ghi, g);
});

nhom('14. Người/nhóm ngoài bảng không bị gỡ; người trên bảng tự thêm tay thì bị gỡ; mã ngoài cấu hình chỉ báo', () => {
  const kind = tmDa('KIND');
  D.S.tep[kind.id].q['khach@example.com'] = { role: 'writer', type: 'user' };
  D.S.tep[kind.id].q['nhom-khac@example.com'] = { role: 'reader', type: 'group' };
  D.S.tep[kind.id].q['hv2@example.com'] = { role: 'writer', type: 'user' };
  D.S.tep[kind.id].q[sd('cu')] = { role: 'reader', type: 'group' };
  const la = D.taoTep({ name: 'Cũ', mimeType: MIME_TM, properties: { sdma: 'MA_DA_BO' } }, oG['EWIT · Dự án & Ban'].id);
  apDung();
  khongLoi();
  const k = q(kind.id);
  assert.strictEqual(k['khach@example.com'], 'writer');
  assert.strictEqual(k['nhom-khac@example.com'], 'reader');
  assert(!k['hv2@example.com'], 'người trên bảng: gỡ');
  assert(!k[sd('cu')], 'nhóm sd-: gỡ');
  assert(nkMoi().some(r => r[2] === 'Ngoài bảng' && /khach@example.com/.test(r[4]) && /nhom-khac@example.com/.test(r[4])));
  assert(nkMoi().some(r => r[2] === 'Ngoài cấu hình' && /MA_DA_BO/.test(r[3])));
  assert(D.S.tep[la].trashed === false, 'không xóa');
});

nhom('15. WIKI: writer trên từng tệp (kể cả thư mục con), thư mục chỉ xem', () => {
  const e = 'gv1@example.com', w = tep({ sdma: 'WIKI_NG', sdemail: e });
  const t1 = D.taoTep({ name: 'Bài 1', mimeType: 'application/vnd.google-apps.document' }, w.id);
  const con = D.taoTep({ name: 'Chương 2', mimeType: MIME_TM }, w.id);
  const t2 = D.taoTep({ name: 'Bài 2', mimeType: 'application/vnd.google-apps.document' }, con);
  apDung();
  khongLoi();
  assert.strictEqual(q(t1)[sdU(e)], 'writer');
  assert.strictEqual(q(t2)[sdU(e)], 'writer');
  assert.deepStrictEqual(q(w.id), { [sdU(e)]: 'reader' });
  assert.deepStrictEqual(q(con), {}, 'thư mục con không cấp thêm');
  // rời WIKI → gỡ writer từng tệp, giữ thư mục
  tvDong(e, 'WIKI')[6] = 'Gỡ';
  apDung();
  khongLoi();
  assert(!q(t1)[sdU(e)] && !q(t2)[sdU(e)] && !q(w.id)[sdU(e)], 'gỡ hết');
  assert(tep({ sdma: 'WIKI_NG', sdemail: e }), 'giữ thư mục');
  assert(!lt(oCN(e).id).some(t => t.name === '06 · Tri thức Wiki'), 'bỏ lối tắt Wiki');
});

nhom('16. Tệp mẫu Nhật ký: thiếu mẫu báo "chưa có mẫu"; có mẫu thì chép một lần, HV writer', () => {
  assert(T.NHAT_KY.v.some(r => r[2] === 'Tệp mẫu' && /Chưa có mẫu "Nhật ký trưởng thành"/.test(r[3])));
  const mau = D.taoTep({ name: 'Nhật ký trưởng thành', mimeType: 'application/vnd.google-apps.document' }, tep({ sdma: 'QT_MAU' }).id);
  apDung();
  khongLoi();
  const h = 'hv1@example.com', nk = tep({ sdma: 'HS_NK', sdemail: h });
  assert(nk, 'đã chép');
  assert.strictEqual(nk.parents[0], tep({ sdma: 'HS_NG', sdemail: h }).id);
  assert.strictEqual(nk.name, 'Nhật ký trưởng thành');
  assert.strictEqual(q(nk.id)[sdU(h)], 'writer');
  assert(tep({ sdma: 'HS_NK', sdemail: 'hv2@example.com' }));
  assert(!tep({ sdma: 'HS_NK', sdemail: 'ef1@example.com' }), 'chỉ HV');
  const so = Object.values(D.S.tep).filter(t => (t.properties || {}).sdma === 'HS_NK').length;
  apDung();
  assert.strictEqual(Object.values(D.S.tep).filter(t => (t.properties || {}).sdma === 'HS_NK').length, so, 'không chép lại');
});

nhom('17. Hết giờ → hẹn chạy tiếp; lần sau hoàn tất và xóa hẹn', () => {
  T.NGUOI.v.push(ng('hv3@example.com', 'HV Ba', 'K22-903', 'HV', '', 'Đang', 'U00007'));
  T.THANH_VIEN.v.push(tv('hv3@example.com', 'ME02', 'Lớp'), tv('hv3@example.com', 'ME02-08', 'Nhóm nhỏ'));
  let dem = 0;
  ctx.drHetGio_ = () => ++dem > 30;
  apDung();
  khongLoi();
  assert(nkMoi().some(r => r[3] === 'Chưa xong, sẽ chạy tiếp'), 'báo chưa xong');
  assert.deepStrictEqual(hen.map(t => t.fn).filter(f => f !== 'sdThuChaoDenHan'), ['sdDriveTiep'], 'hẹn sdDriveTiep');
  assert(!oTen('MLWIT · K22-903 · HV Ba'), 'chưa tới ổ hv3');
  assert(cot('NGUOI', 'Kết quả Drive').includes('chưa xử lý, sẽ chạy tiếp'));
  ctx.drHetGio_ = goc_drHetGio_;
  nkTruoc = T.NHAT_KY.v.length;
  ctx.sdDriveTiep();
  khongLoi();
  assert(!hen.some(t => t.fn === 'sdDriveTiep'), 'xóa hẹn khi xong');
  const o3 = oTen('MLWIT · K22-903 · HV Ba');
  assert(o3, 'lần sau hoàn tất');
  assert.strictEqual(T.NGUOI.v[dongNguoi('hv3@example.com')][8], o3.id);
  const o2 = oCN('ef2@example.com'); // ef2 đã nghỉ; phụ trách ME02-08 giờ không còn ai → kiểm hv3 có HS_NOP
  assert(nop('hv3@example.com', 'ME02'));
  assert(o2);
  const g = D.S.ghi;
  apDung();
  assert.strictEqual(D.S.ghi, g, 'sau khi hoàn tất, chạy lại không đổi gì');
  quaGio(); quaGio();
  assert.strictEqual(thu.filter(x => x.to === 'hv3@example.com').length, 1, 'thư chào hv3 một lần (sau 60 phút)');
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
