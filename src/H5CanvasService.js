const EV_STREAM = 'blob'
const EV_ESTREAM = 'end'

class BlobQueue {

    constructor(io, namespace) {
        
        console.log('BlobQueue', namespace)

        this._content = [] // chunks
        this.lastImage = null
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
    
        // let buffer = Buffer.concat(this._content) //, 'binary')
        // this._content = []
        this.lastImage = this._content.shift()
    
        this._waitForBuffer.forEach(cb=>cb(this.lastImage, this._endOfStream))  //de-queue
        this._waitForBuffer = []
        
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


export class H5CanvasService {

    constructor(io, namespace) {
        this._count = 0;
        this._blobQueue = new BlobQueue(io, namespace)
        let getImage = this.getImage.bind(this)
        return {
            getImage
        }
        // http://2ality.com/2015/02/es6-classes-final.html
    }

    getImage(req, res) {

        this._count++;
        console.log('_count', this._count)
        if (this._count > 20) {
            res.status(404).end();
            return;
        }
        res.writeHead(200, {
            "Content-Type": "image/png"
        });

        this._blobQueue.waitForBuffer((buffer)=> {
            res.write(buffer)
            res.end()
        })
    }
    
}