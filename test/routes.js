var config = require('../config'),
    util = require('util'),
    request = require('supertest');

describe('Routes: ', function () {
  var url = util.format('http://%s:%d', config.hostname, config.port);

  before(function (done) {
    console.log('Environment set to %s', config.env);
    console.log('Testing app at url: %s', url);
    done();
  });

  describe('get',function(){
    describe('\'/\'', function () {
      it('should return 404', function (done) {
        request(url).
            get('/').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(404);
                  done();
                });
      });
    });
    describe('\'/api\'', function () {
      it('should return welcome message. :)', function (done) {
        request(url).
            get('/api').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(200);
                  res.text.should.include('Welcome to the travis-notification-hub API !!!1');
                  done();
                });
      });
    });
  });

});
