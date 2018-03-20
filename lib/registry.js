const fs = require('fs');
const path = require('path');
const utils = require('ys-utils');
const log = require('./log');

module.exports = url => {
  const file = path.resolve(process.env.HOME, '.yscli.json');
  const data = utils.file.load(file);
  data.registry = url;
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  log.success('修改源地址成功: ' + url);
}