const fs = require('fs');
const path = require('path');
const util = require('ys-utils');
const dialog = require('inquirer');
const jsbeautifier = require('js-beautify');

module.exports = class UnInstallModule {
  constructor(thread, installer) {
    this.thread = thread;
    this.installer = installer;
  }

  beautiful(str) {
    return jsbeautifier.js_beautify(str, {
      indent_size: 2
    })
  }

  removeCode(file, modal) {
    if (fs.existsSync(file)) {
      const reg = new RegExp(`// plugin:${modal} start[\\s\\S]+// plugin:${modal} end\\n`);
      const content = fs.readFileSync(file, 'utf8');
      const __content = content;
      const _content = content.replace(reg, '');
      if (
        _content.indexOf(`// plugin:${modal} start`) > -1 || 
        _content.indexOf(`// plugin:${modal} end`)   > -1
      ) {
        throw new Error(`从 '${path.basename(file)}' 中删除模块 '${modal}' 失败.`)
      }
      fs.writeFileSync(file, this.beautiful(_content), 'utf8');
      this.thread.on('beforeRollback', async () => {
        this.installer.spinner.debug('*', path.relative(process.cwd(), file));
        fs.writeFileSync(file, __content, 'utf8');
        await this.installer.delay(50);
      });
      this.installer.spinner.success('-', modal);
    }
  }

  async getPluginFromLocal() {
    const pluginsExports = this.getPluginExports();
    const res = [];
    for (const i in pluginsExports) {
      if (pluginsExports[i].package) {
        res.push(`${i}: <${pluginsExports[i].package}>`);
      }
    }
    if (!res.length) {
      throw new Error('没有插件可以卸载');
    }
    this.installer.spinner.warn('选择插件：');
    await new Promise(resolve => this.installer.close(resolve));
    const value = await dialog.prompt({
      type: 'list',
      name: 'plugin',
      message: '从列表中选出您需要卸载的插件？',
      default: null,
      choices: res
    });
    this.installer.open();
    if (!value) {
      throw new Error('你没有选中插件');
    }
    const exec = /^[^:]+:\s\<([^\>]+?)\>/.exec(value.plugin);
    return exec[1];
  }

  getPluginExports() {
    const cwd = this.installer.root;
    const pluginsPath = path.resolve(cwd, 'config/plugin.js');
    if (!fs.existsSync(pluginsPath)) {
      throw new Error('缺少插件配置文件');
    }
    const pluginsExports = util.file.load(pluginsPath);
    if (!pluginsExports) {
      throw new Error('无效的插件文件配置');
    }
    return pluginsExports;
  }

  checkPlugin(name) {
    const pluginsExports = this.getPluginExports();
    let checked = false;
    for (const i in pluginsExports) {
      if (pluginsExports[i].package === name) {
        checked = true;
        break;
      }
    }
    if (!checked) {
      throw new Error('您要卸载的插件', name, '不存在');
    }
  }

  async render(name) {
    const root = this.installer.root;
    const type = this.installer.type;
    if (!root || type !== 'framework') {
      throw new Error('非项目目录无法使用此命令');
    }

    if (!name) {
      name = await this.getPluginFromLocal();
    } else {
      if (!/^ys-pg-/.test(name)) {
        name = 'ys-pg-' + name;
      }
      this.checkPlugin(name);
    }

    this.installer.spinner.name = 'Uninstall Plugin';
    this.installer.spinner.info('正在卸载插件', name, '...');

    const configDir = path.resolve(root, 'config');
    const config_plugin_dev = path.resolve(configDir, 'plugin.dev.js');
    const config_plugin_stable = path.resolve(configDir, 'plugin.stable.js');
    const config_plugin_staging = path.resolve(configDir, 'plugin.staging.js');
    const config_plugin_product = path.resolve(configDir, 'plugin.product.js');
    const plugin = path.resolve(configDir, 'plugin.js');

    this.removeCode(plugin, name);
    this.removeCode(config_plugin_dev, name);
    this.removeCode(config_plugin_stable, name);
    this.removeCode(config_plugin_staging, name);
    this.removeCode(config_plugin_product, name);

    const commandPath = path.resolve(root, 'node_modules', name, '.ys.command.js');
    const PluginPKGPath = path.resolve(root, 'node_modules', name, 'package.json');
    const PluginPKG = util.file.load(PluginPKGPath);
    if (fs.existsSync(commandPath)) {
      let nodePluginExports = util.file.load(commandPath);
      if (nodePluginExports) {
        nodePluginExports = new nodePluginExports(this.thread, this.installer);
      }
      if (nodePluginExports['life:destroyed']) {
        await nodePluginExports['life:destroyed']({
          cwd: root,
          name
        });
      }
      this.installer.spinner.debug('正在卸载模块', '...');
      await this.installer.execScript(
        root, 
        'npm', 'uninstall', 
        name
      );
    }
    
    this.installer.spinner.success('-', name + '@' + PluginPKG.version);
  }
}