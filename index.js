var config    = require('config-url')
  , winston   = require('winston')
  , Promise   = require('bluebird')
  , http      = require('./lib')
  ;

Promise.longStackTraces();

process.on('uncaughtException', function (err) {
  console.error(err.stack || err.toString());
});

function main() {
  return http
          .listen({ port : config.getUrlObject('make').port })
          .then(() => {
            winston.info('taskmill-core-make [started] :%d', config.getUrlObject('make').port);
          });
}

if (require.main === module) {
  main();
}

module.exports = {
  main  : main
};
