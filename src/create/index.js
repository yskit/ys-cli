const fs = require('fs-extra');
const path = require('path');
const Create = require('ys-cli-package');

module.exports = class CreateNewPlugin {
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
      throw new Error('插件已存在，请更换创建插件的名称！');
    }

    fs.ensureDirSync(projectDirPath);

    this.thread.on('beforeRollback', () => {
      this.installer.spinner.warn('正在回滚插件 ...');
      fs.removeSync(projectDirPath);
      this.installer.spinner.warn('插件回滚成功');
    });

    this.installer.spinner.name = 'New Plugin';

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
        type: 'plugin',
        cname: name
      }
    });

    this.create({
      type: 'plugin',
      file: 'app.js',
      output: path.resolve(projectDirPath, 'app.js')
    });

    this.create({
      type: 'plugin',
      file: 'agent.js',
      output: path.resolve(projectDirPath, 'agent.js')
    });

    this.create({
      type: 'plugin',
      file: 'README.md',
      output: path.resolve(projectDirPath, 'README.md'),
      data: {
        name
      }
    });

    this.create({
      type: 'plugin',
      file: '.ys.command.js',
      output: path.resolve(projectDirPath, '.ys.command.js'),
      data: {
        name
      }
    });

    for (let i = 0, j = this.t; i < j; i++) {
      await this.runFile(this.stacks[i]);
    }

    await this.installer.delay(50);
    this.installer.spinner.success('恭喜您，插件', name, '创建成功！');
  }
}