var debug = require('debug')('hub:helpers'),
    extend = require('node.extend');

module.exports.INVALID_REQUEST_ERROR = 'Invalid request.';

exports.parseRequestData = function (requestBody) {
  debug('requestBody: ', requestBody);
  var defaultDevice = { deviceid : '', repoid : ''};
  try {
    return  extend(defaultDevice, JSON.parse(requestBody.data));
  } catch (err) {
    console.log('Request Parse Error: ' + err);
    return defaultDevice;
  }
};

exports.validateDevice = function (req, requestData) {
  return req.params.deviceid === requestData.deviceId;
};

exports.validateDeviceRepo = function (req, requestData) {
  return (req.params.deviceid === requestData.deviceId) && (req.params.repoid === requestData.repoId);
};

