var debug = require('debug')('hub:push'),
    Device = require('../models/device'),
    Repo = require('../models/repo'),
    util = require('util'),
    gcms = require('./gcms'),
    apns = require('./apns');

exports.notify = function (build, callback) {

  var repoId = build.repoId,
      currentBuildFailed = build.buildFailed,
      gcmDevices = [],
      apnDevices = [],
      pushMessage = 'Build Notification',
      pushPayload = { repoId : repoId };

  Device.find({ repos : repoId }, function (err, devices) {
    if (err) {
      debug('Devices find error for repoId %s : ', repoId, err);
      callback(500, 'Internal Server Error');
    } else {

      if (!devices.length) {
        var noOneSubscribedMessage = util.format('No devices subscribe for build notifications for repo: %s', repoId);
        debug(noOneSubscribedMessage);
        callback(200, noOneSubscribedMessage);
        return;
      }

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
        Device.findOneAndUpdate(device, {
          badgeCount : newBadgeCount,
          pushCount  : device.pushCount + 1,
          updated    : Date.now()
        }, function () {});
      });

      //debug('gcmDevices : ', gcmDevices);
      //debug('apnDevices : ', apnDevices);

      Repo.find({ repoId : repoId }, function (err, repos) {
        if (err) {
          debug('Repo find error for repoId %s : ', repoId, err);
        } else {
          var repo = repos[0],
              messagePrefix = '';

          if (repo.lastBuildFailed) {
            messagePrefix = currentBuildFailed ? 'Still failing: ' : 'Build fixed: ';
          } else {
            messagePrefix = currentBuildFailed ? 'Build failed: ' : 'Build passed: ';
          }

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