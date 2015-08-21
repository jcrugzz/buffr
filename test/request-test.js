var http = require('http');
var url = require('url');
var PassThrough = require('stream').PassThrough;
var Buffr = require('../');
var BufferedStream = require('buffered').BufferedStream;
var bl = require('bl');
var concat = require('concat-stream');
var test = require('tape');
var HttpProxy = require('http-proxy');


test('request a server, buffer the request and respond appropriately', function (t) {
  t.plan(1);
  var payload = { payload: 'son', wtf: 'isUpi' };
  var server = http.createServer(function (req, res) {
    var buffer = req.pipe(new Buffr());
    buffer.pipe(res);
  });

  server.listen(3000, request.bind(null, payload, 3000));

  function request (payload, port) {
    var opts = url.parse('http://localhost:' + port);
    var buf = new Buffer(JSON.stringify(payload), 'utf8');
    opts.method = 'POST';
    opts.headers = {
      'content-type': 'application/json',
      'content-length': buf.length
    };
    var req = http.request(opts);
    req.on('error', cleanup)
    req.on('response', response);
    req.end(buf);
  }

  function response (res) {
    res.pipe(concat(function (data) {
      try { data = JSON.parse(data) }
      catch (ex) { return cleanup(ex) }

      t.deepEqual(payload, data, 'Response matches request');
      cleanup();
    }))
  }

  function cleanup (err) {
    if (err) {
      return t.fail(err.message);
    }
    server.close();
  }
});

test('request a server that proxies to another server, should proxy correctly and return the initial data', function (t) {
  t.plan(1);
  var server,
      payload = { wtf: 'bro', whats: 'your deal' };

  var proxy = new HttpProxy();
  proxy.on('error', cleanup);

  var proxyServer = http.createServer(function (req, res) {
    process.nextTick(function () {
      req.pipe(res);
    });
  });

  proxyServer.listen(3001, next);

  function next() {
    server = http.createServer(function (req, res) {
      var buffer = req.pipe(new Buffr());
      proxy.web(req, res, {
        target: 'http://localhost:3001',
        buffer: buffer
      });
    });

    server.listen(3002, request.bind(null, payload, 3002));
  }

  function request (payload, port) {
    var opts = url.parse('http://localhost:' + port);
    var buf = new Buffer(JSON.stringify(payload), 'utf8');
    opts.method = 'POST';
    opts.headers = {
      'content-type': 'application/json',
      'content-length': buf.length
    };
    var req = http.request(opts);
    req.on('error', cleanup)
    req.on('response', response);
    req.end(buf);
  }

  function response (res) {
    res.pipe(concat(function (data) {
      try { data = JSON.parse(data) }
      catch (ex) { return cleanup(ex) }

      t.deepEqual(data, payload, 'proxy payload returns as same data');
      cleanup();
    }))
  }

  function cleanup (err) {
    if (err) {
      return t.fail(err.message);
    }
    server.close();
    proxyServer.close();
  }
});

test('correctly duplicate buffer after a failed request since we save chunks in the buffer', function (t) {
  t.plan(2);
  var server,
      payload = { wtf: 'bro', whats: 'your deal' },
      buffer;

  var proxy = new HttpProxy();
  proxy.on('error', retry);

  var proxyServer = http.createServer(function (req, res) {
    process.nextTick(function () {
      req.pipe(res);
    });
  });

  server = http.createServer(function (req, res) {
    buffer = req.pipe(new Buffr());
    proxy.web(req, res, {
      target: 'http://localhost:3003',
      buffer: buffer
    });
  });

  function retry (err, req, res) {
    t.ok(err, 'Correctly errored, retrying..')
    proxyServer.listen(3003, function () {
      proxy.web(req, res, {
        target: 'http://localhost:3003',
        buffer: buffer.duplicate()
      })
    })
  }

  server.listen(3004, request.bind(null, payload, 3004));

  function request (payload, port) {
    var opts = url.parse('http://localhost:' + port);
    var buf = new Buffer(JSON.stringify(payload), 'utf8');
    opts.method = 'POST';
    opts.headers = {
      'content-type': 'application/json',
      'content-length': buf.length
    };
    var req = http.request(opts);
    req.on('error', cleanup)
    req.on('response', response);
    req.end(buf);
  }

  function response (res) {
    res.pipe(concat(function (data) {
      try { data = JSON.parse(data) }
      catch (ex) { return cleanup(ex) }

      t.deepEqual(data, payload, 'proxy payload returns as same data');
      cleanup();
    }))
  }

  function cleanup (err) {
    if (err) {
      return t.fail(err.message);
    }
    server.close();
    proxyServer.close();
  }
});

test('successfully retry on a GET request', function (t) {
  t.plan(2);
  var server,
      buffer;

  var proxy = new HttpProxy();
  proxy.on('error', retry);

  var proxyServer = http.createServer(function (req, res) {
    process.nextTick(function () {
      req.pipe(res);
    });
  });

  server = http.createServer(function (req, res) {
    buffer = req.pipe(new Buffr());
    proxy.web(req, res, {
      target: 'http://localhost:3003',
      buffer: buffer
    });
  });

  function retry (err, req, res) {
    t.ok(err, 'Correctly errored, retrying..')
    proxyServer.listen(3003, function () {
      proxy.web(req, res, {
        target: 'http://localhost:3003',
        buffer: buffer.duplicate()
      })
    })
  }

  server.listen(3004, request.bind(null, 3004));

  function request (port) {
    req = http.get('http://localhost:' + port, response);
  }

  function response (res) {
    t.ok(true);
    cleanup();
  }

  function cleanup (err) {
    if (err) {
      return t.fail(err.message);
    }
    server.close();
    proxyServer.close();
  }
});
