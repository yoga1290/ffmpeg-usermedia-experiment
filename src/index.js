// https://socket.io/get-started/chat/
var app = require('express')();
var http = require('http').Server(app);

let io = require('socket.io')(http);

import {
  HTTPStreamIOBridge,
  FFmpegBridge
} from './FFmpegBridge.js'

console.log(`FFMPEG installed at ${require('@ffmpeg-installer/ffmpeg').path}`);

const namespace = '/namespace' //TODO

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Range Requests
app.get('/view',
    new HTTPStreamIOBridge(io, namespace).getRangeResponse)

// chunks
app.get('/chunked',
    new FFmpegBridge(io, namespace).getBufferChunkResponse)

http.listen(3000, function(){
  // console.log('listening on *:3000');
});
