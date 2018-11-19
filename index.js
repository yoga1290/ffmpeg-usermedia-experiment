// https://socket.io/get-started/chat/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });
const EV_STREAM = 'blob'

// io.on('connect', onConnect);
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on(EV_STREAM, function (data) {
    console.log(data);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
