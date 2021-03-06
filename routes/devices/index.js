module.exports = function (app) {
  var debug = require('debug')('hub:routes:devices'),
      helpers = require('../../helpers'),
      extend = require('node.extend'),
      Device = require('../../models/device');

  app.put('/api/devices/:deviceid', function (req, res) {

    debug('Inside PUT /api/devices/:deviceid');

    var requestBody = req.body,
        saveClosure = function (result, res, operation) {
          return function (err, device) {
            if (err) {
              result.status = operation + ' Device Error';
              result.error = err;
              debug('ERROR: ', err);
            } else {
              result.status = operation === 'Insert' ? 'Registered new device' : 'Updated existing device';
              result.device = device;
              //debug('Device after ' + operation + ': ', device);
            }
            res.send(err ? 500 : operation === 'Insert' ? 201 : 200, result);
          };
        },
        result = helpers.initializeResult();

    if (helpers.validateDevice(req)) {

      Device.find({ deviceId : requestBody.deviceId}, function (err, devices) {

        if (err) {
          result.status = 'Find Error';
          result.error = err;
          debug('ERROR: ', err);
          res.send(500, result);
        } else if (!devices.length) {
          var newDevice = extend(new Device({ deviceId : requestBody.deviceId, created : Date.now() }), requestBody);
          newDevice.save(saveClosure(result, res, 'Insert'));
        } else {
          var existingDevice = extend(devices[0], requestBody);
          existingDevice.badgeCount = 0;
          existingDevice.updated = Date.now();
          existingDevice.save(saveClosure(result, res, 'Update'));
        }

      });

    } else {
      helpers.sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });

  require('./repos')(app);
};