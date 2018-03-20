const fs = require('fs');
const dbo = require('ys-dbo');
const path = require('path');
const createCommand = require('./install');
const { error } = require('../../utils');

module.exports = (name, cwd) => {
  new dbo().until(async thread => {
    const configDir = path.resolve(cwd, 'config');
    const config_plugin_dev = path.resolve(configDir, 'plugin.dev.js');
    const config_plugin_stable = path.resolve(configDir, 'plugin.stable.js');
    const config_plugin_staging = path.resolve(configDir, 'plugin.staging.js');
    const config_plugin_product = path.resolve(configDir, 'plugin.product.js');
    const plugin = path.resolve(configDir, 'plugin.js');

    [config_plugin_dev, config_plugin_stable, config_plugin_staging, config_plugin_product, plugin].forEach(file => {
      if (!fs.existsSync(file)) {
        console.error(`由于 '${file}' 文件不存在，所以退出操作`);
        process.exit(1);
      }
    });

    await createCommand(cwd, name);
  }, { error });
}