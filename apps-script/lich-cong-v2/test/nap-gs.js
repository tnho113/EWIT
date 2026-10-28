// Nạp một hoặc nhiều file .gs vào cùng một ngữ cảnh vm để test logic thuần bằng Node.
// Dùng: const g = napGs('_chung/Chung.gs', 'b-nhap-lieu/DongBoLogic.gs'); g.ngayKey(...)
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const GOC = path.join(__dirname, '..');

function napGs(...files) {
  const ctx = vm.createContext({ console });
  for (const f of files) {
    const code = fs.readFileSync(path.join(GOC, f), 'utf8');
    vm.runInContext(code, ctx, { filename: f });
  }
  return ctx;
}

module.exports = { napGs };
