/* eslint-env mocha */

var express = require('express');
var request = require('supertest');
var livereload = require('../index.js');

var app = express();

var port = process.env.LIVERELOAD_TEST_PORT || 45729;
app.use(livereload({
  port: port,
  watchDirs: ['./']
}));

app.get('/', function(req, res) {
  res.send('<html><head><title>test</title></head><body><h1>test</h1></body></html');
});

app.listen(process.env.PORT || 27892);

describe('basic test', function() {
  it('should include livereload script code', function(done) {
    request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(/livereload/)
      .end(function(err) {
        if (err) return done(err);
        done();
      });
  });

  it('should have livereload server available', function(done) {
    request('http://localhost:' + port)
      .get('/')
      .expect(404)
      .end(function(err) {
        if (err) return done(err);
        done();
      });
  });

  it('should be able to load livereload.js', function(done) {
    request('http://localhost:' + port)
      .get('/livereload.js')
      .expect(200)
      .expect('Content-Type', /javascript/)
      .expect(/PROTOCOL_7/)
      .end(function(err) {
        if (err) return done(err);
        done();
      });
  });
});
