/** Kiểm thử 25_Nhom.gs (nhóm Google) với AdminDirectory / AdminGroupsSettings giả. Chỉ email @example.com. */
const assert = require('assert');
const { taoMoiTruong, bangMau } = require('./gia-lap');

/** Giả lập AdminDirectory + AdminGroupsSettings. Có nhật ký lệnh ghi và nhóm lưu trong `nhom`. */
function taoGiaLap(nhomCoSan = {}) {
  const nhom = {};
  Object.keys(nhomCoSan).forEach(e => { nhom[e] = { thanhVien: Object.assign({}, nhomCoSan[e]) }; });
  const g = { nhom, ghi: [], cdLoi: {}, cdOk: {} };
  const loiKhongCo = e => new Error('Resource Not Found: groupKey ' + e);
  g.AdminDirectory = {
    Groups: {
      get: e => { if (!nhom[e]) throw loiKhongCo(e); return { email: e }; },
      insert: r => { g.ghi.push(['Groups.insert', r.email, r.name]); nhom[r.email] = { thanhVien: {}, name: r.name }; return r; }
    },
    Members: {
      list: (e, opt) => {
        if (!nhom[e]) throw loiKhongCo(e);
        const ds = Object.keys(nhom[e].thanhVien).map(x => ({ email: x, role: nhom[e].thanhVien[x] }));
        const dau = opt && opt.pageToken ? Number(opt.pageToken) : 0, trang = 2;      // phân trang nhỏ để thử
        const kq = { members: ds.slice(dau, dau + trang) };
        if (dau + trang < ds.length) kq.nextPageToken = String(dau + trang);
        return kq;
      },
      insert: (r, e) => {
        if (g.chuaThay && g.chuaThay[e] > 0) { g.chuaThay[e]--; throw new Error('Resource Not Found: groupKey'); }
        g.ghi.push(['Members.insert', e, r.email, r.role]); nhom[e].thanhVien[r.email] = r.role; return r; },
      remove: (e, x) => { g.ghi.push(['Members.remove', e, x]); delete nhom[e].thanhVien[x]; }
    }
  };
  g.AdminGroupsSettings = {
    Groups: {
      patch: (r, e) => {
        if (g.cdLoi[e] > 0) { g.cdLoi[e]--; throw new Error('Group not ready: ' + e); }
        g.ghi.push(['Settings.patch', e, r.whoCanPostMessage, r.allowExternalMembers]); g.cdOk[e] = r;
      }
    }
  };
  return g;
}

/** Dựng bảng mẫu. */
function taoCanh() {
  const bang = bangMau(), T = bang.tabs;
  T.NHOM.v.push(
    ['L3', 'EF Level 3', 'Level', '', '', 'EWIT', 'Đang'], ['ME02', 'IELTS Mentor 02', 'Lớp', '', 'ME', 'EWIT', 'Đang'],
    ['ME02-08', 'Nhóm 08', 'Nhóm nhỏ', 'ME02', '', 'EWIT', 'Đang'], ['KIND', 'Kind English', 'Dự án', '', '', 'EWIT', 'Đang'],
    ['CU', 'Dự án cũ', 'Dự án', '', '', 'EWIT', 'Ngừng'], ['DONG', 'Lớp đã đóng', 'Lớp', '', '', 'EWIT', 'Đóng']);
  T.NGUOI.v.push(
    ['ef1@example.com', 'EF Một', '', 'EF', 'L3', 'Đang'], ['gv1@example.com', 'GV Một', '', 'GV', '', 'Đang'],
    ['hv1@example.com', 'HV Một', 'K22-001', 'HV', '', 'Đang'], ['hv2@example.com', 'HV Hai', 'K22-002', 'HV', '', 'Đang'],
    ['ef0@example.com', 'EF Chưa nhóm', '', 'EF', '', 'Đang'], ['hv9@example.com', 'HV Nghỉ', 'K22-009', 'HV', '', 'Nghỉ']);
  T.THANH_VIEN.v.push(
    ['hv1@example.com', 'HV Một', 'ME02-08', 'Nhóm nhỏ', 'Thành viên', 'Xem', 'Đang'],
    ['hv2@example.com', 'HV Hai', 'ME02-08', 'Nhóm nhỏ', 'Thành viên', 'Sửa', 'Đang'],
    ['ef1@example.com', 'EF Một', 'ME02-08', 'Nhóm nhỏ', 'Phụ trách', 'Xem', 'Đang'],
    ['ef1@example.com', 'EF Một', 'L3', 'Level', 'Thành viên', 'Xem', 'Đang'],
    ['gv1@example.com', 'GV Một', 'KIND', 'Dự án', 'Thành viên', 'Sửa', 'Đang'],
    ['hv1@example.com', 'HV Một', 'CU', 'Dự án', 'Thành viên', 'Xem', 'Đang'],
    ['hv9@example.com', 'HV Nghỉ', 'ME02-08', 'Nhóm nhỏ', 'Thành viên', 'Xem', 'Gỡ']);
  return bang;
}

