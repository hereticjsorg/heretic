/* eslint-disable no-redeclare */
/* eslint-disable block-scoped-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable func-names */
const { Transform } = require("stream");
const util = require("util");

function MatcherStream(patternDesc, matchFn) {
    if (!(this instanceof MatcherStream)) {
        return new MatcherStream();
    }

    Transform.call(this);

    const p = typeof patternDesc === "object" ? patternDesc.pattern : patternDesc;

    this.pattern = Buffer.isBuffer(p) ? p : Buffer.from(p);
    this.requiredLength = this.pattern.length;
    if (patternDesc.requiredExtraSize) this.requiredLength += patternDesc.requiredExtraSize;

    this.data = Buffer.from("");
    this.bytesSoFar = 0;

    this.matchFn = matchFn;
}

util.inherits(MatcherStream, Transform);

MatcherStream.prototype.checkDataChunk = function (ignoreMatchZero) {
    const enoughData = this.data.length >= this.requiredLength; // strict more than ?
    if (!enoughData) { return; }

    const matchIndex = this.data.indexOf(this.pattern, ignoreMatchZero ? 1 : 0);
    if (matchIndex >= 0 && matchIndex + this.requiredLength > this.data.length) {
        if (matchIndex > 0) {
            var packet = this.data.slice(0, matchIndex);
            this.push(packet);
            this.bytesSoFar += matchIndex;
            this.data = this.data.slice(matchIndex);
        }
        return;
    }

    if (matchIndex === -1) {
        const packetLen = this.data.length - this.requiredLength + 1;

        var packet = this.data.slice(0, packetLen);
        this.push(packet);
        this.bytesSoFar += packetLen;
        this.data = this.data.slice(packetLen);
        return;
    }

    // found match
    if (matchIndex > 0) {
        var packet = this.data.slice(0, matchIndex);
        this.data = this.data.slice(matchIndex);
        this.push(packet);
        this.bytesSoFar += matchIndex;
    }

    const finished = this.matchFn ? this.matchFn(this.data, this.bytesSoFar) : true;
    if (finished) {
        this.data = Buffer.from("");
        return;
    }

    return true;
};

MatcherStream.prototype._transform = function (chunk, encoding, cb) {
    this.data = Buffer.concat([this.data, chunk]);

    let firstIteration = true;
    while (this.checkDataChunk(!firstIteration)) {
        firstIteration = false;
    }

    cb();
};

MatcherStream.prototype._flush = function (cb) {
    if (this.data.length > 0) {
        let firstIteration = true;
        while (this.checkDataChunk(!firstIteration)) {
            firstIteration = false;
        }
    }

    if (this.data.length > 0) {
        this.push(this.data);
        this.data = null;
    }

    cb();
};

module.exports = MatcherStream;
