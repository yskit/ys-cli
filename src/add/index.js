const path = require('path');
const Create = require('ys-cli-package');

module.exports = class AddNewFileModule {
  constructor(thread, installer) {
    this.thread = thread;
    this.installer = installer;
  }

  checkName(name) {
    name = name.replace(/\.js$/i, '');
    if (!/^[a-z][a-z0-9_/]*$/.test(name)) {
      throw new Error('模块命名不规范');
    }
    return name;
  }

  checkOptions(options = {}) {
    let j = 0;
    for (const i in options) {
      if (options[i]) {
        j++;
      }
    }
    if (j > 1) {
      throw new Error('创建的文件模块不能有多个设定，只能是`-c` `-m` `-s`中的一个。');
    }
    return Object.freeze(Object.defineProperty(options, 'length', {
      value: j
    }));
  }

  async render(name, options) {
    const root = this.installer.root;
    const type = this.installer.type;
    if (!root || !type) {
      throw new Error('请在项目文件夹或者插件文件夹下运行此命令！');
    }
    name = this.checkName(name);
    options = this.checkOptions(options);

    const relativePath = path.relative(root, process.cwd());
    const controllerPath = path.resolve(root, 'app/controller');
    const middlewarePath = path.resolve(root, 'app/middleware');
    const servicePath = path.resolve(root, 'app/service');
    const isInControllerDir = relativePath.indexOf('app/controller') === 0;
    const isInMiddlewareDir = relativePath.indexOf('app/middleware') === 0;
    const isInServiceDir = relativePath.indexOf('app/service') === 0;

    if (!isInControllerDir && !isInMiddlewareDir && !isInServiceDir && options.length === 0) {
      throw new Error('请写入需要创建的文件类型，只能是`-c` `-m` `-s`中的一个。');
    }

    let cwd, file;

    if (isInControllerDir) {
      if (options.middleware) {
        cwd = middlewarePath;
        file = 'middleware.js';
      } else if (options.service) {
        cwd = servicePath;
        file = 'service.js';
      } else {
        cwd = process.cwd();
        file = 'controller.js';
      }
    } 
    
    if (isInMiddlewareDir) {
      if (options.controller) {
        cwd = controllerPath;
        file = 'controller.js';
      } else if (options.service) {
        cwd = servicePath;
        file = 'service.js';
      } else {
        cwd = process.cwd();
        file = 'middleware.js';
      }
    }

    if (isInServiceDir) {
      if (options.middleware) {
        cwd = middlewarePath;
        file = 'middleware.js';
      } else if (options.controller) {
        cwd = controllerPath;
        file = 'controller.js';
      } else {
        cwd = process.cwd();
        file = 'service.js';
      }
    }

    if (!cwd) {
      if (options.controller) {
        cwd = controllerPath;
        file = 'controller.js';
      } else if (options.middleware) {
        cwd = middlewarePath;
        file = 'middleware.js';
      } else if (options.service) {
        cwd = servicePath;
        file = 'service.js';
      }
    }

    if (!cwd) {
      throw new Error('未知的文件创建类型');
    }

    const filePath = path.resolve(cwd, name + '.js');
    const basename = path.basename(filePath, '.js');
    const relative = path.relative(process.cwd(), filePath);
    await Create({
      type: 'framework',
      file: file,
      output: filePath,
      data: {
        name: basename
      }
    });

    this.installer.spinner.success('+', relative);
  }
}