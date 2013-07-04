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
      // respond back to the notifications POST request
      callback(200, util.format('Pushing build notifications for repo %s to %d devices', repoId, devices.length));

      //and continue doing things after that
      debug('Found %d devices subscribed to repoId %s', devices.length, repoId);
      //debug('They are: ', devices);

      devices.forEach(function (device) {
        var newBadgeCount = device.badgeCount + 1;
        if (device.platform.toLowerCase() === 'android') {
          gcmDevices.push({ regId : device.android.registrationId, badge : newBadgeCount });
        } else {
          if (device.iOS.enabled === '1') {
            apnDevices.push({ deviceToken : device.iOS.deviceToken, badge : newBadgeCount });
          }
        }
        Device.findOneAndUpdate(device, {badgeCount : newBadgeCount, updated : Date.now()}, function () {});
      });

      //debug('gcmDevices : ', gcmDevices);
      //debug('apnDevices : ', apnDevices);

      Repo.find({ repoId : repoId}, function (err, repos) {
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

          // Update repo with this build status; TODO: Add notification analytics
          Repo.findOneAndUpdate(repo, { lastBuildFailed : currentBuildFailed, updated : Date.now() }, function () {});

          gcmDevices.forEach(function (gcmDevice) {
            gcms.push(gcmDevice.regId, pushMessage, gcmDevice.badge, pushPayload);
          });

          apnDevices.forEach(function (apnDevice) {
            apns.push(apnDevice.deviceToken, pushMessage, apnDevice.badge, pushPayload);
          });
        }
      });

    }
  });

};