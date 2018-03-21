#!/usr/bin/env node

'use strict';

const fs = require('fs');
const app = require('cmdu');
const path = require('path');
const util = require('../lib/utils');
const utils = require('ys-utils');
const log = require('../lib/log');
const packageData = require('../package.json');
const env = process.env;

app.version = packageData.version;
app.language = env.language || 'zh-CN';

util.update(app.version, () => {
  const root = util.findRootPath(process.cwd());

  app.command('registry <url>')
    .describe('使用源地址')
    .action('../lib/registry');
  app.command('delay <time>')
    .describe('检测版本更新时间间隔，单位（天）')
    .action('../lib/delay');

  if (root) {
    app.command('add <name>')
      .option('-c, --controller', '安装一个`controller`模块')
      .option('-m, --middleware', '安装一个`middleware`模块')
      .option('-s, --service', '安装一个`service`模块')
      .describe('添加开发文件')
      .action((name, options) => require('../lib/addone')(name, options, root));

    app.command('install <name>')
      .alias('i')
      .describe('安装一个插件')
      .action(name => require('../lib/addone/plugin')(name, root));

    app.command('uninstall <name>')
      .alias('d')
      .describe('卸载一个插件')
      .action(name => require('../lib/addone/plugin/uninstall')(name, root));
    
    const projectConfigPluginPath = path.resolve(root, 'config/plugin.js');
    if (fs.existsSync(projectConfigPluginPath)) {
      const PluginExports = utils.file.load(projectConfigPluginPath);
      if (PluginExports) {
        for (const plugin in PluginExports) {
          const PluginPackageName = PluginExports[plugin].package;
          const PluginPathName = PluginExports[plugin].path;
          const commandPackagePath = PluginPackageName ? path.resolve(root, 'node_modules', PluginPackageName, 'ys.command.js') : null;
          const commandPathPath = PluginPathName ? path.resolve(root, PluginPathName, 'ys.command.js') : null;
          let commandPath;
          if (PluginPathName && fs.existsSync(commandPathPath)) {
            commandPath = commandPathPath;
          } else if (PluginPackageName && fs.existsSync(commandPackagePath)) {
            commandPath = commandPackagePath;
          }
          if (commandPath) {
            const commandExports = utils.file.load(commandPath);
            if (commandExports && typeof commandExports.command === 'function') {
              commandExports.command({ app, log, root });
            }
          }
        }
      }
    }
  } else {
    app.command('new <project>')
      .describe('创建一个新项目')
      .action('../lib/create');
      
    app.command('create <name>')
      .describe('创建一个开发插件')
      .action('../lib/addone/plugin/create');
  }

  app.listen();
});