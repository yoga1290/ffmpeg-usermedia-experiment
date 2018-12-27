const EV_STREAM = 'blob'
const EV_ESTREAM = 'end'

class ChunkQueue {

    constructor(io, namespace) {
        
        console.log('ChunkQueue', namespace)

        this._content = [] // chunks
        this._endOfStream = false
        this._waitForBuffer = [] // callbacks

        io
        .of(namespace)
        .on('connection', (socket) => {
            console.log(`${namespace}/socket connected`)
            socket.on(EV_STREAM, this._onBuffer.bind(this));
            socket.on(EV_ESTREAM, this._onEndOfStream.bind(this));
        })

        // this.waitForBuffer = this.waitForBuffer.bind(this)
    }

    waitForBuffer(callback) {
        console.log('waitForBuffer')
        
        if (callback !== undefined) {
            console.log('<<<<<< wait')
            this._waitForBuffer.push(callback.bind(this))
        } else if ((this._waitForBuffer.length >0 && this._content.length > 0) || this._endOfStream)  {
    
        console.log('>>>>>pulling', this._content.length)
    
        let buffer = Buffer.concat(this._content) //, 'binary')
        this._content = []
    
        this._waitForBuffer.shift()(buffer, this._endOfStream) //de-queue
    
        } else {
        // console.log('waitForBuffer', _waitForBuffer.length, this._content.length, endOfStream)
        }
    }

    // FFmpegBridge.prototype.onBuffer
    _onBuffer(buffer) {
        console.log('_onBuffer')
        
        console.log(EV_STREAM, buffer)
        // https://nodejs.org/api/stream.html#stream_class_stream_writable
        this._content.push(buffer);
        this.waitForBuffer()
        this._endOfStream = false
    }

    _onEndOfStream() {
        console.log('_onEndOfStream')

        this._endOfStream = true
        // _start = _end = 0
        this.waitForBuffer()
        console.log('================= END')
    }
}


export class FFmpegBridge {

    constructor(io, namespace) {
        this._chunkQueue = new ChunkQueue(io, namespace)
        let getBufferChunkResponse = this.getBufferChunkResponse.bind(this)
        return {
            getBufferChunkResponse
        }
        // http://2ality.com/2015/02/es6-classes-final.html
    }

    // https://en.wikipedia.org/wiki/Chunked_transfer_encoding
    // https://github.com/expressjs/compression/issues/56#issuecomment-149734757
    getBufferChunkResponse(req, res) {
        res.writeHead(200, {
            "Transfer-Encoding": "chunked",
            "Content-Type": "video/webm"
        });
        console.log(this, Object.keys(this).join(' , '))
        this._writeBufferChunkResponseOnReady(res)
    }

    // https://medium.com/@davidrhyswhite/private-members-in-es6-db1ccd6128a5
    _writeBufferChunkResponseOnReady(res) {

        console.log('waitForBuffer')
        this._chunkQueue.waitForBuffer((buffer, endOfStream) => {

            console.log('RESPONSE w buffer', endOfStream, buffer)
            
            if (!endOfStream) {
                res.write(buffer);
                // res.flush() //deprecated
                res.flushHeaders()
                // wait for another chunk
                this._writeBufferChunkResponseOnReady(res)
            } else {
                res.end()
            }

        })
    }
    
}

export class HTTPStreamIOBridge {

    constructor(io, namespace) {
        this._chunkQueue = new ChunkQueue(io, namespace)

        let getRangeResponse = this.getRangeResponse.bind(this)

        return {
            getRangeResponse
        }
    }

    getRangeResponse(req, res) {

        let { range } = req.headers;
        
        // see https://ffmpeg.org/pipermail/ffmpeg-user/2014-March/020639.html //TODO?
      
        console.log('req.headers', req.headers)
        let start = 0
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

            this._chunkQueue.waitForBuffer((buffer, endOfStream) => {
                if (!endOfStream) {
                    this._onBufferReady(buffer, start, res)
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
      
        }
      }


      _onBufferReady(buffer, start, res) {
        //wait for another
        // total = end + Buffer.byteLength(buffer, 'binary') //'*'
        let end = start + Buffer.byteLength(buffer, 'binary')
        console.log(start, end, buffer)
        if (start < end ) {
          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${1<<30}`, //TODO: /* doesn't work!
            "Accept-Ranges": "bytes",
            "Content-Length": (end-start),
            "Connection": "close",//"keep-alive",
            "Content-Type": "video/webm"
            // "Content-Type": "audio/ogg"
          });
          res.end(buffer, 'binary');
        } else { // buffer size = 0 bytes, then skip to the next
            this._chunkQueue.waitForBuffer((buffer, endOfStream) => {
                this._onBufferReady(buffer, start, res)
            })            
        }
    
    }
}