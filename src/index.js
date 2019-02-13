// https://socket.io/get-started/chat/
var app = require('express')();
var http = require('http').Server(app);

let io = require('socket.io')(http);

import {
  HTTPStreamIOBridge,
  FFmpegBridge
} from './FFmpegBridge.js'

import {
  H5CanvasService
} from './H5CanvasService.js'

console.log(`FFMPEG installed at ${require('@ffmpeg-installer/ffmpeg').path}`);

const namespace = '/namespace' //TODO

app.use((req, res, next) => {
  console.log('req.url', req.url)

  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/canvas', function(req, res) {
  res.sendFile(__dirname + '/canvas.html');
});

// Range Requests
// app.get('/view',
//     new HTTPStreamIOBridge(io, namespace).getRangeResponse)

// chunks
// app.get('/chunked',
//     new FFmpegBridge(io, namespace).getBufferChunkResponse)

app.get('/canvas/:img',
  new H5CanvasService(io, '/canvas').getImage)
    

http.listen(3000, function(){
  // console.log('listening on *:3000');
});
