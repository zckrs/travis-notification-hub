var debug = require('debug')('hub:push'),
    Device = require('../models/device'),
    Repo = require('../models/repo'),
    util = require('util'),
    gcms = require('./gcms'),
    apns = require('./apns');

exports.notify = function (build, callback) {

  var repoId = build.repoId,
      currentBuildFailed = build.buildFailed,
      deviceFindCriteria = { repos : repoId },
      gcmDevices = [],
      apnDevices = [],
      pushMessage,
      pushPayload = { repoId : repoId },
      callbackWithNoOneSubscribedMessage = function () {
        var message = util.format('No devices subscribes for this build\'s notifications');
        debug(message);
        callback(200, message);
      };

  Repo.find({ repoId : repoId }, function (err, repos) {
    if (err) {
      debug('Repo find error for repoId %s : ', repoId, err);
    } else {

      if (!repos.length) { return callbackWithNoOneSubscribedMessage(); }

      var repo = repos[0],
          messagePrefix = '';

      if (repo.lastBuildFailed) {
        messagePrefix = currentBuildFailed ? 'Still failing: ' : 'Build fixed: ';
      } else {
        messagePrefix = currentBuildFailed ? 'Build broken: ' : 'Build passed: ';
      }

      // If this build and previous build are passing notify only those subscribing all builds
      if (messagePrefix === 'Build passed: ') {
        deviceFindCriteria.notifyAllBuilds = true;
      }

      Device.find(deviceFindCriteria, function (err, devices) {
        if (err) {
          debug('Devices find error for repoId %s : ', repoId, err);
          callback(500, 'Internal Server Error');
        } else {

          if (!devices.length) { return callbackWithNoOneSubscribedMessage(); }

          debug('Found %d devices subscribed to repoId %s', devices.length, repoId);
          //debug('They are: ', devices);

          devices.forEach(function (device) {
            var newBadgeCount = device.badgeCount + 1;
            if (device.platform.toLowerCase() === 'android') {
              gcmDevices.push({ regId : device.android.registrationId, badge : newBadgeCount });
            } else {
              if (device.iOS.enabled === '1') {
                apnDevices.push({ deviceToken : device.iOS.deviceToken, badge : newBadgeCount });
              } else {
                return; // do not update the device
              }
            }
            device.badgeCount = newBadgeCount;
            device.pushCount = device.pushCount + 1;
            device.updated = Date.now();
            device.save(function () { });
          });

          //debug('gcmDevices : ', gcmDevices);
          //debug('apnDevices : ', apnDevices);

          pushMessage = messagePrefix + repo.name;

          debug('Pushing message: \'' + pushMessage + '\' to %d GCM and %d APN devices', gcmDevices.length, apnDevices.length);

          // Update repo with this build status, gcmPushCount and apnPushCount
          Repo.findOneAndUpdate(repo, {
            updated           : Date.now(),
            lastBuildFinished : Date.now(),
            lastBuildFailed   : currentBuildFailed,
            gcmPushCount      : repo.gcmPushCount + gcmDevices.length,
            apnPushCount      : repo.apnPushCount + apnDevices.length
          }, function () {});

          gcmDevices.forEach(function (gcmDevice) {
            gcms.push(gcmDevice.regId, pushMessage, gcmDevice.badge, pushPayload);
          });

          apnDevices.forEach(function (apnDevice) {
            apns.push(apnDevice.deviceToken, pushMessage, apnDevice.badge, pushPayload);
          });

          // respond back to the notifications POST request
          callback(200, util.format('Pushed build notifications for repo %s to %d Android and %d iOS devices',
                                    repoId, gcmDevices.length, apnDevices.length));

        }
      });

    }
  });

};