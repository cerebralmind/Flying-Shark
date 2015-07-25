// modules
var childProcess = require('child_process')
  , express = require('express')
  , http = require('http')
  , morgan = require('morgan')
  , ws = require('ws');

// configuration files
var configServer = require('./lib/config/server');

// app parameters
var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(express.static(configServer.bootstrapFolder));
app.use(express.static(configServer.imagesFolder));
app.use(express.static(configServer.jqueryFolder));
//app.use(express.static(configServer.socketioFolder));
app.use(morgan('dev'));

// serve index
require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
http.createServer(app).listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});

/// Video streaming section
// Reference: https://github.com/phoboslab/jsmpeg/blob/master/stream-server.js

var STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
var width = 320;
var height = 240;

// WebSocket server
var wsServer = new (ws.Server)({ port: configServer.wsPort });
console.log('WebSocket server listening on port ' + configServer.wsPort);

wsServer.on('connection', function(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);

  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, { binary: true });

  console.log('New WebSocket Connection (' + wsServer.clients.length + ' total)');

  socket.on('close', function(code, message){
    console.log('Disconnected WebSocket (' + wsServer.clients.length + ' total)');
  });
});

wsServer.broadcast = function(data, opts) {
  for(var i in this.clients) {
    if(this.clients[i].readyState == 1) {
      this.clients[i].send(data, opts);
    }
    else {
      console.log('Error: Client (' + i + ') not connected.');
    }
  }
};

// HTTP server to accept incoming MPEG1 stream
http.createServer(function (req, res) {
  console.log(
    'Stream Connected: ' + req.socket.remoteAddress +
    ':' + req.socket.remotePort + ' size: ' + width + 'x' + height
  );

  req.on('data', function (data) {
    wsServer.broadcast(data, { binary: true });
  });
}).listen(configServer.streamPort, function () {
  console.log('Listening for video stream on port ' + configServer.streamPort);

  // Run do_ffmpeg.sh from node                                                   
  childProcess.exec('../../bin/do_ffmpeg.sh');
});

module.exports.app = app;


// Cylon Server

var Cylon = require('cylon');

Cylon.robot({
  name: 'sharkie',

  events: ['turn_left', 'turn_right', 'climb', 'dive', 'idle_all', 'idle_tail', 'idle_pitch'],

  commands: function() {
    return {
        turn_left: this.turnLeft,
        turn_right: this.turnRight,
        climb: this.climb,
        dive: this.dive,
        idle_all: this.idleAll,
        idle_pitch: this.idlePitch,
        idle_tail: this.idleTail,
    };
  },
          
  connections: {
    edison: { adaptor: 'intel-iot' }
  },

  devices: {
    //led: { driver: 'led', pin: 13 },
    left: { driver: 'led', pin: 12 },
    right: { driver: 'led', pin: 13 },
    up: { driver: 'led', pin: 15 },
    down: { driver: 'led', pin: 14 },
  },

  work: function(my) {
    // for this example with sockets
    // we are going to be interacting
    // with the robot using the code in
    // ./**-client.html
    //every((1).second(), my.led.toggle);
    //this.idleAll();
    after((5).seconds(), function() {
	 //this.idleAll();
    }.bind(this));
  },
  
  turnLeft: function() {
      //console.log('left');
      this.left.turnOn();
      this.right.turnOff();
  },

  turnRight: function() {
      //console.log('right');
      this.right.turnOn();
      this.left.turnOff();
  },

  idleTail: function() {
      //console.log('tail idle');
      this.left.turnOff();
      this.right.turnOff();
  },

  climb: function() {
      //console.log('climb');
      this.up.turnOn();
      this.down.turnOff();
  },

  dive: function() {
      //console.log('dive');
      this.down.turnOn();
      this.up.turnOff();
  },

  idlePitch: function() {
      //console.log('pitch idle');
      this.up.turnOff();
      this.down.turnOff();
  },

  idleAll: function() {
      console.log('all idle');
      this.idlePitch();
      this.idleTail();
  },
});

// ensure you install the API plugin first:
// $ npm install cylon-api-socket-io
Cylon.api('socketio',
{
  host: '0.0.0.0',
  port: '3000'
});

Cylon.start();
