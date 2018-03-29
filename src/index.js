const util = require('ys-utils');

module.exports = class Registry {
  constructor(thread, installer) {
    this.thread = thread;
    this.installer = installer;
  }

  async render(options) {
    if (options.registry) {
      this.installer.configs.registry = options.registry;
    }
    if (options.delay) {
      this.installer.configs.updateDelayTime = options.delay;
    }
    if (options.registry || options.delay) {
      this.installer.writeData(this.installer.yscliPath, this.installer.configs);
      this.installer.spinner.success(`[${this.installer.yscliPath}]`, '修改配置成功！');
    } else {
      this.installer.spinner.success('Nothing to do, exit.');
      await new Promise(resolve => this.installer.close(resolve));
      process.exit(0);
    }
  }
}