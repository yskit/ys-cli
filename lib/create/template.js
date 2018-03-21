exports['/.gitignore'] = 'archive\nnode_modules\n.idea\nbower_components\nexplorations\n.DS_Store\ncoverage\nperf\n*.map\nnpm-debug.log\n.vscode';
exports['/package.json'] = (name, framework) => {
  return {
    "name": name,
    "version": "1.0.0",
    "description": `application for ${name}`,
    "scripts": {
      "dev": "NODE_ENV=dev node index.js"
    },
    "framework": framework
  }
}
exports['/index.js'] = `const Mutify = require('ys-mutify');
const mutify = new Mutify(__dirname + '/config');

mutify.on('ready', () => console.log(\`[\${mutify.pid}]\`, 'Master is ready.'));
mutify.listen()
  .then(() => console.log(\`[\${mutify.pid}]\`, 'Master listened success'))
  .catch(e => console.error(\`[\${mutify.pid}]\`, 'Master listening catch error:', e));`;

exports['/config/options.env.js'] = `const path = require('path');
module.exports = {
  baseDir: path.resolve(__dirname, '..')
}`;

exports['/config/plugin.js'] = `module.exports = {
  // new plugin slot
}`;

exports['/config/plugin.env.js'] = `module.exports = {
  // new plugin config slot
}`;

exports['/app.js'] = `module.exports = async app => {
  // Application的ready生命周期我们可以自定义一些行为
  app.on('ready', async () => app.console.log(\`[\${app.pid}]\`, 'Application worker ready'));

  // Application的destroy生命周期我们可以自定义一些行为
  app.on('destroy', async () => app.console.log(\`[\${app.pid}]\`, 'Application worker destroy'));

  /**
   * 在 \`ys-fw-koa\` 应用服务架构中
   * 我们可以调用服务生命周期
   * 
   * @param koa \`object\` Koa框架生成后的应用对象
   */
  // 预加载文件事件
  app.on('beforeLoadFiles', async compiler => app.console.log('beforeLoadFiles', compiler));
  // 服务即将启动
  app.on('serverWillStart', async koa => app.console.log('service will start'));
  // 服务已启动
  app.on('serverDidStarted', async koa => app.console.log('service started'));
  // 服务即将停止
  app.on('serverWillStop', async koa => app.console.log('service will stop'));
  // 服务已停止
  app.on('serverDidStoped', async koa => app.console.log('service stoped'));
}`;
exports['/agent.js'] = `module.exports = async agent => {
  // Agent的ready生命周期我们可以自定义一些行为
  agent.on('ready', async () => agent.console.log(\`[\${agent.pid}]\`, \`[AGENT] \${agent.options.name} worker ready\`));

  // Agent的destroy生命周期我们可以自定义一些行为
  agent.on('destroy', async () => agent.console.log(\`[\${agent.pid}]\`, \`[AGENT] \${agent.options.name} worker destroy\`));
}`;

exports['plugin:/app.js'] = `module.exports = async (app, configs) => {
  // Application的ready生命周期我们可以自定义一些行为
  app.on('ready', async () => app.console.log('application plugin configs', configs));

  // Application的destroy生命周期我们可以自定义一些行为
  app.on('destroy', async () => app.console.log('application plugin destroy'));

  /**
   * 在 \`ys-fw-koa\` 应用服务架构中
   * 我们可以调用服务生命周期
   * 
   * @param koa \`object\` Koa框架生成后的应用对象
   */
  // 预加载文件事件
  app.on('beforeLoadFiles', async compiler => app.console.log('beforeLoadFiles', compiler));
  // 服务即将启动
  app.on('serverWillStart', async koa => app.console.log('service will start'));
  // 服务已启动
  app.on('serverDidStarted', async koa => app.console.log('service started'));
  // 服务即将停止
  app.on('serverWillStop', async koa => app.console.log('service will stop'));
  // 服务已停止
  app.on('serverDidStoped', async koa => app.console.log('service stoped'));

}`;
exports['plugin:/agent.js'] = `module.exports = async (component, agent) => {
  // 演示如何获取插件配置
  agent.console.log('component configs', component.options);

  // 插件被销毁事件
  component.on('destroy', async () => agent.console.log('component destroy'));

  // 插件微服务启动事件
  component.on('task:start', async () => agent.console.log('task:start'));

  // 插件微服务停止事件
  component.on('task:end', async () => agent.console.log('task:end'));

  // Agent的ready生命周期我们可以自定义一些行为
  // 这里演示获取Agent的配置参数
  agent.on('ready', async () => agent.console.log('agent plugin configs', agent.options));
  
  // Agent的destroy生命周期我们可以自定义一些行为
  agent.on('destroy', async () => agent.console.log('agent plugin destroy'));
}`;
exports['plugin:/ys.command.js'] = `// 使用插件的json配置
exports.use = '{}';
// 插件通用配置
exports.common = '{}';
// 插件的dev模式下的配置
exports.dev = '{}';
// 插件的stable模式下的配置
exports.stable = '{}';
// 插件的staging模式下的配置
exports.staging = '{}';
// 插件的product模式下的配置
exports.product = '{}';
// 初始安装插件时候调用周期
exports.installer = async ({ cwd, log }) => {
  log.info('cwd', cwd);
};
// 卸载插件时候调用周期
exports.uninstaller = async ({ cwd, log }) => {
  log.info('cwd', cwd);
};
// 支持ys-cli命令的功能
exports.command = ({ app, log, root }) => {
  log.info('root', root);
  app.command('test')
    .describe('测试插件命令行')
    .action(() => console.log('测试成功'));
};`;