const fs = require('fs');
const dbo = require('ys-dbo');
const path = require('path');
const util = require('ys-utils');
const log = require('../../log');
const { error, npmUnInstall } = require('../../utils');

module.exports = (name, cwd) => {
  new dbo().until(async thread => {
    const configDir = path.resolve(cwd, 'config');
    const config_plugin_dev = path.resolve(configDir, 'plugin.dev.js');
    const config_plugin_stable = path.resolve(configDir, 'plugin.stable.js');
    const config_plugin_staging = path.resolve(configDir, 'plugin.staging.js');
    const config_plugin_product = path.resolve(configDir, 'plugin.product.js');
    const plugin = path.resolve(configDir, 'plugin.js');

    let overwriteConfigs = true, pluginExports;
    const commandPath = path.resolve(cwd, 'node_modules', name, 'ys.command.js');
    if (!fs.existsSync(commandPath)) {
      overwriteConfigs = false;
    }
    if (overwriteConfigs) {
      pluginExports = util.file.load(commandPath);
      if (!pluginExports) {
        overwriteConfigs = false;
      }
    }

    if (overwriteConfigs && pluginExports.uninstaller) {
      await pluginExports.uninstaller({
        cwd, 
        log, 
        name
      });
    }

    npmUnInstall(cwd, name);
    removeCode(config_plugin_dev, name);
    removeCode(config_plugin_stable, name);
    removeCode(config_plugin_staging, name);
    removeCode(config_plugin_product, name);
    removeCode(plugin, name);

    log.success(`卸载插件 ${name} 成功`);
  }, { error });
}

function removeCode(file, modal) {
  if (fs.existsSync(file)) {
    const reg = new RegExp(`// plugin:${modal} start[\\s\\S]+// plugin:${modal} end\\n`);
    const content = fs.readFileSync(file, 'utf8');
    const _content = content.replace(reg, '');
    if (content === _content) {
      throw new Error(`从 '${path.basename(file)}' 中删除模块 '${modal}' 失败.`)
    }
    fs.writeFileSync(file, _content, 'utf8');
    log.yellow(`从 '${path.basename(file)}' 中删除模块 '${modal}' 成功.`);
  }
}