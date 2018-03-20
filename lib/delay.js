const fs = require('fs');
const path = require('path');
const utils = require('ys-utils');
const log = require('./log');

module.exports = time => {
  const file = path.resolve(process.env.HOME, '.yscli.json');
  const data = utils.file.load(file);
  data.updateDelayTime = Number(time || 1);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  log.success('修改版本检测时间间隔成功: ' + data.updateDelayTime + '天');
}