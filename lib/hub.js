"use strict";

var Promise     = require('bluebird')
  , _           = require('lodash')
  , socket_io   = require('socket.io')
  , winston     = require('winston')
  , weighted    = require('weighted')
  , config      = require('config-url')
  , Node        = require('./node')
  ;

// let hub_port = config.getUrlObject('make.hub').port;

class Hub {
  constructor(server) {
    this.io = socket_io(server, { httpCompression : true });

    // todo [akamel] cleanup on disconnect?
    this.io.on('connection', (socket) => {
      new Node(socket);
    });
  }

  nodes() {
    var connected = this.io.of('/').connected;

    return _
            .chain(connected)
            .map((i) => i.__obj)
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

              throw new Error('no agents available');
            });
  }
}

module.exports = Hub;
