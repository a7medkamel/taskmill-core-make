"use strict";

var Promise       = require('bluebird')
  , http          = require('http')
  , express       = require('express')
  , winston       = require('winston')
  , _             = require('lodash')
  , config        = require('config-url')
  , morgan        = require('morgan')
  , bodyParser    = require('body-parser')
  , Hub           = require('./hub')
  ;

var app     = express()
  , server  = http.createServer(app)
  , hub     = new Hub(server)
  // , cache   = cache_man.caching({ store : 'memory', max : 1000, ttl : 20 /*seconds*/});
  ;

app.use(morgan('dev'));
app.use(bodyParser.json());

// 'https://github.com/a7medkamel/taskmill-help.git'
// '8f3a906585a5480a58e6a352c30ce41b3d165b43'
app.post('/make', (req, res, next) => {
  let { remote, sha, blob, filename, token, cache, tailf } = req.body;

  let bearer = req.get('authorization');

  // 1. select node
  hub
    .free()
    .then((node) => {
      // 2. send /make event
      winston.info(node.info);
      return Promise
              .fromCallback((cb) => {
                node.socket.emit('/make', { remote, sha, blob, filename, token, cache, tailf, bearer }, cb);
              });
    })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      winston.error(err);
      // todo [akamel] ensure it's the proper err obj and not some other random err
      res.status(423).send({ error : err.message });
    });
});

// generic err handler
app.use(function(err, req, res, next) {
  winston.error(err);
  res.status(500).send({ error : err.message });
});

function listen(options, cb) {
  return Promise.fromCallback((cb) => server.listen(options.port, cb)).asCallback(cb);
}

module.exports = {
    listen : listen
};
