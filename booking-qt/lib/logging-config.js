const log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' , level:'INFO' }
  ]
});

log4js.setGlobalLogLevel('INFO');

module.exports = log4js;

