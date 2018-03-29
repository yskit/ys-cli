const frameworkers = {
  'ys-fw-koa': '使用KOA服务启动架构',
  'ys-fw-micro': '使用微服务启动架构(基于`net.socket`模块)'
};
const routers = {
  'ys-fw-koa': {
    'ys-pg-koa-router': '使用 `Koa-router` 路由架构',
    'ys-pg-koa-smart-router': '使用 `smart-koa-router` 路由架构'
  },
  'ys-fw-micro': {
    'ys-pg-micro-router': '使用 `ys-middleware-router` 路由架构'
  }
}

exports.whichFrameworker = {
  ask: {
    type: 'list',
    name: 'framework',
    message: '您想使用以下那种服务启动架构来运行您的应用？',
    default: null,
    choices: getSubjectValues(frameworkers)
  },
  reply(options) {
    return getSubjectKey(frameworkers, options.framework);
  }
}

exports.whichRouter = name => {
  return {
    ask: {
      type: 'list',
      name: 'router',
      message: '你想使用以下那种路由架构来编写您的路由服务？',
      default: null,
      choices: getSubjectValues(routers[name])
    },
    reply(options) {
      return getSubjectKey(routers[name], options.router);
    }
  }
}

function getSubjectValues(which) {
  const arr = [];
  for (const i in which) {
    arr.push(which[i]);
  }
  return arr;
}

function getSubjectKey(which, value) {
  for (const i in which) {
    if (which[i] === value) return i;
  }
}