const fs = require('fs');
const path = require('path');
const log = require('./log');
const util = require('ys-utils');
const request = require('request');
const compare = require('node-version-compare');
const { spawnSync } = require('child_process');
const registries = {
  taobao: 'https://registry.npm.taobao.org',
  npm: 'https://registry.npmjs.org'
}
const registryData = checkConfigs();
const registry = registries[registryData.registry] 
  ? registries[registryData.registry] 
  : registryData.registry || registries.taobao;

exports.registry = registry;
exports.checkConfigs = checkConfigs;
function checkConfigs() {
  const file = path.resolve(process.env.HOME, '.yscli.json');
  if (!fs.existsSync(file)) {
    return writeCommonPackage(file);
  }
  let rewrite;
  let pkgExports = util.file.load(file);
  if (!pkgExports) rewrite = true;
  if (!pkgExports.updateTimeStamp || !pkgExports.registry || !pkgExports.updateDelayTime) rewrite = true;
  if (rewrite) {
    return writeCommonPackage(file);
  }

  return pkgExports;
}

function writeCommonPackage(file) {
  const data = {
    updateTimeStamp: Date.now(),
    registry: 'taobao',
    updateDelayTime: 1
  };
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

exports.update = function(version, cb) {
  const time = (registryData.updateDelayTime || 1) * 24 * 60 * 60 * 1000;
  const file = path.resolve(process.env.HOME, '.yscli.json');
  const ysCLIExports = fs.existsSync(file) ? util.file.load(file) || {} : {};
  const updateTimeStamp = ysCLIExports.updateTimeStamp || 0;
  if (Date.now() - updateTimeStamp > time) {
    log.blue('正在检测版本更新...');
    request(registry + '/ys-cli', (error, response, body) => {
      if (error) {
        log.error(error.message);
        return process.exit(1);
      }
      try {
        const data = JSON.parse(body);
        const npmLatest = data['dist-tags'].latest;
        const localLatest = version;
        const value = compare(localLatest, npmLatest);
        if (value === -1) {
          log.yellow(`检测到版本变化：${localLatest} -> ${npmLatest}`);
          try {
            execScript(process.cwd(), 'npm', 'i', '-g', 'ys-cli');
            ysCLIExports.updateTimeStamp = Date.now();
            fs.writeFileSync(file, JSON.stringify(ysCLIExports, null, 2), 'utf8');
            log.success(`更新 'ys-cli' 成功，请重新输入命令。`)
          } catch (e) {
            log.error(e.message);
            process.exit(1);
          }
        } else {
          ysCLIExports.updateTimeStamp = Date.now();
          fs.writeFileSync(file, JSON.stringify(ysCLIExports, null, 2), 'utf8');
          cb();
        }
      } catch(e) {
        log.error(e.message);
        process.exit(1);
      }
    });
  } else {
    cb();
  }
}

exports.npmInstall = function npmInstall(cwd, ...args) {
  const code = spawnSync('npm', ['i'].concat(args).concat(['--save', '--registry=' + registry]), {
    stdio: 'inherit',
    cwd
  });

  if (!code) {
    throw new Error('npm install catch error');
  }
}

exports.npmUnInstall = function npmInstall(cwd, ...args) {
  const code = spawnSync('npm', ['uninstall'].concat(args).concat(['--save']), {
    stdio: 'inherit',
    cwd
  });

  if (!code) {
    throw new Error('npm install catch error');
  }
}

exports.execScript = execScript;
function execScript(cwd, cmd, ...args) {
  const code = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd
  });

  if (!code) {
    throw new Error('Run command catch error');
  }
}

exports.findRootPath = findRootPath;
function findRootPath(pather) {
  if (pather === '/') return;
  const _file = path.resolve(pather, 'package.json');
  if (fs.existsSync(_file)) {
    const packageExports = util.file.load(_file);
    if (packageExports && packageExports.framework) {
      return pather;
    }
    return findRootPath(path.resolve(pather, '..'));
  }
  return findRootPath(path.resolve(pather, '..'));
}

exports.error = function error(err) {
  log.error(err.message);
  process.exit(1);
}