function chay(bang, g, tenHam, them = {}) {
  const ctx = taoMoiTruong(bang, Object.assign({ AdminDirectory: g.AdminDirectory, AdminGroupsSettings: g.AdminGroupsSettings }, them));
  ctx[tenHam]();
  return ctx;
}
const cot = (bang, tab, ten, theoMa) => {                   // đọc ô theo cột tên ở tab NHOM
  const v = bang.tabs[tab].v, c = v[0].indexOf(ten), d = v.find(r => r[0] === theoMa);
  return d ? d[c] : undefined;
};
const tv = (g, e) => Object.keys(g.nhom[e] ? g.nhom[e].thanhVien : {}).sort();
const lenhGhi = g => g.ghi.map(x => x[0]);

let dat = 0, truot = 0;
const thu = (ten, fn) => { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } };

thu('Xem trước không gọi lệnh ghi nào, vẫn ghi cột Kết quả/Email nhóm', () => {
  const bang = taoCanh(), g = taoGiaLap();
  chay(bang, g, 'sdNhomXemTruoc');
  assert.deepStrictEqual(g.ghi, []);
  assert.deepStrictEqual(Object.keys(g.nhom), []);
  assert.strictEqual(cot(bang, 'NHOM', 'Email nhóm', 'ME02-08'), 'sd-me02-08@example.com');
  assert.ok(/^sd-me02-08: sẽ tạo/.test(cot(bang, 'NHOM', 'Kết quả', 'ME02-08')));
});

thu('Áp dụng: tạo đúng nhóm theo hậu tố, chỉ khi có người', () => {
  const bang = taoCanh(), g = taoGiaLap();
  chay(bang, g, 'sdNhomApDung');
  assert.deepStrictEqual(tv(g, 'sd-me02-08@example.com'), ['hv1@example.com']);
  assert.deepStrictEqual(tv(g, 'sd-me02-08-sua@example.com'), ['hv2@example.com']);
  assert.deepStrictEqual(tv(g, 'sd-me02-08-pt@example.com'), ['ef1@example.com']);
  assert.deepStrictEqual(tv(g, 'sd-kind-sua@example.com'), ['gv1@example.com']);
  assert.deepStrictEqual(tv(g, 'sd-l3@example.com'), ['ef1@example.com']);
  const tao = g.ghi.filter(x => x[0] === 'Groups.insert').map(x => x[1]).sort();
  assert.deepStrictEqual(tao, ['sd-all-ef@example.com', 'sd-all-hv@example.com', 'sd-kind-sua@example.com', 'sd-l3@example.com',
    'sd-me02-08-pt@example.com', 'sd-me02-08-sua@example.com', 'sd-me02-08@example.com']);
  assert.strictEqual(g.nhom['sd-me02-08-pt@example.com'].name, 'Nhóm 08 · Phụ trách');
  assert.strictEqual(g.nhom['sd-me02-08-sua@example.com'].name, 'Nhóm 08 · Sửa');
  assert.strictEqual(g.cdOk['sd-l3@example.com'].whoCanPostMessage, 'ALL_MANAGERS_CAN_POST');
  assert.strictEqual(g.cdOk['sd-l3@example.com'].allowExternalMembers, 'true');
  assert.strictEqual(cot(bang, 'NHOM', 'Email nhóm', 'ME02-08'), 'sd-me02-08@example.com');
  assert.strictEqual(cot(bang, 'NHOM', 'Email nhóm', 'ME02'), '', 'lớp không ai trực tiếp: không có nhóm');
  assert.strictEqual(cot(bang, 'NHOM', 'Kết quả', 'ME02-08'), 'sd-me02-08: tạo +1; -sua: tạo +1; -pt: tạo +1');
});

thu('sd-all-ef / sd-all-hv: chỉ người có ổ cá nhân', () => {
  const bang = taoCanh(), g = taoGiaLap();
  chay(bang, g, 'sdNhomApDung');
  assert.deepStrictEqual(tv(g, 'sd-all-ef@example.com'), ['ef1@example.com', 'gv1@example.com']);    // ef0 chưa nhóm: không
  assert.deepStrictEqual(tv(g, 'sd-all-hv@example.com'), ['hv1@example.com', 'hv2@example.com']);    // hv9 Nghỉ: không
});

