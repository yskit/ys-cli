const fs = require('fs');
const path = require('path');
const log = require('../../log');
const { npmInstall } = require('../../utils');
const utils = require('ys-utils');

module.exports = async (cwd, name) => {
  const plugin_path = path.resolve(cwd, 'config', 'plugin.js');
  const plugin_dev_path = path.resolve(cwd, 'config', 'plugin.dev.js');
  const plugin_stable_path = path.resolve(cwd, 'config', 'plugin.stable.js');
  const plugin_staging_path = path.resolve(cwd, 'config', 'plugin.staging.js');
  const plugin_product_path = path.resolve(cwd, 'config', 'plugin.product.js');

  console.log(`正在安装插件 [${name}] ...`);

  if (!fs.existsSync(plugin_path)) {
    throw new Error('缺少项目文件 ' + plugin_path);
  }
  const PluginJsExports = utils.file.load(plugin_path);
  for (const pluginjs in PluginJsExports) {
    if (PluginJsExports[pluginjs].package === name) {
      throw new Error(`插件 '${name}' 已安装，无需再次安装。`);
    } 
  }

  const modulePath = path.resolve(cwd, 'node_modules', name);
  if (!fs.existsSync(modulePath)) {
    npmInstall(cwd, name);
  }

  const modulePackagePath = path.resolve(modulePath, 'package.json');
  if (!fs.existsSync(modulePackagePath)) {
    throw new Error(`找不到 '${name}' 的 package.json`);
  }

  const modulePackageExports = utils.file.load(modulePackagePath);
  if (!modulePackageExports.plugin) {
    throw new Error(`模块 '${name}' 不是一个有效的插件`);
  }
  const modulePackageExportsForPluginName = modulePackageExports.plugin.name;
  if (!modulePackageExportsForPluginName) {
    throw new Error(`模块 '${name}' 缺少 'plugin.name'`);
  }

  let overwriteConfigs = true, pluginExports;
  const commandPath = path.resolve(modulePath, 'command.plugin.js');
  if (!fs.existsSync(commandPath)) {
    overwriteConfigs = false;
  }
  if (overwriteConfigs) {
    pluginExports = utils.file.load(commandPath);
    if (!pluginExports) {
      overwriteConfigs = false;
    }
  }
  
  let content, data;
  if (fs.existsSync(plugin_path)) {
    data = pluginExports.use 
      ? pluginCode(name, `"${modulePackageExportsForPluginName}": ` + pluginExports.use) 
      : pluginCode(name, `"${modulePackageExportsForPluginName}": ` + JSON.stringify({
        enable: true,
        package: name
      }, null, 2));
    content = fs.readFileSync(plugin_path, 'utf8').replace('// new plugin slot', data);
    fs.writeFileSync(plugin_path, content, 'utf8');
    log.cyan(`  % 修改 '/config/plugin.js' 文件成功。`);
  }
  if (overwriteConfigs) {
    if (fs.existsSync(plugin_dev_path) && (pluginExports.dev || pluginExports.common)) {
      data = pluginCode(name, `"${modulePackageExportsForPluginName}": ` + (pluginExports.dev || pluginExports.common), true);
      content = fs.readFileSync(plugin_dev_path, 'utf8').replace('// new plugin config slot', data);
      fs.writeFileSync(plugin_dev_path, content, 'utf8');
      log.cyan(`  % 修改 '/config/plugin.dev.js' 文件成功。`);
    }
    if (fs.existsSync(plugin_stable_path) && (pluginExports.stable || pluginExports.common)) {
      data = pluginCode(name, `"${modulePackageExportsForPluginName}": ` + (pluginExports.stable || pluginExports.common), true);
      content = fs.readFileSync(plugin_stable_path, 'utf8').replace('// new plugin config slot', data);
      fs.writeFileSync(plugin_stable_path, content, 'utf8');
      log.cyan(`  % 修改 '/config/plugin.stable.js' 文件成功。`);
    }
    if (fs.existsSync(plugin_staging_path) && (pluginExports.staging || pluginExports.common)) {
      data = pluginCode(name, `"${modulePackageExportsForPluginName}": ` + (pluginExports.staging || pluginExports.common), true);
      content = fs.readFileSync(plugin_staging_path, 'utf8').replace('// new plugin config slot', data);
      fs.writeFileSync(plugin_staging_path, content, 'utf8');
      log.cyan(`  % 修改 '/config/plugin.staging.js' 文件成功。`);
    }
    if (fs.existsSync(plugin_product_path) && (pluginExports.product || pluginExports.common)) {
      data = pluginCode(name, `"${modulePackageExportsForPluginName}": ` + (pluginExports.product || pluginExports.common), true);
      content = fs.readFileSync(plugin_product_path, 'utf8').replace('// new plugin config slot', data);
      fs.writeFileSync(plugin_product_path, content, 'utf8');
      log.cyan(`  % 修改 '/config/plugin.product.js' 文件成功。`);
    }
  }
  pluginExports.installer && await pluginExports.installer({
    cwd, 
    log, 
    modulePackageExportsForPluginName, 
    name
  });
  log.success(`插件 '${name}' 安装成功。`);
}

function pluginCode(name, code, isConfig) {
  let data = `// plugin:${name} start\n`;
  data += `  ${code},\n`;
  data += `  // plugin:${name} end\n`;
  data += isConfig ? `  // new plugin config slot` : `  // new plugin slot`;
  return data;
}