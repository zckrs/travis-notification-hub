var load = 10000,
    util = require('util'),
    async = require('async'),
    Client = require('node-rest-client').Client,
    ProgressBar = require('progress'),
//BASE_URL = 'http://travis-hub.nodejitsu.com/api',
    BASE_URL = 'http://localhost:3000/api',
    deviceUrl = BASE_URL + '/devices/${device}',
    repoUrl = BASE_URL + '/devices/${device}/repos/${repo}',
    devices = [],
    repos = [],
    deviceRepos = [],
    repoTemplate = {
      "repoId" : "Repo-",
      "name"   : "floydpink/travis-notification-hub"
    },
    deviceTemplate = {
      "deviceId"     : "Device-",
      "name"         : "Test Device-",
      phonegapDevice : {
        "platform" : "iOS"
      }
    },
    createDeviceRepoPayload = function (device, i) {
      return {
        deviceId : device.deviceId,
        repo     : repos[ i % (load / 2) ]
      };
    },
    loadDevicesAndRepos = function () {
      for (var i = 1; i <= (load / 2); i++) {
        var repo = JSON.parse(JSON.stringify(repoTemplate));
        repo.repoId += i;
        repo.name += i;
        repos.push(repo);
      }
      for (i = 1; i <= load; i++) {
        var device = JSON.parse(JSON.stringify(deviceTemplate));
        device.deviceId += i;
        device.name += i;
        devices.push(device);
        deviceRepos.push(createDeviceRepoPayload(device, i));
      }
    },
    putDevice = function (device, callback) {
      var client = new Client(),
          args = {
            path    : {"device" : device.deviceId},
            headers : {"Content-Type" : "application/json" },
            data    : device
          };
      client.put(deviceUrl, args, callback);
    },
    subscribeRepo = function (deviceRepo, callback) {
      var client = new Client(),
          args = {
            path    : {"device" : deviceRepo.deviceId, "repo" : deviceRepo.repo.repoId},
            headers : {"Content-Type" : "application/json" },
            data    : deviceRepo
          };
      client.put(repoUrl, args, callback);
    };

describe('Load test Mongo DB: ', function () {
  this.timeout(20 * load);
  loadDevicesAndRepos();

  describe(util.format('Load %d devices: ', load), function () {
    it(util.format('creates %d devices on db', load), function (done) {
      var bar = new ProgressBar('  registering devices [:bar] :current devices registered', {
        complete : '=', incomplete : ' ', width : 40, total : devices.length
      });
      async.each(devices, function (device, callback) {

        (function (device, bar) {
          putDevice(device, function (data) {
            JSON.parse(data).device.deviceId.should.be.eql(device.deviceId);
            bar.tick(1);
            callback();
          });
        })(device, bar);

      }, function () {
        console.log('Loaded %d devices !', devices.length);
        done();
      });
    });
  });

  describe(util.format('Subscribe %d devices with 5 different repos: ', load), function () {
    it(util.format('updates all %d devices on db', load), function (done) {
      var bar = new ProgressBar('  subscribing repos [:bar] :current devices subscribed', {
        complete : '=', incomplete : ' ', width : 40, total : devices.length
      });
      async.each(deviceRepos, function (deviceRepo, callback) {

        (function (deviceRepo, bar) {
          subscribeRepo(deviceRepo, function (data) {
            var parsedData = JSON.parse(data);
            parsedData.device.repos.should.include(deviceRepo.repo.repoId);
            bar.tick(1);
            callback();
          });
        })(deviceRepo, bar);

      }, function () {
        console.log('Subscribed all %d devices to the repo !', deviceRepos.length);
        done();
      });
    });
  });

});