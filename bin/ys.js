#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('ys-utils');
const Installer = require('../src/installer');
const installer = new Installer();

installer.checkInstallize(err => {
  if (err) {
    installer.spinner.error(err.message);
    return installer.close(() => process.exit(1));
  }

  installer.spinner.info('正在加载命令 ...');

  // 框架和插件共有命令
  installer.switcher('framework', 'plugin', app => {
    app.command('add <name>')
      .option('-c, --controller', '安装一个`controller`模块')
      .option('-m, --middleware', '安装一个`middleware`模块')
      .option('-s, --service', '安装一个`service`模块')
      .describe('添加开发文件')
      .action(installer.task('../src/add/index'));
  });

  installer.switcher('framework', app => {
    app.command('install <name>')
      .alias('i')
      .describe('安装一个插件')
      .action(installer.task('../src/install/index'));

    app.command('uninstall [name]')
      .alias('d')
      .describe('卸载一个插件')
      .action(installer.task('../src/uninstall/index'));
  });

  /**
   * 外部命令
   * @command ys new <name> 创建新的项目
   * @command ys create <name> 创建新的插件
   */
  installer.switcher('noop', app => {
    app.command('new <name>')
      .describe('创建一个新项目')
      .action(installer.task('../src/new/index'));
    app.command('create <name>')
      .describe('创建一个新的插件')
      .action(installer.task('../src/create/index'));
  });

  /**
   * 通用命令
   * @option -R, --registry [url] 修改NPM源地址
   * @option -T, --delay [time] 延迟检测时间
   */
  installer.switcher(app => {
    app.command('*')
      .describe('默认操作')
      .option('-R, --registry [url]', '修改NPM源地址')
      .option('-T, --delay [time]', '延迟检测时间', Number)
      .action(installer.task('../src/index'));
  });

  /**
   * 插件命令集成
   * @since v1.0.31
   */
  if (installer.type && installer.root) {
    const pluginListPath = path.resolve(installer.root, 'config/plugin.js');
    if (fs.existsSync(pluginListPath)) {
      const PluginListExports = util.file.load(pluginListPath);
      if (PluginListExports) {
        const keys = Object.keys(PluginListExports);
        let i = keys.length;
        while (i--) {
          const key = keys[i];
          const item = PluginListExports[key];
          const pluginPath = item.path;
          const pluginPackage = item.package;
          let itemCommandExports;

          if (pluginPath) {
            itemCommandExports = util.file.load(path.resolve(installer.root, pluginPath, '.ys.command.js'));
          } else if (pluginPackage) {
            itemCommandExports = util.file.load(path.resolve(installer.root, 'node_modules', pluginPackage, '.ys.command.js'));
          }

          if (itemCommandExports) {
            if (itemCommandExports['command:framework']) {
              installer.switcher('framework', app => itemCommandExports['command:framework'](app, installer));
            }
            if (itemCommandExports['command:plugin']) {
              installer.switcher('plugin', app => itemCommandExports['command:plugin'](app, installer));
            }
            if (itemCommandExports['command:noop']) {
              installer.switcher('noop', app => itemCommandExports['command:noop'](app, installer));
            }
            if (itemCommandExports['command:common']) {
              installer.switcher(app => itemCommandExports['command:common'](app, installer));
            }
          }
        }
      }
    }
  }
});