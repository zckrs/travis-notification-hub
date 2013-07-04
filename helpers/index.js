var debug = require('debug')('hub:helpers');

exports.INVALID_REQUEST_ERROR = 'Invalid Request';

exports.validateDevice = function (req) {
  debug('Inside validateDevice');
  return req.params.deviceid === req.body.deviceId;
};

exports.validateDeviceRepo = function (req) {
  debug('Inside validateDeviceRepo');
  return (req.params.deviceid === req.body.deviceId) && (req.params.repoid === req.body.repo.repoId);
};

exports.initializeResult = function () {
  return { status : '', device : null, error : null };
};

exports.sendErrorResponse = function (res, result, err, statusCode) {
  if (err) {
    result.error = err;
  }
  debug('Sending error response: ', err);
  res.send(statusCode ? statusCode : 500, result);
};

exports.unsubscribeRepo = require('./unsubscribeRepo');
