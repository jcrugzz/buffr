var Duplex = require('stream').Duplex;
var inherits = require('util').inherits;

module.exports = Buffr;

inherits(Buffr, Duplex);

function Buffr (chunks) {
  if (!(this instanceof Buffr)) { return new Buffr(chunks) }
  Duplex.call(this);

  this.chunks = chunks || [];

  this.chunks = !Array.isArray(this.chunks)
    ? [this.chunks]
    : this.chunks;

  this.on('pipe', this._onPipe.bind(this));
  if(this.chunks.length) {
    this.load();
  }
}

//
// Load chunks that were passed into the constructor as a new stream
//
Buffr.prototype.load = function () {
  for(var i=0; i<this.chunks.length; i++) {
    this.push(this.chunks[i]);
  }
  this.push(null);
};

//
// If we are piped to buffer those chunks in our own array JUST for duplication
// purposes
//
Buffr.prototype._onPipe = function (src) {
  var self = this;

  src.on('data', function (data) {
    self.chunks.push(data);
    self.push(data);
  });

  src.on('end', function () {
    self.push(null);
  });

};

Buffr.prototype.duplicate = function () {
  return new Buffr(this.chunks);
};

//
// Destroy the internal buffer and end the stream
//
Buffr.prototype.destroy = function () {
  this.chunks.length = 0;
};

//
// Ignore this because we just care when we are piped to and doing our own shit
// because obviously internally they can't figure it out
//
Buffr.prototype._write = function (data, enc, cb) {};

Buffr.prototype._read = function (n) {}
