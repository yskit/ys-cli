const installer = require('./install');

module.exports = (thread, name, cwd) => {
  installer(cwd, name);
}