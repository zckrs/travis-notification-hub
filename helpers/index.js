var extend = require('node.extend'),
    parseRequestData = function (requestBody) {
      var defaultDevice = { deviceid : '', repoid : ''};
      try {
        return  extend(defaultDevice, JSON.parse(requestBody.data));
      } catch (err) {
        console.log('Request Parse Error: ' + err);
        return defaultDevice;
      }
    };

exports.INVALID_REQUEST_ERROR = 'Invalid request.';

exports.validateDevice = function (req) {
  var requestData = parseRequestData(req.body);
  return req.params.deviceid === requestData.deviceId;
};

exports.validateDeviceRepo = function (req) {
  var requestData = parseRequestData(req.body);
  return (req.params.deviceid === requestData.deviceId) && (req.params.repoid === requestData.repoId);
};

