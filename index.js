/*
  Copyright (C) 2014, Daishi Kato <daishi@axlight.com>
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
  A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
  HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var fs = require('fs');
var path = require('path');
var LRWebSocketServer = require('livereload-server');
var watch = require('node-watch');
var bodyRewrite = require('connect-body-rewrite');

var lrserver = null;

function startLRServer(options) {
  if (lrserver) return;

  options.livereload = options.livereload || {};
  lrserver = new LRWebSocketServer({
    id: options.livereload.id || 'default id',
    name: options.livereload.name || 'default name',
    version: options.livereload.version || '1.0',
    protocols: {
      monitoring: 7,
      saving: 1
    },
    port: options.port
  });

  lrserver.on('livereload.js', function(req, res) {
    fs.readFile(path.join(require.resolve('livereload-js'), '../../', 'dist', 'livereload.js'), 'utf8', function(err, data) {
      if (err) throw err;
      res.writeHead(200, {
        'Content-Length': data.length,
        'Content-Type': 'text/javascript'
      });
      res.end(data);
    });
  });

  lrserver.on('httprequest', function(url, req, res) {
    res.writeHead(404);
    res.end();
  });

  lrserver.listen(function(err) {
    if (err) throw err;
  });

  var sendAll = function(command) {
    Object.keys(lrserver.connections).forEach(function(id) {
      try {
        lrserver.connections[id].send(command);
      } catch (e) {
        console.error('Livereload send command failed: %s', id);
      }
    });
  };

  options.watchDirs.forEach(function(dir) {
    watch(dir, function(file) {
      file = path.relative(dir, file);
      if (options.checkFunc(file)) {
        sendAll({
          command: 'reload',
          path: options.renameFunc(file),
          liveCSS: true
        });
      }
    });
  });
}

module.exports = function(options) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 35729;
  options.restartTimeout = options.restartTimeout || 1000;
  options.reloadTimeout = options.reloadTimeout || 500;
  options.watchDirs = options.watchDirs || ['public'];
  options.checkFunc = options.checkFunc || function(x) {
    return /\.(css|js)$/.test(x);
  };
  options.renameFunc = options.renameFunc || function(x) {
    return x;
  };

  var code = '<script>document.write(\'<script src="//\' + (location.host || \'' + options.host + '\').split(\':\')[0] + \':' + options.port + '/livereload.js?snipver=1"></\' + \'script>\')</script>';
  code += '<script>document.addEventListener(\'LiveReloadDisconnect\', function() { setTimeout(function() { window.location.reload(); }, ' + options.reloadTimeout + '); })</script>';

  if (options.app) {
    options.app.locals.LRScript = code;
  }

  if (options.restartTimeout > 0) {
    process.on('SIGTERM', function() {
      setTimeout(function() {
        process.exit(0);
      }, options.restartTimeout);
    });
  }

  startLRServer(options);

  return bodyRewrite({
    accept: function(res) {
      return res.getHeader('content-type').match(/text\/html/);
    },
    rewrite: function(body) {
      return body.replace(/<\/body>/, code + '</body>');
    }
  });
};
