const fs = require('fs');
const path = require('path');
const dbo = require('ys-dbo');
const util = require('ys-utils');
const request = require('request');
const Spinner = require('ys-spinner');
const Pkg = require('../package.json');
const {
  spawn
} = require('child_process');
const compare = require('node-version-compare');
const is = require('is-type-of');
const app = require('cmdu');

module.exports = class Installizer {
  constructor() {
    this.stacks = {
      common: [],
      noop: [],
      framework: [],
      plugin: []
    };
    this.pkg = Pkg;
    this.spinner = new Spinner();
    this.configs = {
      updateTimeStamp: Date.now(),
      registry: 'taobao',
      updateDelayTime: 1
    }

    this.registries = {
      taobao: 'https://registry.npm.taobao.org',
      npm: 'https://registry.npmjs.org',
      u51: 'http://npm.51.nb',
      yishu: 'http://npm.alightbeam.com'
    }

    const file = this.yscliPath = path.resolve(process.env.HOME, '.yscli.json');
    if (!fs.existsSync(file)) {
      this.writeData(file, this.configs);
    } else {
      this.configs = Object.assign({}, this.configs, util.file.load(file));
    }

    this.open();
  }

  get registry() {
    return this.registries[this.configs.registry] || this.configs.registry;
  }

  open() {
    this.spinner.start();
    this.spinner.log('Loading ...');
  }

  close(cb) {
    setTimeout(() => {
      this.spinner.stop();
      cb && cb();
    }, 51);
  }

  write(file, content) {
    fs.writeFileSync(file, content, 'utf8');
  }

  writeData(file, data) {
    this.write(file, JSON.stringify(data, null, 2));
  }

  execScript(cwd, cmd, ...args) {
    return new Promise((resolve, reject) => {
      let err = '';
      const ls = spawn(cmd, args, {
        silent: true,
        cwd
      });
      ls.stderr.on('data', data => err += data)
      ls.on('exit', (code, signal) => {
        if (code === 0) {
          return resolve();
        }
        reject(new Error(err || 'command run error'));
      });
    });
  }

  switcher(...args) {
    const names = args.slice(0, -1);
    const callback = args.slice(-1)[0];
    if (!names.length) {
      return this.stacks.common.push(callback);
    }
    names.forEach(name => {
      if (!this.stacks[name]) {
        this.stacks[name] = [];
      }
      this.stacks[name].push(callback);
    });
  }

  callback(callback) {
    return () => {
      callback();
      if (this.type) {
        if (this.stacks[this.type] && Array.isArray(this.stacks[this.type]) && this.stacks[this.type].length) {
          const callbacks = this.stacks[this.type];
          callbacks.forEach(caller => caller(app));
        }
      } else {
        this.stacks.noop.forEach(caller => caller(app));
      }
      this.stacks.common.forEach(caller => caller(app));
      app.listen();
    }
  }

  checkInstallize(cb) {
    if (Date.now() - this.configs.updateTimeStamp > this.configs.updateDelayTime * 24 * 60 * 60 * 1000) {
      this.spinner.name = 'VERSION';
      this.spinner.info('正在获取NPM仓库版本信息...');
      request(`${this.registry}/ys-cli`, (error, response, body) => {
        if (error) return cb(error);
        const version = JSON.parse(body)['dist-tags'].latest;
        const value = compare(this.pkg.version, version);
        if (value === -1) {
          this.spinner.warn(`检测到版本变化：升级版本`, this.pkg.version, '->', version);
          this.execScript(process.cwd(), 'npm', 'i', '-g', 'ys-cli')
            .then(() => {
              this.spinner.success(`更新 'ys-cli' 成功，继续任务...`);
              this.configs.updateTimeStamp = Date.now();
              this.writeData(this.yscliPath, this.configs);
              this.findRootPath(process.cwd(), this.callback(cb));
            })
            .catch(e => cb(e));
        } else {
          this.findRootPath(process.cwd(), this.callback(cb));
        }
      });
    } else {
      this.findRootPath(process.cwd(), this.callback(cb));
    }
  }

  findRootPath(pather, cb) {
    if (pather === '/') return cb();
    const _file = path.resolve(pather, 'package.json');
    if (fs.existsSync(_file)) {
      const packageExports = util.file.load(_file);
      if (!packageExports) return this.findRootPath(path.resolve(pather, '..'), cb);
      if (packageExports.framework) {
        this.root = pather;
        this.type = 'framework';
        return cb();
      }
      if (packageExports.plugin && packageExports.plugin.name) {
        this.type = 'plugin';
        this.root = pather;
        return cb();
      }
      return this.findRootPath(path.resolve(pather, '..'), cb);
    }
    return this.findRootPath(path.resolve(pather, '..'), cb);
  }

  task(file) {
    const that = this;
    let CallbackExports = file;
    if (typeof file === 'string') {
      const ys = path.resolve(__dirname, '../bin', file + '.js');
      if (fs.existsSync(ys)) {
        CallbackExports = util.file.load(ys);
      }
    }
    return function dispatch(...args) {
      new dbo().until(async way => {
        way.on('afterEnd', async () => {
          await new Promise(resolve => that.close(resolve));
          process.exit(0)
        });

        if (is.class(CallbackExports)) {
          const target = new CallbackExports(way, that);
          if (typeof target.render === 'function') {
            await target.render(...args);
          }
        } else {
          await CallbackExports(way, that, ...args);
        }
      }, {
        error(err) {
          that.spinner.error(err.message);
          return new Promise(resolve => that.close(resolve));
        }
      });
    }
  }

  delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }
}