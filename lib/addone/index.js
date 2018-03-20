const addoneController = require('./controller');
const addoneMiddleware = require('./middleware');
const addoneService = require('./service');
const dbo = require('ys-dbo');
const util = require('../utils');
const path = require('path');

module.exports = (name, options, root) => {
  new dbo().until(async thread => {
    name = name.replace(/\.js$/i, '');
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new Error('模块命名不规范');
    }
    
    const relativePath = path.relative(root, process.cwd());
    const controllerPath = path.resolve(root, 'app/controller');
    const middlewarePath = path.resolve(root, 'app/middleware');
    const servicePath = path.resolve(root, 'app/service');
    const isInControllerDir = relativePath.indexOf('app/controller') === 0;
    const isInMiddlewareDir = relativePath.indexOf('app/middleware') === 0;
    const isInServiceDir = relativePath.indexOf('app/service') === 0;

    if (isInControllerDir) {
      return await addoneController(thread, name, process.cwd());
    }

    if (isInMiddlewareDir) {
      return await addoneMiddleware(thread, name, process.cwd());
    }

    if (isInServiceDir) {
      return await addoneService(thread, name, process.cwd());
    }

    if (!options.controller && !options.middleware && !options.service) {
      throw new Error('错误的文件创建目录');
    }

    if (options.controller) {
      return await addoneController(thread, name, controllerPath);
    }
    if (options.middleware) {
      return await addoneMiddleware(thread, name, middlewarePath);
    }
    if (options.service) {
      return await addoneService(thread, name, servicePath);
    }

  }, { error: util.error });
}