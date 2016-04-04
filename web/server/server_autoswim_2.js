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

  events: ['turn_left', 'turn_right', 'climb', 'dive', 'idle_all', 'idle_tail', 'idle_pitch', 'swim', 'duration_minus', 'duration_plus', 'duty_minus', 'duty_plus'],

  commands: function() {
    return {
        turn_left: this.turnLeft,
        turn_right: this.turnRight,
        climb: this.climb,
        dive: this.dive,
        idle_all: this.idleAll,
        idle_pitch: this.idlePitch,
        idle_tail: this.idleTail,
        swim: this.autoSwim,
        duration_minus: this.durationMinus,
        duration_plus: this.durationPlus,
    };
  },
          
  connections: {
    edison: { adaptor: 'intel-iot' }
  },

  devices: {
    //led: { driver: 'led', pin: 13 },
    down: { driver: 'led', pin: 33 },
    up: { driver: 'led', pin: 46 },
    right: { driver: 'led', pin: 48 },
    left: { driver: 'led', pin: 36 },

    pwm_0: { driver: 'led', pin: 20 },
    pwm_1: { driver: 'led', pin: 14 },
    reset: { driver: 'led', pin: 47 },
  },

  work: function(my) {
    // for this example with sockets
    // we are going to be interacting
    // with the robot using the code in
    // ./**-client.html
    //every((1).second(), my.led.toggle);
    //this.idleAll();
    my.autoswim = false;
    my.duration = 1;
    my.duty_cylce = 0.5;
    my.MAX_DURATION = 0.75;
    my.MIN_DURATION = 0.25;
    after((5).seconds(), function() {
	 this.configureHBridge();
	      every((my.duration * 2).seconds(), function() {
	      console.log('Autoswim ' + my.autoswim);
	      if (my.autoswim) {
		    console.log('Autoswim on');
		    my.turnLeft();
		    after((my.duty_cycle * my.duration).seconds(), function() {
			my.idleTail();
		    });
		    after((my.duration).seconds(), function() {
			my.turnRight();
		    });
		    after((my.duty_cycle * my.duration).seconds(), function() {
			my.idleTail();
		    });
	      }
	      });
    }.bind(this));
  },
 
  configureHBridge: function() {
      console.log('Setting Up H-Bridge');
      this.pwm_0.turnOn();	
      this.pwm_1.turnOn();	
      this.reset.turnOn();	
  },

  turnLeft: function() {
      console.log('left');
      this.left.turnOn();
      this.right.turnOff();
  },

  turnRight: function() {
      console.log('right');
      this.right.turnOn();
      this.left.turnOff();
  },

  idleTail: function() {
      console.log('tail idle');
      this.left.turnOff();
      this.right.turnOff();
  },

  climb: function() {
      console.log('climb');
      this.up.turnOn();
      this.down.turnOff();
  },

  dive: function() {
      console.log('dive');
      this.down.turnOn();
      this.up.turnOff();
  },

  idlePitch: function() {
      console.log('pitch idle');
      this.up.turnOff();
      this.down.turnOff();
  },

  idleAll: function() {
      console.log('all idle');
      this.idlePitch();
      this.idleTail();
  },

  autoSwim: function() {
      this.autoswim = !this.autoswim;
      console.log('Swimming ' + this.autoswim);
  },

  durationMinus: function() {
      this.duration = (this.duration >= this.MAX_DURATION)? this.MAX_DURATION : this.duration - 0.05;
      console.log('swim duration ' + this.duration);
  },

  durationPlus: function() {
      this.duration = (this.duration <= this.MIN_DURATION)? this.MIN_DURATION : this.duration + 0.05;
      console.log('swim duration ' + this.duration);
  },

  dutyMinus: function() {
      this.duty_cycle = (this.duty_cycle >= 1)? 1 : this.duty_cycle - 0.05;
      console.log('swim duty_cycle ' + this.duty_cycle);
  },

  dutyPlus: function() {
      this.duty_cycle = (this.duty_cycle <= 0.1)? 0.1 : this.duty_cycle + 0.05;
      console.log('swim duty_cycle ' + this.duty_cycle);
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
