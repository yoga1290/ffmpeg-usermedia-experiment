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


// var file = fs.createWriteStream('./big.file', {
//   flags : 'w',
//   encoding: 'binary'
//  });

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
  
  dx = new Readable({
      read(size) {
          // this.push('foo');
          
          // console.log('a user connected');
          socket.on(EV_STREAM, (buffer) => {
            // console.log('stream recieved');
            // console.log(buffer);
            // https://nodejs.org/api/stream.html#stream_class_stream_writable
            // file.write(buffer);
            console.log('buffer', buffer)
            this.push(buffer);
          });
          socket.on(EV_ESTREAM, () => {
            this.push(null)
            // res.end()
            console.log('================= END')
          });

      }
  })

})

app.get('/view', (req, res) => {

    // .header('Content-Type', 'audio/ogg')
    if (dx) {
      // res.header('Content-Type', 'audio/ogg')
      dx.pipe(res)
    } else {
      res.status(401).end()
    }

})



http.listen(3000, function(){
  // console.log('listening on *:3000');
});
