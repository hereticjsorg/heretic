/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const { Transform } = require("stream");
const util = require("util");
const UnzipStream = require("./unzip-stream");

function ParserStream(opts) {
    if (!(this instanceof ParserStream)) {
        return new ParserStream(opts);
    }

    const transformOpts = opts || {};
    Transform.call(this, { readableObjectMode: true });

    this.opts = opts || {};
    this.unzipStream = new UnzipStream(this.opts);

    const self = this;
    this.unzipStream.on("entry", (entry) => {
        self.push(entry);
    });
    this.unzipStream.on("error", (error) => {
        self.emit("error", error);
    });
}

util.inherits(ParserStream, Transform);

ParserStream.prototype._transform = function (chunk, encoding, cb) {
    this.unzipStream.write(chunk, encoding, cb);
};

ParserStream.prototype._flush = function (cb) {
    const self = this;
    this.unzipStream.end(() => {
        process.nextTick(() => {
            self.emit("close");
        });
        cb();
    });
};

ParserStream.prototype.on = function (eventName, fn) {
    if (eventName === "entry") {
        return Transform.prototype.on.call(this, "data", fn);
    }
    return Transform.prototype.on.call(this, eventName, fn);
};

ParserStream.prototype.drainAll = function () {
    this.unzipStream.drainAll();
    return this.pipe(
        new Transform({
            objectMode: true,
            transform(d, e, cb) {
                cb();
            },
        }),
    );
};

module.exports = ParserStream;
