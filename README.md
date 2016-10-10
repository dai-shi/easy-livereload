easy-livereload
===============

[![Build Status](https://travis-ci.org/dai-shi/easy-livereload.svg?branch=master)](https://travis-ci.org/dai-shi/easy-livereload)
[![npm version](https://badge.fury.io/js/easy-livereload.svg)](https://badge.fury.io/js/easy-livereload)

This is yet another library to use [livereload](http://livereload.com/)
very easily for express/node.js-based development.
It is express middleware which provides both
a livereload server and a javascript client.
It is designed to be used with
[node-dev](https://www.npmjs.com/package/node-dev)
so that restarting a server process is also possible.

The major features of this library include:

- using livereload (PROTOCOL 7) server code from the original author,
- using livereload.js client code from the original author,
- using fs.watch() to check file changes instantly,
- allowing to automatically restart server code (if invoked with node-dev), and
- all-in-one package to enable with at least one-line code.

Install
-------

```bash
npm install easy-livereload node-dev
```

Usage
-----

Minimal configuration:

```js
app.use(require('easy-livereload')());
```

Typical configuration:

```js
var path = require('path');
var express = require('express');
var app = express();

if (app.get('env') === 'development') {
  var livereload = require('easy-livereload');
  var file_type_map = {
    jade: 'html', // `index.jade` maps to `index.html`
    styl: 'css', // `styles/site.styl` maps to `styles/site.css`
    scss: 'css', // `styles/site.scss` maps to `styles/site.css`
    sass: 'css', // `styles/site.scss` maps to `styles/site.css`
    less: 'css' // `styles/site.scss` maps to `styles/site.css`
    // add the file type being edited and what you want it to be mapped to.
  };
  
  // store the generated regex of the object keys
  var file_type_regex = new RegExp('\\.(' + Object.keys(file_type_map).join('|') + ')$');
  
  app.use(livereload({
    watchDirs: [
      path.join(__dirname, 'public'),
      path.join(__dirname, 'app')
    ],
    checkFunc: function(file) {
      return file_type_regex.test(file);
    },
    renameFunc: function(file) {
      // remap extention of the file path to one of the extentions in `file_type_map`
      return file.replace(file_type_regex, function(extention) {
        return '.' + file_type_map[extention.slice(1)];
      });
    },
    port: process.env.LIVERELOAD_PORT || 35729
  }));
}
```

By default this script tries to load the live reload script itself,
but if that doesn't work for some reason then you can put your `app`
into the `easy-livereload` options.
This will add a local variable to your `app` under `app.locals.LRScript`.

```js
var express = require('express');
var app = express();
var livereload = require('easy-livereload');

if (app.get('env') === 'development') {
  app.use(livereload({
    app: app
  }));
}
```

```jade
doctype html
html(lang="en")
  head
    title Livereload
    
    != LRScript //- loads the livereload script
```


Example scripts entry in `package.json`:

```json
"scripts": {
  "start": "NODE_ENV=production node app.js",
  "start-dev": "NODE_ENV=development node-dev app.js"
}
```
