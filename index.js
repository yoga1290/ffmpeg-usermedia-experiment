// https://socket.io/get-started/chat/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs = require('fs');

// a Duplex stream that buffers incoming written data via the Writable interface that is read back out via the Readable interface.
// see https://nodejs.org/api/stream.html#stream_an_example_duplex_stream
// const { Readable } = require('stream');


console.log(`FFMPEG installed at ${require('@ffmpeg-installer/ffmpeg').path}`);

const EV_STREAM = 'blob'
const EV_ESTREAM = 'end'

let content = []
let endOfStream = false
let _waitForBuffer = []
function waitForBuffer(callback) {
  if (callback !== undefined) {
    console.log('<<<<<< wait')
    _waitForBuffer.push(callback)
  } else if ((_waitForBuffer.length >0 && content.length > 0) || endOfStream)  {

    console.log('>>>>>pulling', content.length)

    let buffer = Buffer.concat(content) //, 'binary')
    content = []

    _waitForBuffer.shift()(buffer) //de-queue

  } else {
    // console.log('waitForBuffer', _waitForBuffer.length, content.length, endOfStream)
  }
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/', function(req, res){
  // res.header('Access-Control-Allow-Origin', 'yoga1290.gitlab.io')
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
    console.log(EV_STREAM, buffer)
    // https://nodejs.org/api/stream.html#stream_class_stream_writable
    content.push(buffer);
    waitForBuffer()
    endOfStream = false
  });
  
  socket.on(EV_ESTREAM, () => {
    endOfStream = true
    _start = _end = 0
    waitForBuffer()
    console.log('================= END')
  });
})

let start = 0
let end = start;

// Range Requests
app.get('/view', (req, res) => {

  let { range } = req.headers;
  
  // see https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020639.html //TODO?

  console.log('req.headers', req.headers)
  // let start = 0
  // let end = start;

  // https://stackoverflow.com/q/53259737
  if (!range) {
    res.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Connection": "close", // not needed
      // "Content-Length": 1<<30,
      "Content-Type": "video/webm"
      // "Content-Type": "audio/ogg"
    });
    res.end(null);
  } else {

    if (range && range.length > 0) { // not the 1st request
      var parts = range.replace(/bytes=/, "").split("-");
      start = parts[0] ? parseInt(parts[0]):_start;
    }
  
    let total = 1<<30//'*'
  
    function callback(buffer) {
      //wait for another
      // total = end + Buffer.byteLength(buffer, 'binary') //'*'
      end = start + Buffer.byteLength(buffer, 'binary')
      console.log(start, end, buffer)
      if (start < end ) {
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Length": (end-start),
          "Connection": "close",//"keep-alive",
          "Content-Type": "video/webm"
          // "Content-Type": "audio/ogg"
        });
        res.end(buffer, 'binary');
      } else { // 0 bytes skip
        waitForBuffer(callback)
      }
  
    }
  
    if (!endOfStream) {
      waitForBuffer(callback)
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

  }
})

// https://en.wikipedia.org/wiki/Chunked_transfer_encoding
// https://github.com/expressjs/compression/issues/56#issuecomment-149734757
app.get('/chunked', (req, res) => {
  res.writeHead(200, {
    "Transfer-Encoding": "chunked",
    "Content-Type": "video/webm"
  });

  let callback = () => {
    console.log('waitForBuffer')
    waitForBuffer((buffer) => {

      console.log('RESPONSE w buffer', endOfStream, buffer)
      
      if (!endOfStream) {
        res.write(buffer);
        // res.flush() //deprecated
        res.flushHeaders()

        callback()
      } else {
        res.end()
      }

    })
  }

  callback()
  
})


http.listen(3000, function(){
  // console.log('listening on *:3000');
});
