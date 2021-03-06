"use strict";

var Promise       = require('bluebird')
  , _             = require('lodash')
  , socket_io     = require('socket.io')
  , socket_io_jwt = require('socketio-jwt')
  , winston       = require('winston')
  , weighted      = require('weighted')
  , config        = require('config-url')
  , NoAgentError  = require('../error/no-agent')
  , Node          = require('./node')
  ;

const pub = config.get('jwt.public');

class Hub {
  constructor(server) {
    let io = socket_io(server, { httpCompression : true });

    io.on('connection', socket_io_jwt.authorize({
          secret  : (request, token, cb) => {
            if (token.sub != config.get('make.agent.sub')) {
              return cb(new Error('invalid_sub'))
            }

            if (token.aud != config.get('make.agent.aud')) {
              return cb(new Error('invalid_aud'))
            }

            cb(null, pub);
          }
        , timeout : 15000 // 15 seconds to send the authentication message
        // , callback: false
      }))
      .on('authenticated', (socket) => {
        // todo [akamel] cleanup on disconnect?
        let payload = socket.decoded_token;

        new Node(socket);
      });

    this.io = io;
  }

  nodes() {
    var connected = this.io.of('/').connected;

    return _
            .chain(connected)
            .map((i) => i.__obj)
            .compact()
            .value();
  }

  free() {
    return Promise
            .try(() => {
              let nodes = this.nodes();

              if (_.size(nodes) > 0) {
                let weights = _.map(nodes, (i) =>  i.info.freemem / i.info.totalmem);

                return weighted.select(nodes, weights);
              }

              throw new NoAgentError('no agents available');
            });
  }
}

module.exports = Hub;
