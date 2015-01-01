easy-livereload
===============

This is yet another library to use [livereload](http://livereload.com/)
very easily for express/node.js-based development.
It is express middleware which provides both
a livereload server and a javascript client.
It is designed to be used with [node-dev](https://www.npmjs.com/package/node-dev)
so that restarting a server process is also possible.

The major features of this library include:

- using livereload (PROTOCOL 7) server code from the original author,
- using livereload.js client code from the original author,
- using fs.watch() to check file changes instantly,
- allowing to automatically restart server code (if invoked with node-dev), and
- all-in-one package to enable with at least one-line code.

Install
-------

    $ npm install easy-livereload node-dev

Usage
-----

Minimal configuration:

    app.use(require('easy-livereload')());

Typical configuration:

    var path = require('path');
    var express = require('express');
    var app = express();
    if (app.get('env') === 'development') {
      app.use(require('easy-livereload')({
        watchDirs: [
          path.join(__dirname, 'public'),
          path.join(__dirname, 'views')
        ],
        checkFunc: function(file) {
          return /\.(css|js|jade)$/.test(file);
        },
        renameFunc: function(file) {
          return file.replace(/\.jade$/, '.html');
        },
        port: process.env.LIVERELOAD_PORT || 35729
      }));
    }

Example scripts entry in package.json:

    "scripts": {
      "start": "env NODE_ENV=production node app.js",
      "start-dev": "env NODE_ENV=development node-dev app.js"
    }

