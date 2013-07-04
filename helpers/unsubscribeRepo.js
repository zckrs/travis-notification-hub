module.exports = function (device, repoId, callback) {
  var debug = require('debug')('hub:helpers:unsubscribeRepo'),
      helpers = require('./'),
      Repo = require('../models/repo');

  debug('Inside unsubscribeRepo repoId %s for device: ', repoId, device);
  var result = helpers.initializeResult();
  if (!~device.repos.indexOf(repoId)) {  // device.repos does not have this repoId

    debug('Device %s does not subscribe to the repo %s', device.deviceId, repoId);
    result.status = 'Device does not subscribe to this repo.';
    result.device = device;
    callback(result);

  } else { // device.repos has this repoId

    //remove repoId from device.repos
    device.repos.splice(device.repos.indexOf(repoId), 1);
    device.updated = Date.now();
    device.save(function (err, device) {

      if (err) {
        result.error = err;
        callback(result);
      } else {

        //delete Repo document if this device was the last one subscribed to it - fire and forget
        Repo.find({ repoId : repoId }, function (err, repos) {
          if (err) { debug('Repo Find Error for repoId : %s', repoId); }
          else if (!repos.length) { // for some reason the repo is missing ! Should not happen...
            debug('Repo document is missing for repoId: %s', repoId);
          } else {  // if devicesSubscribed is 1, delete this repo, otherwise devicesSubscribed-- and update

            var repo = repos[0];
            if (repo.devicesSubscribed === 1) { // this was the only device subscribed to this repo
              Repo.remove(repo, function (err) {
                if (!err) { debug('Repo removed.'); }
              });
            } else { // there are other devices still subscribed to this repo
              debug('Repo still subscribed by some other device(s)');
              Repo.findOneAndUpdate(repo, { updated : Date.now(), devicesSubscribed : repo.devicesSubscribed - 1 }, function () {});
            }

          }
        }); //end newRepo find

        debug('Device %s unsubscribed from the repo %s', device.deviceId, repoId);
        result.status = 'Repo unsubscribed';
        result.device = device;
        callback(result);

      }
    }); //end device save

  }

};