/* eslint-disable func-names */
const fs = require("fs");
const path = require("path");
const util = require("util");
const mkdirp = require("mkdirp");
const {
    Transform,
} = require("stream");
const UnzipStream = require("./unzip-stream");

function Extract(opts) {
    if (!(this instanceof Extract)) {
        return new Extract(opts);
    }
    Transform.call(this);
    this.opts = opts || {};
    this.unzipStream = new UnzipStream(this.opts);
    this.unfinishedEntries = 0;
    this.afterFlushWait = false;
    this.createdDirectories = {};
    const self = this;
    this.unzipStream.on("entry", this._processEntry.bind(this));
    this.unzipStream.on("error", (error) => {
        self.emit("error", error);
    });
}

util.inherits(Extract, Transform);

Extract.prototype._transform = function (chunk, encoding, cb) {
    this.unzipStream.write(chunk, encoding, cb);
};

Extract.prototype._flush = function (cb) {
    const self = this;

    const allDone = function () {
        process.nextTick(() => {
            self.emit("close");
        });
        cb();
    };

    this.unzipStream.end(() => {
        if (self.unfinishedEntries > 0) {
            self.afterFlushWait = true;
            return self.on("await-finished", allDone);
        }
        allDone();
    });
};

Extract.prototype._processEntry = function (entry) {
    const self = this;
    const destPath = path.join(this.opts.path, entry.path);
    const directory = entry.isDirectory ? destPath : path.dirname(destPath);
    this.unfinishedEntries += 1;
    const writeFileFn = function () {
        const pipedStream = fs.createWriteStream(destPath);
        pipedStream.on("close", () => {
            self.unfinishedEntries -= 1;
            self._notifyAwaiter();
        });
        pipedStream.on("error", (error) => {
            self.emit("error", error);
        });
        entry.pipe(pipedStream);
    };
    if (this.createdDirectories[directory] || directory === ".") {
        return writeFileFn();
    }

    // FIXME: calls to mkdirp can still be duplicated
    mkdirp(directory, (err) => {
        if (err) return self.emit("error", err);

        self.createdDirectories[directory] = true;

        if (entry.isDirectory) {
            self.unfinishedEntries -= 1;
            self._notifyAwaiter();
            return;
        }

        writeFileFn();
    });
};

Extract.prototype._notifyAwaiter = function () {
    if (this.afterFlushWait && this.unfinishedEntries === 0) {
        this.emit("await-finished");
        this.afterFlushWait = false;
    }
};

module.exports = Extract;
