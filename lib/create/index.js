const fs = require('fs');
const log = require('../log');
const path = require('path');
const dbo = require('ys-dbo');
const dialog = require('inquirer');
const actions = require('./actions');
const addPluginCommand = require('../addone/plugin/install');
const addControllerCommand = require('../addone/controller/install');
const addServiceCommand = require('../addone/service/install');
const { npmInstall, execScript } = require('../utils');
const { getSubjectKey, whichFrameworker, whichRouter } = require('./questions');
const configs = {};

module.exports = name => {
  new dbo().until(createAction(name, process.cwd()), {
    error(err) {
      log.error(err.message);
      process.exit(1);
    }
  })
}

function createAction(name, cwd) {
  return async thread => {
    const projectDirPath = path.resolve(cwd, name);
    if (fs.existsSync(projectDirPath)) {
      throw new Error('该项目已存在，无法创建。');
    }

    const fileList = [];

    const frameworkAnswer = await dialog.prompt(whichFrameworker.ask);
    const framework = whichFrameworker.reply(frameworkAnswer);
    const routerFields = whichRouter(framework);
    const routerAnswer = await dialog.prompt(routerFields.ask);
    const router = routerFields.reply(routerAnswer);
    
    const configDir = path.resolve(projectDirPath, 'config');
    const appDir = path.resolve(projectDirPath, 'app');
    const appControllerDir = path.resolve(appDir, 'controller');
    const appMiddlewareDir = path.resolve(appDir, 'middleware');
    const appServiceDir = path.resolve(appDir, 'service');
    
    fs.mkdirSync(projectDirPath);
    fs.mkdirSync(configDir);
    fs.mkdirSync(appDir);
    fs.mkdirSync(appControllerDir);
    fs.mkdirSync(appMiddlewareDir);
    fs.mkdirSync(appServiceDir);

    thread.on('beforeRollback', e => {
      if (e && e.stacks) {
        log.error(e.message);
      }
      console.log('过程发生错误，正在回滚...');
      execScript(process.cwd(), 'rm', '-rf', projectDirPath);
      console.log('回滚成功');
    });

    const app_file = path.resolve(projectDirPath, 'app.js');
    const agent_file = path.resolve(projectDirPath, 'agent.js');
    const config_options_dev = path.resolve(configDir, 'options.dev.js');
    const config_options_stable = path.resolve(configDir, 'options.stable.js');
    const config_options_staging = path.resolve(configDir, 'options.staging.js');
    const config_options_product = path.resolve(configDir, 'options.product.js');
    const config_plugin_dev = path.resolve(configDir, 'plugin.dev.js');
    const config_plugin_stable = path.resolve(configDir, 'plugin.stable.js');
    const config_plugin_staging = path.resolve(configDir, 'plugin.staging.js');
    const config_plugin_product = path.resolve(configDir, 'plugin.product.js');
    const plugin = path.resolve(configDir, 'plugin.js');

    fileList.push(actions['/.gitignore'](projectDirPath));
    fileList.push(actions['/package.json'](projectDirPath, name, framework));
    fileList.push(actions['/index.js'](projectDirPath));
    fileList.push(actions['/app.js'](app_file));
    fileList.push(actions['/agent.js'](agent_file));
    fileList.push(actions['/config/options.env.js'](projectDirPath, config_options_dev));
    fileList.push(actions['/config/options.env.js'](projectDirPath, config_options_stable));
    fileList.push(actions['/config/options.env.js'](projectDirPath, config_options_staging));
    fileList.push(actions['/config/options.env.js'](projectDirPath, config_options_product));
    fileList.push(actions['/config/plugin.env.js'](projectDirPath, config_plugin_dev));
    fileList.push(actions['/config/plugin.env.js'](projectDirPath, config_plugin_stable));
    fileList.push(actions['/config/plugin.env.js'](projectDirPath, config_plugin_staging));
    fileList.push(actions['/config/plugin.env.js'](projectDirPath, config_plugin_product));
    fileList.push(actions['/config/plugin.js'](projectDirPath, plugin));

    console.log('项目安装文件列表:');
    fileList.forEach(file => log.cyan(`  # ${file}`));
    console.log('正在安装项目依赖模块...');
    npmInstall(projectDirPath, 'ys-mutify', 'ys-class', framework, router);
    console.log('已安装以下模块:');
    log.green('  + ys-mutify: https://www.npmjs.com/package/ys-mutify');
    log.green('  + ys-class: https://www.npmjs.com/package/ys-class');
    log.green('  + ' + framework + ': https://www.npmjs.com/package/' + framework);
    await addPluginCommand(projectDirPath, router);
    addServiceCommand(appServiceDir, 'index');
    addControllerCommand(appControllerDir, 'index', 'ctx.service.index.common()');
    log.success('恭喜您，项目安装成功。');
    process.exit(0);
  }
}