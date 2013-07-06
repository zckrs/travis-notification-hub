var config = require('../config'),
    util = require('util'),
    app = require('../app'),
    Device = require('../models/device'),
    Repo = require('../models/repo'),
    request = require('supertest');

describe('hub tests: ', function () {
  var url = util.format('http://%s:%d', config.hostname, config.port),
      findDevice = function (condition, callback) {
        Device.find(condition, function (err, devices) {
          if (err) { throw err; }
          else {
            callback(devices);
          }
        });
      },
      findAllDevices = function (callback) {
        Device.find(function (err, devices) {
          if (err) { throw err; }
          else {
            callback(devices);
          }
        });
      },
      findRepo = function (condition, callback) {
        Repo.find(condition, function (err, repos) {
          if (err) { throw err; }
          else {
            callback(repos);
          }
        });
      },
      findAllRepos = function (callback) {
        Repo.find(function (err, repos) {
          if (err) { throw err; }
          else {
            callback(repos);
          }
        });
      },
      createDeviceRepoPayload = function (device, repo) {
        return {
          deviceId : device.deviceId,
          repo     : repo
        };
      },
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
      androidDevice03 = {
        "deviceId" : "Device06",
        "name"     : "Android Device 06",
        "platform" : "Android"
      },
      repo01 = {
        "repoId" : "Repo001",
        "name"   : "floydpink/travis-notification-hub"
      },
      repo02 = {
        "repoId" : "Repo002",
        "name"   : "floydpink/Travis-CI"
      },
      repo03 = {
        "repoId" : "Repo003",
        "name"   : "floydpink/Travis-CI-iOS"
      };

  before(function (done) {
    console.log('Environment set to %s', config.env);
    console.log('Starting app...');
    app.start();
    console.log('Testing app at url: %s', url);
    console.log('Dropping database collections \'device\' and \'repos\'...');
    app.connection.collections['devices'].drop(function () {
      console.log('collection \'devices\' dropped');
      app.connection.collections['repos'].drop(function () {
        console.log('collection \'repos\' dropped');
        done();
      });
    });
  });

  describe('API: ', function () {
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
      it('should return welcome message', function (done) {
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

  describe('Database at startup: ', function () {
    describe('devices', function () {
      it('should be empty', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(0);
          done();
        });
      });
    });
    describe('repos', function () {
      it('should be empty', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
  });

  describe('Devices: put', function () {
    describe('\'/api/devices/:deviceId\' with empty payload', function () {
      it('should return bad request (400)', function (done) {
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
      it('should return bad request (400)', function (done) {
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
      it('should throw error (500)', function (done) {
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
      it('should create successfully (201)', function (done) {
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
                  res.body.device.iOS.deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with modified iOSDevice01 as payload', function () {
      it('should update successfully (200)', function (done) {
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
    describe('\'/api/devices/:deviceId\' with iOSDevice02 as payload', function () {
      it('should create successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device02').
            send(iOSEnabledDevice02).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(201);
                  res.body.status.should.include('Registered new device');
                  res.body.device.deviceId.should.eql('Device02');
                  res.body.device.name.should.eql('iOS Device 02');
                  res.body.device.repos.should.eql([]);
                  res.body.device.iOS.deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000002');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with iOSDisabledDevice as payload', function () {
      it('should create (201) and set enabled as \'0\'', function (done) {
        request(url).
            put('/api/devices/Device03').
            send(iOSDisabledDevice).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(201);
                  res.body.device.should.have.property('iOS');
                  res.body.device.iOS.should.have.property('enabled');
                  res.body.device.deviceId.should.eql('Device03');
                  res.body.device.name.should.eql('iOS Device 03');
                  res.body.device.platform.should.eql('iOS');
                  res.body.device.repos.should.eql([]);
                  res.body.device.iOS.deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003');
                  res.body.device.iOS.enabled.should.eql('0');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId\' with androidDevice01 as payload', function () {
      it('should create successfully (201) with all default properties', function (done) {
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
      it('should create successfully (201)', function (done) {
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
    describe('\'/api/devices/:deviceId\' with androidDevice03 as payload', function () {
      it('should create successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device06').
            send(androidDevice03).
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
                  res.body.device.name.should.eql('Android Device 06');
                  res.body.device.platform.should.eql('Android');
                  res.body.device.repos.should.eql([]);
                  res.body.device.android.registrationId.should.eql('');
                  done();
                });
      });
    });

  });

  describe('Database now: ', function () {
    describe('devices collection', function () {
      it('should have the 6 test devices', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should still be empty', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
    describe('iOS devices', function () {
      it('should be equal to 3', function (done) {
        findDevice({ platform : 'iOS' }, function (devices) {
          devices.length.should.be.eql(3);
          done();
        });
      });
    });
    describe('Enabled iOS devices', function () {
      it('should be equal to 2', function (done) {
        findDevice(
            {
              $and : [
                { platform : 'iOS' },
                { "iOS.enabled" : '1' }
              ]
            },
            function (devices) {
              devices.length.should.be.eql(2);
              done();
            });
      });
    });
    describe('Android devices', function () {
      it('should be equal to 3', function (done) {
        findDevice({ platform : 'Android' }, function (devices) {
          devices.length.should.be.eql(3);
          done();
        });
      });
    });
    describe('devices collection', function () {
      it('should all have pushCount of 0', function (done) {
        findDevice({ pushCount : '0' }, function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
      it('should all have badgeCount of 0', function (done) {
        findDevice({ badgeCount : '0' }, function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
  });

  describe('Repos: put', function () {
    describe('\'/api/devices/:deviceId/repos/:repoId\' with empty payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/123456').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with incorrect payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/somerepoId').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' without repo in payload', function () {
      it('should throw error (500)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/somerepoId').
            send(iOSEnabledDevice01).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(500);
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device01 and repo01', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device01');
                  res.body.device.name.should.be.eql('Modified Device 01');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device02 and repo01', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device02/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice02, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device02');
                  res.body.device.name.should.be.eql('iOS Device 02');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device03 and repo01', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device03/repos/Repo001').
            send(createDeviceRepoPayload(iOSDisabledDevice, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device03');
                  res.body.device.name.should.be.eql('iOS Device 03');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device04 and repo01', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device04/repos/Repo001').
            send(createDeviceRepoPayload(androidDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device04');
                  res.body.device.name.should.be.eql('Android Device 04');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device05 and repo01', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device05/repos/Repo001').
            send(createDeviceRepoPayload(androidDevice02, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device05');
                  res.body.device.name.should.be.eql('Android Device 05');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device04 and repo02', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device04/repos/Repo002').
            send(createDeviceRepoPayload(androidDevice01, repo02)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device04');
                  res.body.device.name.should.be.eql('Android Device 04');
                  res.body.device.repos.length.should.be.eql(2);
                  res.body.device.repos.should.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
    describe('\'/api/devices/:deviceId/repos/:repoId\' with Device06 and repo02', function () {
      it('should create repo successfully (201)', function (done) {
        request(url).
            put('/api/devices/Device06/repos/Repo002').
            send(createDeviceRepoPayload(androidDevice03, repo02)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device06');
                  res.body.device.name.should.be.eql('Android Device 06');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
  });

  describe('Database now: ', function () {
    describe('devices collection', function () {
      it('should still have the 6 test devices', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should now have the 2 test repos', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(2);
          done();
        });
      });
    });
    //describe('Repo001')

  });

});
