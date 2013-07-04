module.exports = function (app) {

  var debug = require('debug')('hub:routes:repos'),
      helpers = require('../../../helpers'),
      extend = require('node.extend'),
      Device = require('../../../models/device'),
      Repo = require('../../../models/repo'),
      sendErrorResponse = function (res, result, err, statusCode) {
        if (err) {
          result.error = err;
        }
        debug('Sending error response: ', err);
        res.send(statusCode ? statusCode : 500, result);
      },
      ensureDevice = function (res, result, deviceId, callback) {
        debug('Inside ensureDevice for deviceId: %s', deviceId);
        new Device({ deviceId : deviceId }).findByDeviceId(function (err, devices) {
          if (err) {
            sendErrorResponse(res, result, err);
          } else if (!devices.length) {
            result.status = result.error = 'Device not found';
            debug('ERROR: ', result.error);
            res.send(404, result);
          } else {
            callback(devices[0]);
          }
        });
      },
      unsubscribeRepo = function (device, repoId, callback) {
        debug('Inside unsubscribeRepo repoId %s for device: ', repoId, device);
        var result = { status : "", device : null, error : null};
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
              new Repo({ repoId : repoId }).findByRepoId(function (err, repos) {
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

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside PUT /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDeviceRepo(req, requestBody)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        if (!~device.repos.indexOf(requestBody.repo.repoId)) {  // device.repos does not have this repoId

          //push repoId to device.repos
          device.repos.push(requestBody.repo.repoId);
          device.updated = Date.now();
          device.save(function (err, device) {
            if (err) {
              sendErrorResponse(res, result, err);
            } else {

              //insert Repo document if not exists - fire and forget
              debug('About to create or update the repo %s', requestBody.repo.repoId);
              new Repo({ repoId : requestBody.repo.repoId }).findByRepoId(function (err, repos) {
                if (err) {
                  sendErrorResponse(res, result, err);
                } else if (!repos.length) { // we haven't seen this repo before

                  var newRepo = extend(new Repo({ repoId : requestBody.repo.repoId, created : Date.now() }), requestBody.repo);
                  newRepo.save(function (err, repo) {
                    if (!err) {
                      debug('Inserted new Repo: ', repo);
                    }
                  }); //end newRepo save

                } else {  // some other device has subscribed this repo before

                  debug('Repo exists via some other device');
                  Repo.findOneAndUpdate(repos[0], { updated : Date.now(), devicesSubscribed : repos[0].devicesSubscribed + 1 }, function (err, repo) {
                    if (err) {
                      debug('Error updating existing repo: ', err)
                    } else {
                      debug('Existing repo updated: ', repo)
                    }
                  });

                }
              }); //end newRepo find

              debug('Device %s subscribed to the repo %s', requestBody.deviceId, requestBody.repo.repoId);
              result.status = 'Repo subscribed';
              result.device = device;
              res.send(201, result);

            }
          }); //end device save

        } else { // device.repos has this repoId
          debug('Device %s already subscribes to the repo %s', requestBody.deviceId, requestBody.repo.repoId);
          result.status = 'Device already subscribes to this repo.';
          result.device = device;
          res.send(result);
        }

      }); //end ensureDevice

    } else {
      sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

  app.delete('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDeviceRepo(req, requestBody)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        unsubscribeRepo(device, requestBody.repo.repoId, function (result) {
          res.send(result.error ? 500 : 200, result);
        });

      });

    } else {
      sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDevice(req, requestBody)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        var repos = device.repos.slice(0),
            reposCount = repos.length,
            processedReposCount = 0,
            resultsArray = [];

        if (reposCount) {
          debug('About to unsubscribe all repos: ', repos);
          repos.forEach(function (repoId) {
            unsubscribeRepo(device, repoId, function (result) {
              processedReposCount++;
              resultsArray.push(result);
              debug('processedCount: %d and result: ', processedReposCount, result);
              if (reposCount === processedReposCount) {
                //check all results are error free
                var errors = resultsArray.filter(function (result) { return !!result.error; });
                if (errors.length) {
                  debug('Error: ', errors);
                  res.send(500, errors);
                } else {
                  debug('Unsubscribed from all repos');
                  resultsArray[0].status = 'Unsubscribed from all repos';
                  res.send(resultsArray[0]);
                }
              }
            });
          });
        } else {
          debug('Device %s does not subscribe to any repos', device.deviceId);
          result.status = 'Device does not subscribe to any repos';
          result.device = device;
          res.send(result);
        }

      });

    } else {
      sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

};