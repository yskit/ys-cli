const fs = require('fs-extra');
const path = require('path');
const util = require('ys-utils');
const dialog = require('inquirer');
const Create = require('ys-cli-package');
const installModule = require('../install');
const {
  getSubjectKey,
  whichFrameworker,
  whichRouter
} = require('./questions');

module.exports = class CreateNewProject {
  constructor(thread, installer) {
    this.thread = thread;
    this.installer = installer;
    this.i = 0;
    this.stacks = [];
  }

  get t() {
    return this.stacks.length;
  }

  computed() {
    return parseInt(((++this.i) / this.t) * 100);
  }

  create(options) {
    this.stacks.push(options);
  }

  async runFile(options) {
    await Create(options);
    const file = path.relative(process.cwd(), options.output);
    this.installer.spinner.debug(`[${this.computed()}%]`, '+', file);
    await this.installer.delay(50);
  }

  async render(name) {
    const projectDirPath = path.resolve(process.cwd(), name);
    if (fs.existsSync(projectDirPath)) {
      throw new Error('项目已存在，请更换创建项目的名称！');
    }
    fs.ensureDirSync(projectDirPath);
    this.thread.on('beforeRollback', () => {
      this.installer.spinner.warn('正在回滚项目 ...');
      fs.removeSync(projectDirPath);
      this.installer.spinner.warn('项目回滚成功');
    });

    this.installer.spinner.warn('请选择以下选项，以便创建项目：');
    await new Promise(resolve => this.installer.close(resolve));
    const frameworkAnswer = await dialog.prompt(whichFrameworker.ask);
    const framework = whichFrameworker.reply(frameworkAnswer);
    const routerFields = whichRouter(framework);
    const routerAnswer = await dialog.prompt(routerFields.ask);
    const router = routerFields.reply(routerAnswer);
    this.installer.spinner.name = 'New Project';
    this.installer.open();

    this.create({
      type: 'common',
      file: '.gitignore',
      output: path.resolve(projectDirPath, '.gitignore')
    });

    this.create({
      type: 'common',
      file: 'package.json',
      output: path.resolve(projectDirPath, 'package.json'),
      data: {
        label: name,
        type: 'framework',
        framework
      }
    });

    this.create({
      type: 'framework',
      file: 'index.js',
      output: path.resolve(projectDirPath, 'index.js')
    });

    this.create({
      type: 'framework',
      file: 'app.js',
      output: path.resolve(projectDirPath, 'app.js')
    });

    this.create({
      type: 'framework',
      file: 'agent.js',
      output: path.resolve(projectDirPath, 'agent.js')
    });

    this.create({
      type: 'framework',
      file: 'README.md',
      output: path.resolve(projectDirPath, 'README.md'),
      data: {
        name
      }
    });

    this.create({
      type: 'framework',
      file: 'plugin.js',
      output: path.resolve(projectDirPath, 'config/plugin.js')
    });

    this.create({
      type: 'framework',
      file: 'plugin.env.js',
      output: path.resolve(projectDirPath, 'config/plugin.dev.js')
    });

    this.create({
      type: 'framework',
      file: 'plugin.env.js',
      output: path.resolve(projectDirPath, 'config/plugin.stable.js')
    });

    this.create({
      type: 'framework',
      file: 'plugin.env.js',
      output: path.resolve(projectDirPath, 'config/plugin.staging.js')
    });

    this.create({
      type: 'framework',
      file: 'plugin.env.js',
      output: path.resolve(projectDirPath, 'config/plugin.product.js')
    });

    this.create({
      type: 'framework',
      file: 'options.env.js',
      output: path.resolve(projectDirPath, 'config/options.dev.js')
    });

    this.create({
      type: 'framework',
      file: 'options.env.js',
      output: path.resolve(projectDirPath, 'config/options.stable.js')
    });

    this.create({
      type: 'framework',
      file: 'options.env.js',
      output: path.resolve(projectDirPath, 'config/options.staging.js')
    });

    this.create({
      type: 'framework',
      file: 'options.env.js',
      output: path.resolve(projectDirPath, 'config/options.product.js')
    });

    this.create({
      type: 'framework',
      file: 'controller.js',
      output: path.resolve(projectDirPath, 'app/controller/index.js'),
      data: {
        name: 'default'
      }
    });

    this.create({
      type: 'framework',
      file: 'middleware.js',
      output: path.resolve(projectDirPath, 'app/middleware/index.js')
    });

    this.create({
      type: 'framework',
      file: 'service.js',
      output: path.resolve(projectDirPath, 'app/service/index.js'),
      data: {
        name: 'default'
      }
    });

    for (let i = 0, j = this.t; i < j; i++) {
      await this.runFile(this.stacks[i]);
    }

    await this.installer.delay(50);

    this.installer.spinner.warn('正在安装依赖，请耐心等待 ...');
    await this.installer.execScript(
      projectDirPath, 
      'npm', 'i', 
      'ys-mutify', 'ys-class', framework, 
      '--save',
      '--registry=' + this.installer.registry
    );

    this.installer.root = path.resolve(process.cwd(), name);
    this.installer.type = 'framework';
    const ins = new installModule(this.thread, this.installer);
    await ins.render(router);

    this.installer.spinner.success('恭喜您，项目', name, '安装成功！');
  }
}