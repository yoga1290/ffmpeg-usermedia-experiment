// https://socket.io/get-started/chat/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs = require('fs');

// a Duplex stream that buffers incoming written data via the Writable interface that is read back out via the Readable interface.
// see https://nodejs.org/api/stream.html#stream_an_example_duplex_stream
const { Readable } = require('stream');

const EV_STREAM = 'blob'
const EV_ESTREAM = 'end'

let content = []
let endOfStream = false
let _waitForBuffer = []
function waitForBuffer(callback) {
  if (callback !== undefined) {
    _waitForBuffer.push(callback)
  } else if ((_waitForBuffer.length >0 && content.length > 0) || endOfStream)  {
    let buffer = Buffer.concat(content) //, 'binary')
    _waitForBuffer.forEach(cb=>cb(buffer))
    _waitForBuffer = []
    content = []
  }
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

//TODO: use multipart?
// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
// see https://tools.ietf.org/html/rfc7233#section-4.1

// io.on('connect', onConnect);
var nsp = io.of('/my-namespace');

let dx = null

nsp.on('connection', (socket) => {

  console.log('socket connected')
  
  socket.on(EV_STREAM, (buffer) => {
    // console.log('stream recieved');
    // console.log(buffer);
    // https://nodejs.org/api/stream.html#stream_class_stream_writable
    // file.write(buffer);
    console.log('buffer', buffer.length)
    content.push(buffer);
    waitForBuffer()
    endOfStream = false
  });
  
  socket.on(EV_ESTREAM, () => {
    endOfStream = true
    _start = _end = 0
    console.log('================= END')
  });

})

app.get('/view', (req, res) => {

  let { range } = req.headers;
  
  let start = 0
  let end = start;

  if (range && range.length > 0) { // not the 1st request
    var parts = range.replace(/bytes=/, "").split("-");
    start = parts[0] ? parseInt(parts[0]):_start;
  }

  let total = 1<<30//'*'

  if (!endOfStream) {
    waitForBuffer(function(buffer) {
      //wait for another
      // total = end + Buffer.byteLength(buffer, 'binary') //'*'
      end = start + Buffer.byteLength(buffer, 'binary')
      console.log(start, end, buffer)
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": (end-start),
        "Content-Type": "video/webm"
        // "Content-Type": "audio/ogg"
      });
      res.end(buffer, 'binary');
    })
  } else {
    console.log('END OF STREAM=====')
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${end}`,
      "Accept-Ranges": "bytes",
      "Content-Length": 0,
      "Content-Type": "video/webm"
      // "Content-Type": "audio/ogg"
    });
    res.end(null)
  }
  
})



http.listen(3000, function(){
  // console.log('listening on *:3000');
});
