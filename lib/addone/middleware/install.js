const fs = require('fs-extra');
const path = require('path');
const log = require('../../log');

module.exports = (cwd, name, content) => {
  fs.ensureDirSync(cwd);
  const filePath = path.resolve(cwd, name + '.js');
  if (fs.existsSync(filePath)) {
    throw new Error(`无法创建controller文件 '${filePath}'`);
  }
  const data = `module.exports = app => {
  return async (ctx, next) => {
    ${content || ''}
    await next();
  }
}`;
  fs.writeFileSync(filePath, content || data, 'utf8');
  log.success(`创建middleware文件成功 - '${filePath}'`);
}