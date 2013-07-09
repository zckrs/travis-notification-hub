/* jshint expr: true */
var config = require('../config'),
    util = require('util'),
    proxyquire = require('proxyquire'),
    gcmNotifications = [],
    apnNotifications = [],
    gcmPushMock = function (registrationId, message, badgeNumber, payload) {
      gcmNotifications.push({
                              registrationId : registrationId,
                              message        : message,
                              badgeNumber    : badgeNumber,
                              payload        : payload
                            });
    },
    apnPushMock = function (deviceToken, message, badgeNumber, payload) {
      apnNotifications.push({
                              deviceToken : deviceToken,
                              message     : message,
                              badgeNumber : badgeNumber,
                              payload     : payload
                            });
    },
    push = proxyquire('../push',
                      {
                        './gcms' : { push : gcmPushMock },
                        './apns' : { push : apnPushMock }
                      }),
    notifications = proxyquire('../routes/notifications', { '../../push' : push }),
    routes = proxyquire('../routes', {'./notifications' : notifications }),
    app = proxyquire('../app', {'./routes' : routes }),
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
        "deviceId"        : "Device06",
        "name"            : "Android Device 06",
        "platform"        : "Android",
        "notifyAllBuilds" : true
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

  afterEach(function (done) {
    gcmNotifications = [];
    apnNotifications = [];
    done();
  });

  describe('Routes  : API Root:    ', function () {
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
      it('should be welcoming', function (done) {
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

  describe('Database: Start        :', function () {
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

  describe('Routes  : Device       : put', function () {
    describe('\'devices/:deviceId\' with empty payload', function () {
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
    describe('\'devices/:deviceId\' with incorrect payload', function () {
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
    describe('\'devices/:deviceId\' without platform', function () {
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
    describe('\'devices/:deviceId\' with iOSDevice01', function () {
      it('should create (201)', function (done) {
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
    describe('\'devices/:deviceId\' with modified iOSDevice01', function () {
      it('should update (200)', function (done) {
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
    describe('\'devices/:deviceId\' with iOSDevice02', function () {
      it('should create (201)', function (done) {
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
    describe('\'devices/:deviceId\' with iOSDisabledDevice', function () {
      it('should create (201) with enabled = \'0\'', function (done) {
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
    describe('\'devices/:deviceId\' with androidDevice01', function () {
      it('should create (201) with all properties', function (done) {
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
    describe('\'devices/:deviceId\' with androidDevice02', function () {
      it('should create (201)', function (done) {
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
    describe('\'devices/:deviceId\' with androidDevice03', function () {
      it('should create (201)', function (done) {
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

  describe('Database: Now          :', function () {
    describe('devices collection', function () {
      it('should have the 6 devices', function (done) {
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
      it('should be 3', function (done) {
        findDevice({ platform : 'iOS' }, function (devices) {
          devices.length.should.be.eql(3);
          done();
        });
      });
    });
    describe('Enabled iOS devices', function () {
      it('should be 2', function (done) {
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
      it('should be 3', function (done) {
        findDevice({ platform : 'Android' }, function (devices) {
          devices.length.should.be.eql(3);
          done();
        });
      });
    });
    describe('devices collection', function () {
      it('should all have 0 pushCount', function (done) {
        findDevice({ pushCount : '0' }, function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
      it('should all have badgeCount', function (done) {
        findDevice({ badgeCount : '0' }, function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
  });

  describe('Routes  : Repo         : put', function () {
    describe('\'repos/:repoId\' with empty payload', function () {
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
    describe('\'repos/:repoId\' with incorrect payload', function () {
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
    describe('\'repos/:repoId\' without repo in payload', function () {
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
    describe('\'repos/:repoId\' with non existent device', function () {
      it('should return not found (404)', function (done) {
        request(url).
            put('/api/devices/AKNSKNAKNSJBJA/repos/Repo001').
            send(createDeviceRepoPayload({ deviceId : 'AKNSKNAKNSJBJA' }, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(404);
                  res.body.status.should.be.eql('Device not found');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device01 and repo01', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device01');
                  res.body.device.name.should.be.eql('Modified Device 01');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device02 and repo01', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device02/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice02, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device02');
                  res.body.device.name.should.be.eql('iOS Device 02');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device03 and repo01', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device03/repos/Repo001').
            send(createDeviceRepoPayload(iOSDisabledDevice, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device03');
                  res.body.device.name.should.be.eql('iOS Device 03');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device04 and repo01', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device04/repos/Repo001').
            send(createDeviceRepoPayload(androidDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device04');
                  res.body.device.name.should.be.eql('Android Device 04');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device05 and repo01', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device05/repos/Repo001').
            send(createDeviceRepoPayload(androidDevice02, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device05');
                  res.body.device.name.should.be.eql('Android Device 05');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device04 and repo02', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device04/repos/Repo002').
            send(createDeviceRepoPayload(androidDevice01, repo02)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device04');
                  res.body.device.name.should.be.eql('Android Device 04');
                  res.body.device.repos.length.should.be.eql(2);
                  res.body.device.repos.should.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device06 and repo02', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device06/repos/Repo002').
            send(createDeviceRepoPayload(androidDevice03, repo02)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device06');
                  res.body.device.name.should.be.eql('Android Device 06');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device01 and repo01 again', function () {
      it('should update (200)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(200);
                  res.body.status.should.be.eql('Device already subscribes to this repo.');
                  res.body.device.deviceId.should.be.eql('Device01');
                  res.body.device.name.should.be.eql('Modified Device 01');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device01 and repo02', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device01/repos/Repo002').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo02)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.status.should.be.eql('Repo subscribed');
                  res.body.device.deviceId.should.be.eql('Device01');
                  res.body.device.name.should.be.eql('Modified Device 01');
                  res.body.device.repos.length.should.be.eql(2);
                  res.body.device.repos.should.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
  });

  describe('Database: Now          :', function () {
    describe('devices collection', function () {
      it('should still have 6', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should now have 2', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(2);
          done();
        });
      });
    });
    describe('Repo001', function () {
      it('should be updated', function (done) {
        findRepo(repo01, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo001');
          repos[0].name.should.be.eql('floydpink/travis-notification-hub');
          repos[0].devicesSubscribed.should.be.eql(5);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo002', function () {
      it('should be updated', function (done) {
        findRepo(repo02, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo002');
          repos[0].name.should.be.eql('floydpink/Travis-CI');
          repos[0].devicesSubscribed.should.be.eql(3);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo003', function () {
      it('should not be present', function (done) {
        findRepo(repo03, function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
  });

  describe('Routes  : Notifications: post', function () {
    describe('\'notifications\' with empty payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            post('/api/notifications').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'notifications\' with incorrect payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            post('/api/notifications').
            send({}).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' missing', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            post('/api/notifications').
            send({ "buildFailed" : false }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'notifications\' with \'buildFailed\' missing', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo001" }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'notifications\' with non-boolean \'buildFailed\'', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo001", buildFailed : "false" }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'notifications\' with non-existent \'repoId\'', function () {
      it('should complete (200) with status', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo008", buildFailed : false }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('No devices subscribes for this build\'s notifications');
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' Repo001', function () {
      it('should complete (200) with no calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo001", buildFailed : false }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('No devices subscribes for this build\'s notifications');
                  gcmNotifications.length.should.be.eql(0);
                  apnNotifications.length.should.be.eql(0);
                  done();
                });
      });
    });
  });

  describe('Database: Now          :', function () {
    describe('devices collection', function () {
      it('should still have 6', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should still have 2', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(2);
          done();
        });
      });
    });
    describe('Repo001', function () {
      it('should not be updated', function (done) {
        findRepo(repo01, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo001');
          repos[0].name.should.be.eql('floydpink/travis-notification-hub');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(5);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo002', function () {
      it('should not be updated', function (done) {
        findRepo(repo02, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo002');
          repos[0].name.should.be.eql('floydpink/Travis-CI');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(3);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo003', function () {
      it('should still not be present', function (done) {
        findRepo(repo03, function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
  });

  describe('Routes  : Repo         : delete', function () {
    describe('\'repos/:repoId\' with empty payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            del('/api/devices/Device01/repos/123456').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with incorrect payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            del('/api/devices/Device01/repos/somerepoId').
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
    describe('\'repos/:repoId\' without repo in payload', function () {
      it('should throw error (500)', function (done) {
        request(url).
            del('/api/devices/Device01/repos/somerepoId').
            send(iOSEnabledDevice01).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(500);
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with non existent device', function () {
      it('should return not found (404)', function (done) {
        request(url).
            del('/api/devices/AKNSKNAKNSJBJA/repos/Repo001').
            send(createDeviceRepoPayload({ deviceId : 'AKNSKNAKNSJBJA' }, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(404);
                  res.body.status.should.be.eql('Device not found');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device01 and repo01', function () {
      it('should remove (200)', function (done) {
        request(url).
            del('/api/devices/Device01/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(200);
                  res.body.device.deviceId.should.be.eql('Device01');
                  res.body.device.name.should.be.eql('Modified Device 01');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.not.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device05 and repo01', function () {
      it('should remove (200)', function (done) {
        request(url).
            del('/api/devices/Device05/repos/Repo001').
            send(createDeviceRepoPayload(androidDevice02, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(200);
                  res.body.device.deviceId.should.be.eql('Device05');
                  res.body.device.name.should.be.eql('Android Device 05');
                  res.body.device.repos.length.should.be.eql(0);
                  res.body.device.repos.should.not.include('Repo001');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device01 and repo01 again', function () {
      it('should update (200)', function (done) {
        request(url).
            del('/api/devices/Device01/repos/Repo001').
            send(createDeviceRepoPayload(iOSEnabledDevice01, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(200);
                  res.body.status.should.be.eql('Device does not subscribe to this repo.');
                  res.body.device.deviceId.should.be.eql('Device01');
                  res.body.device.name.should.be.eql('Modified Device 01');
                  res.body.device.repos.length.should.be.eql(1);
                  res.body.device.repos.should.not.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
  });

  describe('Database: Now          :', function () {
    describe('devices collection', function () {
      it('should still have 6', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should still have 2', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(2);
          done();
        });
      });
    });
    describe('Repo001', function () {
      it('should be updated', function (done) {
        findRepo(repo01, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo001');
          repos[0].name.should.be.eql('floydpink/travis-notification-hub');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(3);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo002', function () {
      it('should not be updated', function (done) {
        findRepo(repo02, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo002');
          repos[0].name.should.be.eql('floydpink/Travis-CI');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(3);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo003', function () {
      it('should still not be present', function (done) {
        findRepo(repo03, function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
  });

  describe('Routes  : Repos        : delete', function () {
    describe('\'repos/\' with empty payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            del('/api/devices/Device01/repos').
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'repos/\' with incorrect payload', function () {
      it('should return bad request (400)', function (done) {
        request(url).
            del('/api/devices/Device01/repos').
            send({ someKey : 'someValue' }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(400);
                  res.body.error.should.include('Invalid Request');
                  done();
                });
      });
    });
    describe('\'repos/\' with non existent device', function () {
      it('should return not found (404)', function (done) {
        request(url).
            del('/api/devices/AKNSKNAKNSJBJA/repos').
            send({ deviceId : 'AKNSKNAKNSJBJA' }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(404);
                  res.body.status.should.be.eql('Device not found');
                  done();
                });
      });
    });
    describe('\'repos/\' with Device04', function () {
      it('should remove (200)', function (done) {
        request(url).
            del('/api/devices/Device04/repos').
            send({ deviceId : 'Device04' }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(200);
                  res.body.device.deviceId.should.be.eql('Device04');
                  res.body.device.name.should.be.eql('Android Device 04');
                  res.body.device.repos.length.should.be.eql(0);
                  res.body.device.repos.should.not.include('Repo001');
                  res.body.device.repos.should.not.include('Repo002');
                  done();
                });
      });
    });
  });

  describe('Database: Now          :', function () {
    describe('devices collection', function () {
      it('should still have 6', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should still have 2', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(2);
          done();
        });
      });
    });
    describe('Repo001', function () {
      it('should be updated', function (done) {
        findRepo(repo01, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo001');
          repos[0].name.should.be.eql('floydpink/travis-notification-hub');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(2);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo002', function () {
      it('should also be updated', function (done) {
        findRepo(repo02, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo002');
          repos[0].name.should.be.eql('floydpink/Travis-CI');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(2);
          repos[0].apnPushCount.should.be.eql(0);
          repos[0].gcmPushCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Repo003', function () {
      it('should still not be present', function (done) {
        findRepo(repo03, function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
  });

  describe('Routes  : Notifications: post', function () {
    describe('\'notifications\' with \'repoId\' Repo002 failed', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo002", buildFailed : true }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo002 to 1 Android and 1 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(1);
                  gcmNotifications[0].registrationId.should.eql('');
                  gcmNotifications[0].message.should.eql('Build broken: floydpink/Travis-CI');
                  gcmNotifications[0].badgeNumber.should.eql(1);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  apnNotifications[0].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001');
                  apnNotifications[0].message.should.eql('Build broken: floydpink/Travis-CI');
                  apnNotifications[0].badgeNumber.should.eql(1);
                  apnNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' Repo002 passed', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo002", buildFailed : false }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo002 to 1 Android and 1 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(1);
                  gcmNotifications[0].registrationId.should.eql('');
                  gcmNotifications[0].message.should.eql('Build fixed: floydpink/Travis-CI');
                  gcmNotifications[0].badgeNumber.should.eql(2);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  apnNotifications[0].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001');
                  apnNotifications[0].message.should.eql('Build fixed: floydpink/Travis-CI');
                  apnNotifications[0].badgeNumber.should.eql(2);
                  apnNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' Repo002 passed again', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo002", buildFailed : false }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo002 to 1 Android and 0 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(0);
                  gcmNotifications[0].registrationId.should.eql('');
                  gcmNotifications[0].message.should.eql('Build passed: floydpink/Travis-CI');
                  gcmNotifications[0].badgeNumber.should.eql(3);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  done();
                });
      });
    });
  });

  describe('Routes  : Device       : put', function () {
    describe('\'devices/:deviceId\' with iOSDisabledDevice enabled', function () {
      it('should update (200) with enabled = \'1\'', function (done) {
        var nowEnabledDevice = JSON.parse(JSON.stringify(iOSDisabledDevice));
        nowEnabledDevice.iOS.enabled = "1";
        request(url).
            put('/api/devices/Device03').
            send(nowEnabledDevice).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.device.should.have.property('iOS');
                  res.body.device.iOS.should.have.property('enabled');
                  res.body.device.deviceId.should.eql('Device03');
                  res.body.device.name.should.eql('iOS Device 03');
                  res.body.device.platform.should.eql('iOS');
                  res.body.device.repos.length.should.eql(1);
                  res.body.device.repos.should.include('Repo001');
                  res.body.device.iOS.deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003');
                  res.body.device.iOS.enabled.should.eql('1');
                  done();
                });
      });
    });
    describe('\'devices/:deviceId\' with androidDevice03 new regId', function () {
      it('should update (200)', function (done) {
        var deviceWithNewRegId = JSON.parse(JSON.stringify(androidDevice03));
        deviceWithNewRegId.android = {};
        deviceWithNewRegId.android.registrationId = "POUIPOUIQWERTYKBHVHKKK*^%%GJBJJBVHVHVHV";
        request(url).
            put('/api/devices/Device06').
            send(deviceWithNewRegId).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
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
                  res.body.device.repos.length.should.eql(1);
                  res.body.device.repos.should.include('Repo002');
                  res.body.device.android.registrationId.should.eql('POUIPOUIQWERTYKBHVHKKK*^%%GJBJJBVHVHVHV');
                  done();
                });
      });
    });
  });

  describe('Routes  : Repo         : put', function () {
    describe('\'repos/:repoId\' with Device03 now subscribing repo02', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device03/repos/Repo002').
            send(createDeviceRepoPayload(iOSDisabledDevice, repo02)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device03');
                  res.body.device.name.should.be.eql('iOS Device 03');
                  res.body.device.repos.length.should.be.eql(2);
                  res.body.device.repos.should.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
    describe('\'repos/:repoId\' with Device06 now subscribing repo01', function () {
      it('should create (201)', function (done) {
        request(url).
            put('/api/devices/Device06/repos/Repo001').
            send(createDeviceRepoPayload(androidDevice03, repo01)).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.have.status(201);
                  res.body.device.deviceId.should.be.eql('Device06');
                  res.body.device.name.should.be.eql('Android Device 06');
                  res.body.device.repos.length.should.be.eql(2);
                  res.body.device.repos.should.include('Repo001');
                  res.body.device.repos.should.include('Repo002');
                  done();
                });
      });
    });
  });

  describe('Routes  : Notifications: post', function () {
    describe('\'notifications\' with \'repoId\' Repo002 failed', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo002", buildFailed : true }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo002 to 1 Android and 2 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(2);
                  gcmNotifications[0].registrationId.should.eql('POUIPOUIQWERTYKBHVHKKK*^%%GJBJJBVHVHVHV');
                  gcmNotifications[0].message.should.eql('Build broken: floydpink/Travis-CI');
                  gcmNotifications[0].badgeNumber.should.eql(1);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  apnNotifications[0].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001');
                  apnNotifications[0].message.should.eql('Build broken: floydpink/Travis-CI');
                  apnNotifications[0].badgeNumber.should.eql(3);
                  apnNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  apnNotifications[1].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003');
                  apnNotifications[1].message.should.eql('Build broken: floydpink/Travis-CI');
                  apnNotifications[1].badgeNumber.should.eql(1);
                  apnNotifications[1].payload.should.eql({ repoId : 'Repo002'});
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' Repo002 still failing', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo002", buildFailed : true }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo002 to 1 Android and 2 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(2);
                  gcmNotifications[0].registrationId.should.eql('POUIPOUIQWERTYKBHVHKKK*^%%GJBJJBVHVHVHV');
                  gcmNotifications[0].message.should.eql('Still failing: floydpink/Travis-CI');
                  gcmNotifications[0].badgeNumber.should.eql(2);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  apnNotifications[0].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000001');
                  apnNotifications[0].message.should.eql('Still failing: floydpink/Travis-CI');
                  apnNotifications[0].badgeNumber.should.eql(4);
                  apnNotifications[0].payload.should.eql({ repoId : 'Repo002'});
                  apnNotifications[1].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003');
                  apnNotifications[1].message.should.eql('Still failing: floydpink/Travis-CI');
                  apnNotifications[1].badgeNumber.should.eql(2);
                  apnNotifications[1].payload.should.eql({ repoId : 'Repo002'});
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' Repo001 failed', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo001", buildFailed : true }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo001 to 1 Android and 2 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(2);
                  gcmNotifications[0].registrationId.should.eql('POUIPOUIQWERTYKBHVHKKK*^%%GJBJJBVHVHVHV');
                  gcmNotifications[0].message.should.eql('Build broken: floydpink/travis-notification-hub');
                  gcmNotifications[0].badgeNumber.should.eql(3);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo001'});
                  apnNotifications[0].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000002');
                  apnNotifications[0].message.should.eql('Build broken: floydpink/travis-notification-hub');
                  apnNotifications[0].badgeNumber.should.eql(1);
                  apnNotifications[0].payload.should.eql({ repoId : 'Repo001'});
                  apnNotifications[1].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003');
                  apnNotifications[1].message.should.eql('Build broken: floydpink/travis-notification-hub');
                  apnNotifications[1].badgeNumber.should.eql(3);
                  apnNotifications[1].payload.should.eql({ repoId : 'Repo001'});
                  done();
                });
      });
    });
    describe('\'notifications\' with \'repoId\' Repo001 passed', function () {
      it('should complete (200) with calls to gcm and apn', function (done) {
        request(url).
            post('/api/notifications').
            send({ "repoId" : "Repo001", buildFailed : false }).
            end(function (err, res) {
                  if (err) { return done(err); }
                  res.should.be.json;
                  res.should.have.status(200);
                  res.body.status.should.include('Pushed build notifications for repo Repo001 to 1 Android and 2 iOS devices');
                  gcmNotifications.length.should.be.eql(1);
                  apnNotifications.length.should.be.eql(2);
                  gcmNotifications[0].registrationId.should.eql('POUIPOUIQWERTYKBHVHKKK*^%%GJBJJBVHVHVHV');
                  gcmNotifications[0].message.should.eql('Build fixed: floydpink/travis-notification-hub');
                  gcmNotifications[0].badgeNumber.should.eql(4);
                  gcmNotifications[0].payload.should.eql({ repoId : 'Repo001'});
                  apnNotifications[0].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000002');
                  apnNotifications[0].message.should.eql('Build fixed: floydpink/travis-notification-hub');
                  apnNotifications[0].badgeNumber.should.eql(2);
                  apnNotifications[0].payload.should.eql({ repoId : 'Repo001'});
                  apnNotifications[1].deviceToken.should.eql('ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890000003');
                  apnNotifications[1].message.should.eql('Build fixed: floydpink/travis-notification-hub');
                  apnNotifications[1].badgeNumber.should.eql(4);
                  apnNotifications[1].payload.should.eql({ repoId : 'Repo001'});
                  done();
                });
      });
    });
  });

  describe('Database: Now          :', function () {
    describe('devices collection', function () {
      it('should still have 6', function (done) {
        findAllDevices(function (devices) {
          devices.length.should.be.eql(6);
          done();
        });
      });
    });
    describe('repos collection', function () {
      it('should still have 2', function (done) {
        findAllRepos(function (repos) {
          repos.length.should.be.eql(2);
          done();
        });
      });
    });
    describe('Device01', function () {
      it('should be updated', function (done) {
        findDevice({ deviceId : iOSEnabledDevice01.deviceId }, function (devices) {
          devices.length.should.be.eql(1);
          devices[0].deviceId.should.be.eql('Device01');
          devices[0].repos.length.should.be.eql(1);
          devices[0].repos.should.include('Repo002');
          devices[0].pushCount.should.be.eql(4);
          devices[0].badgeCount.should.be.eql(4);
          done();
        });
      });
    });
    describe('Device02', function () {
      it('should be updated', function (done) {
        findDevice({ deviceId : iOSEnabledDevice02.deviceId }, function (devices) {
          devices.length.should.be.eql(1);
          devices[0].deviceId.should.be.eql('Device02');
          devices[0].repos.length.should.be.eql(1);
          devices[0].repos.should.include('Repo001');
          devices[0].pushCount.should.be.eql(2);
          devices[0].badgeCount.should.be.eql(2);
          done();
        });
      });
    });
    describe('Device03', function () {
      it('should be updated', function (done) {
        findDevice({ deviceId : iOSDisabledDevice.deviceId }, function (devices) {
          devices.length.should.be.eql(1);
          devices[0].deviceId.should.be.eql('Device03');
          devices[0].repos.length.should.be.eql(2);
          devices[0].repos.should.include('Repo001');
          devices[0].repos.should.include('Repo002');
          devices[0].pushCount.should.be.eql(4);
          devices[0].badgeCount.should.be.eql(4);
          done();
        });
      });
    });
    describe('Device04', function () {
      it('should be updated', function (done) {
        findDevice({ deviceId : androidDevice01.deviceId }, function (devices) {
          devices.length.should.be.eql(1);
          devices[0].deviceId.should.be.eql('Device04');
          devices[0].repos.length.should.be.eql(0);
          devices[0].pushCount.should.be.eql(0);
          devices[0].badgeCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Device05', function () {
      it('should be updated', function (done) {
        findDevice({ deviceId : androidDevice02.deviceId }, function (devices) {
          devices.length.should.be.eql(1);
          devices[0].deviceId.should.be.eql('Device05');
          devices[0].repos.length.should.be.eql(0);
          devices[0].pushCount.should.be.eql(0);
          devices[0].badgeCount.should.be.eql(0);
          done();
        });
      });
    });
    describe('Device06', function () {
      it('should be updated', function (done) {
        findDevice({ deviceId : androidDevice03.deviceId }, function (devices) {
          devices.length.should.be.eql(1);
          devices[0].deviceId.should.be.eql('Device06');
          devices[0].repos.length.should.be.eql(2);
          devices[0].repos.should.include('Repo001');
          devices[0].repos.should.include('Repo002');
          devices[0].pushCount.should.be.eql(7);
          devices[0].badgeCount.should.be.eql(4);
          done();
        });
      });
    });
    describe('Repo001', function () {
      it('should be updated', function (done) {
        findRepo(repo01, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo001');
          repos[0].name.should.be.eql('floydpink/travis-notification-hub');
          repos[0].lastBuildFailed.should.be.false;
          repos[0].devicesSubscribed.should.be.eql(3);
          repos[0].apnPushCount.should.be.eql(4);
          repos[0].gcmPushCount.should.be.eql(2);
          done();
        });
      });
    });
    describe('Repo002', function () {
      it('should also be updated', function (done) {
        findRepo(repo02, function (repos) {
          repos.length.should.be.eql(1);
          repos[0].repoId.should.be.eql('Repo002');
          repos[0].name.should.be.eql('floydpink/Travis-CI');
          repos[0].lastBuildFailed.should.be.true;
          repos[0].devicesSubscribed.should.be.eql(3);
          repos[0].apnPushCount.should.be.eql(6);
          repos[0].gcmPushCount.should.be.eql(5);
          done();
        });
      });
    });
    describe('Repo003', function () {
      it('should still not be present', function (done) {
        findRepo(repo03, function (repos) {
          repos.length.should.be.eql(0);
          done();
        });
      });
    });
  });

});
