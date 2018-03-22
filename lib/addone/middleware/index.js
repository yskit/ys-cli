const fs = require('fs-extra');
const path = require('path');
const installer = require('./install');

module.exports = (thread, name, cwd) => {
  const file = path.resolve(cwd, name);
  const dir = path.dirname(file);
  fs.ensureDirSync(dir);
  installer(cwd, name);
}