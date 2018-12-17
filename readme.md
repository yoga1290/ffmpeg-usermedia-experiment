# What's this?

This is an experiment which aims to capture HTML5 [`MediaStream`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) coming from a web browser webcam, pass it to [Express](https://expressjs.com/) server through a [Socket.IO](https://socket.io/) namespace which will be buffered and stream through Express endpoint as HTTP partial contents


# Enviroment

+ FireFox or Chrome (but not Safari)
+ [Node & NPM](https://nodejs.org/en/download/)

# Install

+ `npm i` from the project directory

# Run

+ `npm start`: to start the express server
+ Open `http://localhost:3000` in Firefox or Chrome, and accept the webcam access dialog.
+ `npm run ffmpeg -i http://localhost:3000/view output.webm`: **TODO: this doesn't output the full stream**
    + `http://localhost:3000/view` will be visible once it was opened in Firefox/Chrome and they'll keep requesting till the end of stream or server down.
    + note, `npm run ffmpeg ...` is a just a shortcut to ffmpeg executable dependency which should be installed at startup in `node_modules/@ffmpeg-installer/linux-x64/ffmpeg` (which may differ depending on your OS)
