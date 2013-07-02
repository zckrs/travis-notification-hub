module.exports = function (app) {
  var debug = require('debug')('hub:routes:devices'),
      helpers = require('../../helpers'),
      extend = require('node.extend'),
      Device = require('../../models/device');

  app.put('/api/devices/:deviceid', function (req, res) {
    debug('Inside device.update...');

    var requestData = helpers.parseRequestData(req.body),
        response = {
          status : '',
          device : {},
          error  : null
        };

    if (helpers.validateDevice(req, requestData)) {

      new Device({ deviceId : requestData.deviceId}).findByDeviceId(function (err, devices) {
        if (err) {
          response.status = 'Find Error';
          response.error = err;
          debug('ERROR: ', err);
          res.send(response);
        } else if (!devices.length) {
          response.status = 'Registered a new device...';
          debug(response.status);
          var newDevice = extend(new Device({ deviceId : requestData.deviceId, created : Date.now() }), requestData);
          newDevice.save(function (err, saveddevice) {
            if (err) {
              response.status = 'Insert Error';
              response.error = err;
              debug('ERROR: ', err);
            } else {
              response.device = saveddevice;
              debug('New device saved: ', saveddevice);
            }
            res.send(response);
          });
        } else {
          response.status = 'Found registered device...';
          debug(response.status);
          if (devices.length !== 1) {
            response.status = 'Multiple Devices error';
            response.error = 'Found more than one device with deviceId: ' + requestData.deviceId;
            response.device = devices;
            debug('ERROR: Duplicate entries for deviceId %s. Devices are: ', requestData.deviceId, devices);
            res.send(response);
          } else {
            var existingDevice = devices[0];
            existingDevice.updated = Date.now();
            response.device = existingDevice;
            existingDevice.save(function (err, device) {
              if (err) {
                response.status = 'Insert Error';
                response.error = err;
                debug('ERROR: ', err);
              } else {
                response.device = device;
                debug('Device updated: ', device);
              }
              res.send(response);
            });
          }
        }

      });
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }

  });

  require('./repos')(app);
};