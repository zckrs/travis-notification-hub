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
      };

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside PUT /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDeviceRepo(req, requestBody)) {

      ensureDevice(res, result, requestBody.deviceId, function (device) {

        if (!~device.repos.indexOf(requestBody.repo.repoId)) {

          //push repoId to device.repos if does not exist and send response
          device.repos.push(requestBody.repo.repoId);
          device.updated = Date.now();
          device.save(function (err, device) {
            if (err) {
              sendErrorResponse(res, result, err);
            } else {

              //insert Repo document if not exists - fire and forget
              new Repo({ repoId : requestBody.repo.repoId }).findByRepoId(function (err, repos) {
                if (err) {
                  sendErrorResponse(res, result, err);
                } else if (!repos.length) {

                  var newRepo = extend(new Repo({ repoId : requestBody.repo.repoId, created : Date.now() }), requestBody.repo);
                  newRepo.save(function (err, repo) {
                    if (!err) {
                      debug('Inserted new Repo: ', repo);
                    }
                  }); //end newRepo save

                } else {
                  debug('Repo exists via some other device', repos[0]);
                  Repo.update(repos[0], { updated : Date.now() });
                }
              }); //end newRepo find

              debug('Device %s subscribed to the repo %s', requestBody.deviceId, requestBody.repo.repoId);
              result.status = 'Repo Added';
              result.device = device;
              res.send(201, result);

            }
          }); //end device save

        } else {
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

      //TODO: remove repo from repos collection for this device

    } else {
      sendErrorResponse(res, result);
    }

  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDevice(req, requestBody)) {

      //TODO: remove all repos from repos collection for this device

    } else {
      sendErrorResponse(res, result);
    }

  });

};