thu('Nhóm Đóng/Ngừng: gỡ hết người trên bảng; người ngoài bảng và OWNER giữ', () => {
  const bang = taoCanh();
  bang.tabs.THANH_VIEN.v.push(['hv2@example.com', 'HV Hai', 'DONG', 'Lớp', 'Thành viên', 'Xem', 'Đang']);   // Đóng → rỗng
  const g = taoGiaLap({
    'sd-cu@example.com': { 'hv1@example.com': 'MEMBER', 'la@gmail.com': 'MEMBER', 'admin@example.com': 'OWNER', 'ef1@example.com': 'OWNER' },
    'sd-dong@example.com': { 'hv2@example.com': 'MEMBER', 'hv1@example.com': 'MEMBER' }
  });
  chay(bang, g, 'sdNhomApDung');
  assert.deepStrictEqual(tv(g, 'sd-cu@example.com'), ['admin@example.com', 'ef1@example.com', 'la@gmail.com']);
  assert.deepStrictEqual(tv(g, 'sd-dong@example.com'), []);
  assert.ok(/ngoài bảng 1/.test(cot(bang, 'NHOM', 'Kết quả', 'CU')));
  assert.ok(!g.ghi.some(x => x[0] === 'Members.remove' && (x[2] === 'la@gmail.com' || x[2] === 'ef1@example.com' || x[2] === 'admin@example.com')));
  assert.strictEqual(g.ghi.filter(x => x[0] === 'Groups.insert' && /sd-cu|sd-dong/.test(x[1])).length, 0, 'không tạo nhóm cho nhóm đóng');
});

thu('Đổi quyền Xem → Sửa: chuyển nhóm; người lạ giữ; thêm thiếu', () => {
  const bang = taoCanh();
  const g = taoGiaLap({
    'sd-me02-08@example.com': { 'hv1@example.com': 'MEMBER', 'hv2@example.com': 'MEMBER', 'la@gmail.com': 'MEMBER' },   // hv2 đang ở Xem, nay là Sửa
    'sd-me02-08-sua@example.com': {}
  });
  chay(bang, g, 'sdNhomApDung');
  assert.deepStrictEqual(tv(g, 'sd-me02-08@example.com'), ['hv1@example.com', 'la@gmail.com']);
  assert.deepStrictEqual(tv(g, 'sd-me02-08-sua@example.com'), ['hv2@example.com']);
  assert.ok(g.ghi.some(x => x[0] === 'Members.remove' && x[1] === 'sd-me02-08@example.com' && x[2] === 'hv2@example.com'));
  assert.ok(!g.ghi.some(x => x[0] === 'Members.remove' && x[2] === 'la@gmail.com'));
  assert.ok(/−1/.test(cot(bang, 'NHOM', 'Kết quả', 'ME02-08')) && /ngoài bảng 1/.test(cot(bang, 'NHOM', 'Kết quả', 'ME02-08')));
  assert.strictEqual(g.nhom['sd-me02-08@example.com'].thanhVien['hv1@example.com'], 'MEMBER');
});

thu('Nhóm vừa tạo chưa thấy ngay: chờ rồi thêm thành viên được, không báo lỗi', () => {
  const bang = taoCanh(), g = taoGiaLap();
  g.chuaThay = { 'sd-l3@example.com': 2 };            // 2 lần đầu Google báo "không tìm thấy nhóm"
  chay(bang, g, 'sdNhomApDung');
  assert.deepStrictEqual(tv(g, 'sd-l3@example.com'), ['ef1@example.com']);
  assert.ok(!bang.tabs.NHAT_KY.v.some(r => r[2] === 'LỖI'), 'không được có LỖI');
});

thu('Phân trang Members.list (nhóm >2 người) đọc đủ', () => {
  const bang = taoCanh();
  const g = taoGiaLap({ 'sd-me02-08@example.com': { 'a@gmail.com': 'MEMBER', 'b@gmail.com': 'MEMBER', 'c@gmail.com': 'MEMBER', 'hv1@example.com': 'MEMBER' } });
  chay(bang, g, 'sdNhomApDung');
  assert.ok(!g.ghi.some(x => x[0] === 'Members.insert' && x[1] === 'sd-me02-08@example.com'), 'hv1 ở trang sau, không thêm trùng');
  assert.ok(/ngoài bảng 3/.test(cot(bang, 'NHOM', 'Kết quả', 'ME02-08')));
});

