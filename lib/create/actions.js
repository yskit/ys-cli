const fs = require('fs');
const path = require('path');
const template = require('./template');

exports['/.gitignore'] = cwd => {
  fs.writeFileSync(
    path.resolve(cwd, '.gitignore'), 
    template['/.gitignore'], 
    'utf8'
  );
  return '/.gitignore';
}

exports['/package.json'] = (cwd, name, framework) => {
  fs.writeFileSync(
    path.resolve(cwd, 'package.json'), 
    JSON.stringify(template['/package.json'](name, framework), null, 2), 
    'utf8'
  );
  return '/package.json';
}

exports['/index.js'] = cwd => {
  fs.writeFileSync(
    path.resolve(cwd, 'index.js'), 
    template['/index.js'],
    'utf8'
  );
  return '/index.js';
}

exports['/config/options.env.js'] = (cwd, file) => {
  fs.writeFileSync(
    file, 
    template['/config/options.env.js'],
    'utf8'
  );
  return '/' + path.relative(cwd, file);
}

exports['/config/plugin.js'] = (cwd, file) => {
  fs.writeFileSync(
    file, 
    template['/config/plugin.js'],
    'utf8'
  );
  return '/' + path.relative(cwd, file);
}

exports['/config/plugin.env.js'] = (cwd, file) => {
  fs.writeFileSync(
    file, 
    template['/config/plugin.env.js'],
    'utf8'
  );
  return '/' + path.relative(cwd, file);
}

exports['/app.js'] = file => {
  fs.writeFileSync(
    file, 
    template['/app.js'],
    'utf8'
  );
  return '/app.js';
}

exports['/agent.js'] = file => {
  fs.writeFileSync(
    file, 
    template['/agent.js'],
    'utf8'
  );
  return '/agent.js';
}