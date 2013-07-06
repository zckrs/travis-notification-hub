/* jshint expr: true */
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
      },
      iOSEnabledDevice06 = {
        "deviceId" : "Device06",
        "name"     : "iOS Device 06",
        "platform" : "iOS"
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

  describe('API', function () {
    describe('get \'/\'', function () {
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
    describe('get \'/api\'', function () {
      it('should return welcome message.', function (done) {
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
      it('should return bad request (400).', function (done) {
        request(url).
            put('/api/devices/Device01').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with incorrect payload', function () {
      it('should return bad request (400).', function (done) {
        request(url).
            put('/api/devices/Device01').
            send(iOSEnabledDevice02).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' without platform in payload', function () {
      it('should return throw error (500).', function (done) {
        request(url).
            put('/api/devices/DeviceAB').
            send({ "deviceId" : "DeviceAB"}).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(500);
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with iOSDevice01 as payload', function () {
      it('should create successfully (201) and return iOSDevice01.', function (done) {
        request(url).
            put('/api/devices/Device01').
            send(iOSEnabledDevice01).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(201);
                  res.body.status.should.include('Registered new device');
                  res.body.device.deviceId.should.eql('Device01');
                  res.body.device.name.should.eql('iOS Device 01');
                  res.body.device.repos.should.eql([]);
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with modified iOSDevice01 as payload', function () {
      it('should update successfully (200) and return iOSDevice01.', function (done) {
        var modifiedDevice = JSON.parse(JSON.stringify(iOSEnabledDevice01));
        modifiedDevice.name = 'Modified Device 01';
        request(url).
            put('/api/devices/Device01').
            send(modifiedDevice).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Updated existing device');
                  res.body.device.name.should.eql('Modified Device 01');
                  res.body.device.created.should.not.eql(res.body.device.updated);
                  res.body.device.iOS.deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001');

                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with iOSDevice06 as payload', function () {
      it('should create (201) with more properties.', function (done) {
        request(url).
            put('/api/devices/Device06').
            send(iOSEnabledDevice06).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(201);
                  res.body.device.should.have.property('deviceId');
                  res.body.device.should.have.property('name');
                  res.body.device.should.have.property('platform');
                  res.body.device.should.have.property('iOS');
                  res.body.device.iOS.should.have.property('deviceToken');
                  res.body.device.iOS.should.have.property('enabled');
                  res.body.device.iOS.should.have.property('pushAlert');
                  res.body.device.iOS.should.have.property('pushBadge');
                  res.body.device.iOS.should.have.property('pushSound');
                  res.body.device.should.have.property('android');
                  res.body.device.android.should.have.property('registrationId');
                  res.body.device.should.have.property('badgeCount');
                  res.body.device.should.have.property('pushCount');
                  res.body.device.should.have.property('repos');
                  res.body.device.should.have.property('created');
                  res.body.device.should.have.property('updated');
                  res.body.device.deviceId.should.eql('Device06');
                  res.body.device.name.should.eql('iOS Device 06');
                  res.body.device.platform.should.eql('iOS');
                  res.body.device.repos.should.eql([]);
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with androidDevice01 as payload', function () {
      it('should create (201) with more properties.', function (done) {
        request(url).
            put('/api/devices/Device04').
            send(androidDevice01).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(201);
                  res.body.device.should.have.property('deviceId');
                  res.body.device.should.have.property('name');
                  res.body.device.should.have.property('platform');
                  res.body.device.should.have.property('iOS');
                  res.body.device.iOS.should.have.property('deviceToken');
                  res.body.device.iOS.should.have.property('enabled');
                  res.body.device.iOS.should.have.property('pushAlert');
                  res.body.device.iOS.should.have.property('pushBadge');
                  res.body.device.iOS.should.have.property('pushSound');
                  res.body.device.should.have.property('android');
                  res.body.device.android.should.have.property('registrationId');
                  res.body.device.should.have.property('badgeCount');
                  res.body.device.should.have.property('pushCount');
                  res.body.device.should.have.property('repos');
                  res.body.device.should.have.property('created');
                  res.body.device.should.have.property('updated');
                  res.body.device.deviceId.should.eql('Device04');
                  res.body.device.name.should.eql('Android Device 04');
                  res.body.device.platform.should.eql('Android');
                  res.body.device.repos.should.eql([]);
                  res.body.device.android.registrationId.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000004');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with androidDevice02 as payload', function () {
      it('should create (201) with more properties.', function (done) {
        request(url).
            put('/api/devices/Device05').
            send(androidDevice02).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(201);
                  res.body.device.name.should.eql('Android Device 05');
                  res.body.device.platform.should.eql('Android');
                  res.body.device.repos.should.eql([]);
                  res.body.device.android.registrationId.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000005');
                  done();
                });
      });
    });

  });

});
