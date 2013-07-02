module.exports = function (app) {
  var debug = require('debug')('hub:routes:devices'),
      helpers = require('../../helpers'),
      extend = require('node.extend'),
      Device = require('../../models/device');

  app.put('/api/devices/:deviceid', function (req, res) {
    debug('Inside device.update...');

    var requestData = helpers.parseRequestData(req.body),
        result = {
          status : '',
          device : {},
          error  : null
        }, saveClosure = function (result, res) {
          return function (err, saveddevice, operation) {
            if (err) {
              result.status = operation + 'Error';
              result.error = err;
              debug('ERROR: ', err);
            } else {
              result.device = saveddevice;
              debug('Device after' + operation + ': ', saveddevice);
            }
            res.send(result);
          };
        };

    if (helpers.validateDevice(req, requestData)) {

      new Device({ deviceId : requestData.deviceId}).findByDeviceId(function (err, devices) {
        if (err) {
          result.status = 'Find Error';
          result.error = err;
          debug('ERROR: ', err);
          res.send(result);
        } else if (!devices.length) {
          result.status = 'Registered a new device...';
          debug(result.status);
          var newDevice = extend(new Device({ deviceId : requestData.deviceId, created : Date.now() }), requestData);
          newDevice.save(saveClosure(result, res, 'Insert'));
        } else {
          result.status = 'Found registered device...';
          debug(result.status);
          if (devices.length !== 1) {
            result.status = 'Multiple Devices error';
            result.error = 'Found more than one device with deviceId: ' + requestData.deviceId;
            result.device = devices;
            debug('ERROR: Duplicate entries for deviceId %s. Devices are: ', requestData.deviceId, devices);
            res.send(result);
          } else {
            var existingDevice = extend(devices[0], requestData);
            existingDevice.updated = Date.now();
            existingDevice.save(saveClosure(result, res, 'Update'));
          }
        }

      });
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }

  });

  require('./repos')(app);
};