# What's this?

This is an experiment which aims to capture HTML5 [`MediaStream`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) coming from a web browser webcam, pass it to [Express](https://expressjs.com/) server through a [Socket.IO](https://socket.io/) namespace which will be buffered and stream through Express endpoint in form of [HTTP partial/range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests)


# Environment

+ FireFox or Chrome (but not Safari)
+ [Node & NPM](https://nodejs.org/en/download/)

# Install

+ `npm i` from the project directory

# Run

+ `npm start`: to start the express server
+ Open `http://localhost:3000` in Firefox or Chrome, and accept the webcam access dialog.

### Stream to Web browser 
+ Open `http://localhost:3000/view` from web browser to stream

### Passing stream to FFmpeg (chunked)
+ `npm run ffmpeg -- -i http://localhost:3000/chunked output.webm`:
    + `http://localhost:3000/chunked` will be visible once it was opened in Firefox/Chrome and they'll keep requesting till the end of stream or server down.
    + note, `npm run ffmpeg -- ...` is a just a shortcut to ffmpeg executable dependency which should be installed at startup in `node_modules/@ffmpeg-installer/linux-x64/ffmpeg` (which may differ depending on your OS)
    + note, `--` is used to [pass flags](https://stackoverflow.com/a/46760824/1683797)

### Passing stream to FFmpeg (range-request)
+ `npm run ffmpeg -- -i http://localhost:3000/view output.webm`: **TODO: this doesn't output the full stream to FFmpeg**
    + `http://localhost:3000/view` will be visible once it was opened in Firefox/Chrome and they'll keep requesting till the end of stream or server down.
    + note, `npm run ffmpeg -- ...` is a just a shortcut to ffmpeg executable dependency which should be installed at startup in `node_modules/@ffmpeg-installer/linux-x64/ffmpeg` (which may differ depending on your OS)
    + note, `--` is used to [pass flags](https://stackoverflow.com/a/46760824/1683797)
