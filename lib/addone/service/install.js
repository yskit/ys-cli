const fs = require('fs-extra');
const path = require('path');
const log = require('../../log');

module.exports = (cwd, name, content) => {
  fs.ensureDirSync(cwd);
  const filePath = path.resolve(cwd, name + '.js');
  if (fs.existsSync(filePath)) {
    throw new Error(`无法创建controller文件 '${filePath}'`);
  }
  const _name = name.charAt(0).toUpperCase() + name.substring(1);
  const data = `const Service = require('ys-class');
  
module.exports = class ${_name}Service extends Service {
  constructor(ctx) {
    super(ctx);
  }

  common() {
    return 'Hello World!';
  }
}`;
  fs.writeFileSync(filePath, content || data, 'utf8');
  log.success(`创建service文件成功 - '${filePath}'`);
}