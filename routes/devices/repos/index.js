module.exports = function (app) {

  var debug = require('debug')('hub:routes:repos'),
      helpers = require('../../../helpers'),
      Device = require('../../../models/device'),
      sendInvalidRequestResponse = function(res, result){
        result.status = result.error = helpers.INVALID_REQUEST_ERROR;
        res.send(400, result);
      };

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside PUT /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDeviceRepo(req, requestBody)) {

      //new Device({ deviceId : requestBody.deviceId })

    } else {
      sendInvalidRequestResponse(res, result);
    }

  });

  app.delete('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos/:repoid');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDeviceRepo(req, requestBody)) {

      //TODO: remove repo from repos collection for this device

    } else {
      sendInvalidRequestResponse(res, result);
    }

  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos');
    var requestBody = req.body,
        result = { status : '', device : null, error : null };

    if (helpers.validateDevice(req, requestBody)) {

      //TODO: remove all repos from repos collection for this device

    } else {
      sendInvalidRequestResponse(res, result);
    }

  });

};