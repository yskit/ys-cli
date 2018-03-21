const fs = require('fs');
const dbo = require('ys-dbo');
const path = require('path');
const log = require('../../log');
const { error } = require('../../utils');
const template = require('../../create/template');

module.exports = name => {
  new dbo().until(async thread => {
    const cwd = process.cwd();
    const FileList = [];
    const pluginDir = path.resolve(cwd, name);
    const pluginPackageFilePath = path.resolve(pluginDir, 'package.json');
    const pluginAppFilePath = path.resolve(pluginDir, 'app.js');
    const pluginAgentFilePath = path.resolve(pluginDir, 'agent.js');
    const pluginCommandFilePath = path.resolve(pluginDir, 'ys.command.js');
    const pluginGitIgnoreFilePath = path.resolve(pluginDir, '.gitignore');
    if (fs.existsSync(pluginDir)) {
      throw new Error(`插件 '${name}' 已存在`);
    }

    fs.mkdirSync(pluginDir);
    fs.writeFileSync(pluginGitIgnoreFilePath, template['/.gitignore'], 'utf8');
    FileList.push('.gitignore');
    const packageJson = template['/package.json'](name);
    delete packageJson.framework;
    fs.writeFileSync(pluginPackageFilePath, JSON.stringify(packageJson, null, 2), 'utf8');
    FileList.push('package.json');
    fs.writeFileSync(pluginAppFilePath, template['plugin:/app.js'], 'utf8');
    FileList.push('app.js');
    fs.writeFileSync(pluginAgentFilePath, template['plugin:/agent.js'], 'utf8');
    FileList.push('agent.js');
    fs.writeFileSync(pluginCommandFilePath, template['plugin:/ys.command.js'], 'utf8');
    FileList.push('ys.command.js');
    FileList.forEach(file => log.green(`  - 已安装文件: ${file}`));
    log.success('插件创建成功');

  }, { error });
}