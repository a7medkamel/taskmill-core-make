"use strict";

var winston = require('winston');

class Node {
  constructor(socket) {
    socket.__obj  = this;

    // ex: /#HnOCudy16YsOwLOOAAAA
    this.id       = socket.id;
    this.socket   = socket;
    this.info     = undefined; //set by heartbeat

    socket.on('/ping', (info) => {
      this.info = info;
    });
  }
}

module.exports = Node;
