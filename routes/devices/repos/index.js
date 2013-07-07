module.exports = function (app) {

  var debug = require('debug')('hub:routes:repos'),
      helpers = require('../../../helpers'),
      extend = require('node.extend'),
      Device = require('../../../models/device'),
      Repo = require('../../../models/repo'),
      ensureDevice = function (res, result, deviceId, callback) {
        debug('Inside ensureDevice for deviceId: %s', deviceId);
        Device.find({ deviceId : deviceId }, function (err, devices) {
          if (err) {
            helpers.sendErrorResponse(res, result, err);
          } else if (!devices.length) {
            result.status = result.error = 'Device not found';
            debug('ERROR: ', result.error);
            res.send(404, result);
          } else {
            callback(devices[0]);
          }
        });
      };

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside PUT /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = helpers.initializeResult();

    if (helpers.validateDeviceRepo(req)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        if (!~device.repos.indexOf(requestBody.repo.repoId)) {  // device.repos does not have this repoId

          //push repoId to device.repos
          device.repos.push(requestBody.repo.repoId);
          device.updated = Date.now();
          device.save(function (err, device) {
            if (err) {
              helpers.sendErrorResponse(res, result, err);
            } else {

              //insert Repo document if not exists - fire and forget
              debug('About to create or update the repo %s', requestBody.repo.repoId);
              Repo.find({ repoId : requestBody.repo.repoId }, function (err, repos) {
                if (err) {
                  helpers.sendErrorResponse(res, result, err);
                } else if (!repos.length) { // we haven't seen this repo before

                  var newRepo = extend(new Repo({
                                                  repoId            : requestBody.repo.repoId,
                                                  devicesSubscribed : 1,
                                                  created           : Date.now()
                                                }), requestBody.repo);
                  newRepo.save(function () { });

                } else {  // some other device has subscribed this repo before

                  debug('Increment devicesSubscribed count on repo');
                  Repo.findOneAndUpdate(repos[0], {
                    updated           : Date.now(),
                    devicesSubscribed : repos[0].devicesSubscribed + 1
                  }, function () {});

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
      helpers.sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

  app.delete('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = helpers.initializeResult();

    if (helpers.validateDeviceRepo(req)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        helpers.unsubscribeRepo(device, requestBody.repo.repoId, function (result) {
          res.send(result.error ? 500 : 200, result);
        });

      });

    } else {
      helpers.sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos');
    var requestBody = req.body,
        result = helpers.initializeResult();

    if (helpers.validateDevice(req)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        var repos = device.repos.slice(0),
            reposCount = repos.length,
            processedReposCount = 0,
            resultsArray = [];

        if (reposCount) {
          debug('About to unsubscribe all repos: ', repos);
          repos.forEach(function (repoId) {

            helpers.unsubscribeRepo(device, repoId, function (result) {
              processedReposCount++;
              resultsArray.push(result);

              debug('processedCount: %d', processedReposCount);
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
      helpers.sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

};