thu('Cài đặt nhóm lỗi lần đầu → lần sau đặt lại; xong thì thôi', () => {
  const bang = taoCanh(), g = taoGiaLap();
  g.cdLoi['sd-l3@example.com'] = 1;
  // PropertiesService dùng chung giữa 2 lượt: lấy từ ctx đầu
  const ctx1 = chay(bang, g, 'sdNhomApDung');
  assert.ok(!g.cdOk['sd-l3@example.com'], 'lần 1 lỗi');
  assert.ok(g.cdOk['sd-kind-sua@example.com']);
  assert.ok(/đặt cài đặt sau/.test(cot(bang, 'NHOM', 'Kết quả', 'L3')));
  assert.ok(ctx1.PropertiesService.getScriptProperties().getProperty('NHOM_CAIDAT_sd-kind-sua@example.com') === 'ok');
  assert.strictEqual(ctx1.PropertiesService.getScriptProperties().getProperty('NHOM_CAIDAT_sd-l3@example.com'), null);
  // lượt 2 cùng PropertiesService
  const ctx2 = taoMoiTruong(bang, { AdminDirectory: g.AdminDirectory, AdminGroupsSettings: g.AdminGroupsSettings, PropertiesService: ctx1.PropertiesService });
  g.ghi.length = 0;
  ctx2.sdNhomApDung();
  assert.deepStrictEqual(g.ghi.map(x => x.slice(0, 2)), [['Settings.patch', 'sd-l3@example.com']], 'chỉ đặt lại nhóm lỗi, không lệnh nào khác');
  assert.ok(g.cdOk['sd-l3@example.com']);
  assert.strictEqual(cot(bang, 'NHOM', 'Kết quả', 'L3'), 'không đổi');
});

thu('Chạy lại không đổi gì', () => {
  const bang = taoCanh(), g = taoGiaLap();
  const ctx1 = chay(bang, g, 'sdNhomApDung');
  g.ghi.length = 0;
  const ctx2 = taoMoiTruong(bang, { AdminDirectory: g.AdminDirectory, AdminGroupsSettings: g.AdminGroupsSettings, PropertiesService: ctx1.PropertiesService });
  ctx2.sdNhomApDung();
  assert.deepStrictEqual(g.ghi, []);
  assert.strictEqual(cot(bang, 'NHOM', 'Kết quả', 'ME02-08'), 'không đổi');
  ctx2.sdNhomXemTruoc();
  assert.deepStrictEqual(g.ghi, []);
});

thu('nhomCo đúng (có thật hoặc sẽ tạo; không có người thì không)', () => {
  const bang = taoCanh(), g = taoGiaLap({ 'sd-cu@example.com': {}, 'sd-me02@example.com': {} });
  const ctx = taoMoiTruong(bang, { AdminDirectory: g.AdminDirectory, AdminGroupsSettings: g.AdminGroupsSettings });
  const lay = thuCheDo => {
    let kq; ctx.chayPhien_('t', () => { ctx.P.thu = thuCheDo; kq = ctx.dongBoNhom_(ctx.taiDuLieu_()); }); return kq;
  };
  const xt = lay(true);
  assert.deepStrictEqual(Object.keys(xt.nhomCo).sort(), ['sd-all-ef@example.com', 'sd-all-hv@example.com', 'sd-cu@example.com', 'sd-kind-sua@example.com',
    'sd-l3@example.com', 'sd-me02-08-pt@example.com', 'sd-me02-08-sua@example.com', 'sd-me02-08@example.com', 'sd-me02@example.com']);
  assert.ok(Object.values(xt.nhomCo).every(v => v === true) && xt.chuaXong === false);
  assert.deepStrictEqual(g.ghi, []);
  const ap = lay(false);
  assert.deepStrictEqual(Object.keys(ap.nhomCo).sort(), Object.keys(xt.nhomCo).sort());
});

thu('Lỗi tạo nhóm: ghi LỖI, nhóm đó không vào nhomCo; hết giờ → chuaXong + hẹn giờ', () => {
  const bang = taoCanh(), g = taoGiaLap();
  const ins = g.AdminDirectory.Groups.insert;
  g.AdminDirectory.Groups.insert = r => { if (r.email === 'sd-l3@example.com') throw new Error('Quota'); return ins(r); };
  const hen = [];
  const ctx = taoMoiTruong(bang, { AdminDirectory: g.AdminDirectory, AdminGroupsSettings: g.AdminGroupsSettings,
    ScriptApp: { newTrigger: ten => ({ timeBased() { return this; }, after() { return this; }, create() { hen.push(ten); } }), getProjectTriggers: () => [], deleteTrigger() {} } });
  let kq; ctx.chayPhien_('t', () => { ctx.P.thu = false; kq = ctx.dongBoNhom_(ctx.taiDuLieu_()); });
  assert.ok(!kq.nhomCo['sd-l3@example.com'] && kq.nhomCo['sd-kind-sua@example.com']);
  assert.ok(/LỖI tạo/.test(cot(bang, 'NHOM', 'Kết quả', 'L3')));
  assert.deepStrictEqual(hen, []);
  ctx.NH_GIOI_HAN = -1;                                       // hết giờ ngay
  ctx.chayPhien_('t', () => { ctx.P.thu = false; kq = ctx.dongBoNhom_(ctx.taiDuLieu_()); });
  assert.strictEqual(kq.chuaXong, true);
  assert.deepStrictEqual(hen, ['sdNhomApDung']);
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
