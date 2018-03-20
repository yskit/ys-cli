var Cubb = require('cubb');
var cubb = new Cubb();

function log(content) {
  var text = cubb.render(content);
  text = text.replace(/^\n+|\n+$/g, '');
  console.log(text);
}

log.info = function (text) {
  var args = [
    '<bgWhiteBright><cyanBright><b> INFO </b></cyanBright></bgWhiteBright>',
    text
  ];

  log(args.join(' '));
};

log.warn = function (text) {
  var args = [
    '<bgWhiteBright><yellowBright><b> WARN </b></yellowBright></bgWhiteBright>',
    text
  ];

  log(args.join(' '));
};

log.error = function (text) {
  var args = [
    '<bgWhiteBright><redBright><b> ERROR </b></redBright></bgWhiteBright>',
    text
  ];

  log(args.join(' '));
};

log.success = function (text) {
  var args = [
    '<bgWhiteBright><greenBright><b> SUCCESS </b></greenBright></bgWhiteBright>',
    text
  ];

  log(args.join(' '));
};

log.red = function (text) {
  log('<red>' + text + '</red>');
};

log.cyan = function (text) {
  log('<cyan>' + text + '</cyan>');
};

log.blue = function (text) {
  log('<blue>' + text + '</blueBright>');
};

log.green = function (text) {
  log('<green>' + text + '</green>');
};

log.yellow = function (text) {
  log('<yellow>' + text + '</yellow>');
};

log.magenta = function (text) {
  log('<magenta>' + text + '</magenta>');
};

module.exports = log;