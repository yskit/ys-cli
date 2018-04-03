const fs = require('fs');
const path = require('path');
const utils = require('ys-utils');
const Create = require('ys-cli-package');
const is = require('is-type-of');
const jsbeautifier = require('js-beautify');

module.exports = class InstallModule {
  constructor(thread, installer) {
    this.thread = thread;
    this.installer = installer;
  }

  beautiful(str) {
    return jsbeautifier.js_beautify(str, {
      indent_size: 2
    })
  }

  pluginCode(name, code, isConfig) {
    let data = `// plugin:${name} start\n`;
    data += `  ${code},\n`;
    data += `  // plugin:${name} end\n`;
    data += isConfig ? `  // new plugin config slot` : `  // new plugin slot`;
    return data;
  }

  getEnvConfig(pluginExports, env) {
    let res;

    const name = `env:${env}`;
    if (pluginExports[name]) {
      res = pluginExports[name]();
    }
    if (!res) {
      if (pluginExports['env:common']) {
        res = pluginExports['env:common']();
      }
    }

    if (typeof res === 'object') {
      res = JSON.stringify(res, null, 2);
    }

    return res;
  }

  async render(name) {
    const root = this.installer.root;
    const type = this.installer.type;
    if (!root || type !== 'framework') {
      throw new Error('非项目目录无法使用此命令');
    }

    if (!/^ys-pg-/.test(name) && !/^@/.test(name)) {
      name = 'ys-pg-' + name;
    }

    this.installer.spinner.name = 'Install Plugin';

    const cwd = this.installer.root;
    const plugin_path = path.resolve(cwd, 'config', 'plugin.js');
    const plugin_dev_path = path.resolve(cwd, 'config', 'plugin.dev.js');
    const plugin_stable_path = path.resolve(cwd, 'config', 'plugin.stable.js');
    const plugin_staging_path = path.resolve(cwd, 'config', 'plugin.staging.js');
    const plugin_product_path = path.resolve(cwd, 'config', 'plugin.product.js');

    if (!fs.existsSync(plugin_path)) {
      throw new Error('项目已损坏，无法找到插件配置文件！');
    }

    const PluginJsExports = utils.file.load(plugin_path);
    for (const pluginjs in PluginJsExports) {
      if (PluginJsExports[pluginjs].package === name) {
        throw new Error(`插件 '${name}' 已安装，无需再次安装。`);
      } 
    }

    const modulePath = path.resolve(cwd, 'node_modules', name);
    if (!fs.existsSync(modulePath)) {
      this.installer.spinner.warn('正在安装插件 ...');
      console.log(cwd, 
        'npm', 'i', 
        name, 
        '--save',
        '--registry=' + this.installer.registry)
      await this.installer.execScript(
        cwd, 
        'npm', 'i', 
        name, 
        '--save',
        '--registry=' + this.installer.registry
      );
      this.thread.on('beforeRollback', async () => {
        this.installer.spinner.warn('正在卸载插件 ...');
        await this.installer.execScript(
          cwd, 
          'npm', 'uninstall', 
          name
        );
      });
    }

    this.installer.spinner.debug('正在校验插件 ...');
    const modulePackagePath = path.resolve(modulePath, 'package.json');
    const modulePackageExports = utils.file.load(modulePackagePath);

    if (!modulePackageExports.plugin) {
      throw new Error(`模块 '${name}' 不是一个有效的插件`);
    }

    const modulePackageExportsForPluginName = modulePackageExports.plugin.name;
    if (!modulePackageExportsForPluginName) {
      throw new Error(`模块 '${name}' 缺少 'plugin.name'`);
    }
    
    let overwriteConfigs = true, pluginExports;
    const commandPath = path.resolve(modulePath, '.ys.command.js');

    if (!fs.existsSync(commandPath)) {
      overwriteConfigs = false;
    }

    if (overwriteConfigs) {
      pluginExports = utils.file.load(commandPath);
      if (!pluginExports) {
        overwriteConfigs = false;
      }
    }

    if (overwriteConfigs && !is.class(pluginExports)) {
      throw new Error('`.ys.command.js` 必须返回一个`class`对象');
    }

    if (pluginExports) {
      pluginExports = new pluginExports(this.thread, this.installer);
    }

    let content, data, envResult;

    if (pluginExports['options:plugin']) {
      data = pluginExports['options:plugin']();
      if (typeof data === 'object') {
        data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${JSON.stringify(data, null, 2)}`);
      } else if (typeof data === 'string') {
        data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${data}`);
      }
    }

    if (!data) {
      data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${JSON.stringify({
        enable: true,
        package: name,
        agent: ['agent'],
        dependencies: []
      }, null, 2)}`);
    }

    const a = content = fs.readFileSync(plugin_path, 'utf8');
    fs.writeFileSync(plugin_path, this.beautiful(content.replace('// new plugin slot', data)), 'utf8');
    this.thread.on('beforeRollback', async () => {
      this.installer.spinner.debug('*', path.relative(process.cwd(), plugin_path));
      fs.writeFileSync(plugin_path, a, 'utf8');
      await this.installer.delay(50);
    });
    this.installer.spinner.debug('@', path.relative(process.cwd(), plugin_path));
    await this.installer.delay(50);

    if (overwriteConfigs) {
      envResult = this.getEnvConfig(pluginExports, 'dev');
      if (fs.existsSync(plugin_dev_path) && envResult) {
        data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${envResult}`, true);
        const b = content = fs.readFileSync(plugin_dev_path, 'utf8');
        fs.writeFileSync(plugin_dev_path, this.beautiful(content.replace('// new plugin config slot', data)), 'utf8');
        this.thread.on('beforeRollback', async () => {
          this.installer.spinner.debug('*', path.relative(process.cwd(), plugin_dev_path));
          fs.writeFileSync(plugin_dev_path, b, 'utf8');
          await this.installer.delay(50);
        });
        this.installer.spinner.debug('@', path.relative(process.cwd(), plugin_dev_path));
        await this.installer.delay(50);
      }

      envResult = this.getEnvConfig(pluginExports, 'stable');
      if (fs.existsSync(plugin_stable_path) && envResult) {
        data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${envResult}`, true);
        const c = content = fs.readFileSync(plugin_stable_path, 'utf8');
        fs.writeFileSync(plugin_stable_path, this.beautiful(content.replace('// new plugin config slot', data)), 'utf8');
        this.thread.on('beforeRollback', async () => {
          this.installer.spinner.debug('*', path.relative(process.cwd(), plugin_stable_path));
          fs.writeFileSync(plugin_stable_path, c, 'utf8');
          await this.installer.delay(50);
        });
        this.installer.spinner.debug('@', path.relative(process.cwd(), plugin_stable_path));
        await this.installer.delay(50);
      }

      envResult = this.getEnvConfig(pluginExports, 'staging');
      if (fs.existsSync(plugin_staging_path) && envResult) {
        data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${envResult}`, true);
        const d = content = fs.readFileSync(plugin_staging_path, 'utf8');
        fs.writeFileSync(plugin_staging_path, this.beautiful(content.replace('// new plugin config slot', data)), 'utf8');
        this.thread.on('beforeRollback', async () => {
          this.installer.spinner.debug('*', path.relative(process.cwd(), plugin_staging_path));
          fs.writeFileSync(plugin_staging_path, d, 'utf8');
          await this.installer.delay(50);
        });
        this.installer.spinner.debug('@', path.relative(process.cwd(), plugin_staging_path));
        await this.installer.delay(50);
      }

      envResult = this.getEnvConfig(pluginExports, 'product');
      if (fs.existsSync(plugin_product_path) && envResult) {
        data = this.pluginCode(name, `"${modulePackageExportsForPluginName}": ${envResult}`, true);
        const e = content = fs.readFileSync(plugin_product_path, 'utf8');
        fs.writeFileSync(plugin_product_path, this.beautiful(content.replace('// new plugin config slot', data)), 'utf8');
        this.thread.on('beforeRollback', async () => {
          this.installer.spinner.debug('*', path.relative(process.cwd(), plugin_product_path));
          fs.writeFileSync(plugin_product_path, e, 'utf8');
          await this.installer.delay(50);
        });
        this.installer.spinner.debug('@', path.relative(process.cwd(), plugin_product_path));
        await this.installer.delay(50);
      }
    }

    if (pluginExports['life:created']) {
      await pluginExports['life:created']({
        cwd, 
        cname: modulePackageExportsForPluginName, 
        name
      });
    }

    await this.installer.delay(50);
    this.installer.spinner.success('+', name + '@' + modulePackageExports.version);
  }
}