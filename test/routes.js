var config = require('../config'),
    util = require('util'),
    app = require('../app'),
    request = require('supertest');

describe('Routes: ', function () {
  var url = util.format('http://%s:%d', config.hostname, config.port),
      iOSEnabledDevice01 = {
        "deviceId" : "Device01",
        "name"     : "iOS Device 01",
        "platform" : "iOS",
        "iOS"      : {
          "pushBadge"   : "1",
          "pushSound"   : "1",
          "pushAlert"   : "1",
          "enabled"     : "1",
          "deviceToken" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001"
        }
      },
      iOSEnabledDevice02 = {
        "deviceId" : "Device02",
        "name"     : "iOS Device 02",
        "platform" : "iOS",
        "iOS"      : {
          "pushBadge"   : "1",
          "pushSound"   : "1",
          "pushAlert"   : "1",
          "enabled"     : "1",
          "deviceToken" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000002"
        }
      },
      iOSDisabledDevice = {
        "deviceId" : "Device03",
        "name"     : "iOS Device 03",
        "platform" : "iOS",
        "iOS"      : {
          "pushBadge"   : "1",
          "pushSound"   : "1",
          "pushAlert"   : "1",
          "enabled"     : "0",
          "deviceToken" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003"
        }
      },
      androidDevice01 = {
        "deviceId" : "Device04",
        "name"     : "Android Device 04",
        "platform" : "Android",
        "android"  : {
          "registrationId" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000004"
        }
      },
      androidDevice02 = {
        "deviceId" : "Device05",
        "name"     : "Android Device 05",
        "platform" : "Android",
        "android"  : {
          "registrationId" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000005"
        }
      };

  before(function (done) {
    console.log('Environment set to %s', config.env);
    console.log('Starting app...');
    app.start();
    console.log('Testing app at url: %s', url);
    console.log('Dropping database collections \'device\' and \'repos\'...');
    app.connection.collections['devices'].drop(function (err) {
      console.log('collection \'devices\' dropped');
      app.connection.collections['repos'].drop(function (err) {
        console.log('collection \'repos\' dropped');
        done();
      });
    });
  });

  describe('get', function () {
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

  describe('Devices: put', function () {
    describe('\'/api/devices/:deviceId\' with empty payload', function () {
      it('should return bad request (400). :)', function (done) {
        request(url).
            put('/api/devices/Device01').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with incorrect payload', function () {
      it('should return bad request (400). :)', function (done) {
        request(url).
            put('/api/devices/Device01').
            send(iOSEnabledDevice02).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with iOSDevice01 as payload', function () {
      it('should create successfully (201) and return iOSDevice01. :)', function (done) {
        request(url).
            put('/api/devices/Device01').
            send(iOSEnabledDevice01).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  done();
                });
      });
    });

  });

});
