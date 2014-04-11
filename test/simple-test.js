var test = require('tape');
var Buffr = require('../');
var fs = require('fs');
var path = require('path');

var txt = path.join(__dirname, 'fixtures', 'whatever.txt');

test('Pipe something to a buffr and then see if we have gained data on the nextTick', function (t) {
  t.plan(1);

  var buf = fs.createReadStream(txt)
    .pipe(new Buffr());

  setTimeout(function () {
    t.ok(buf.chunks.length > 0, 'we have gained chunks after 50ms');
  }, 50);
});
