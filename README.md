# buffr

A sorta proper [`Duplex`][duplex] stream useful for piping into, duplicating and
destroying. The reason this exists is because there is some weird timing issue
in how back pressure is handled preventing [`bl`][bl] from handling the case of
being piped into and then piped somewhere else. This is super apparent when
dealing with requests.

```js

var http = require('http');
var buffr = require('buffr');

//
// While this is not very useful, this will actually work and we will store the
// request in the `buf` stream if we need to duplicate and repipe.
//
http.createServer(function (req, res) {
  var buf = req.pipe(buffr())
  buf.pipe(res);
}).listen(3000);
```

[duplex]: http://nodejs.org/api/stream.html#stream_class_stream_duplex
[bl]: https://github.com/rvagg/bl
