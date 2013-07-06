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

exports.validateNotification = function (req) {
  debug('Inside validateNotification');
  if (!req.body) {
    debug('Empty payload...');
    return false;
  } else {
    var notification;
    try {
      notification = JSON.parse(JSON.stringify(req.body));
    }
    catch (err) {
      debug('Notification parse error: ', err);
      return false;
    }
    if (!notification.hasOwnProperty('buildFailed') || !notification.hasOwnProperty('repoId')) {
      debug('Either of \'buildFailed\' or \'repoId\' or both are missing');
      return false;
    } else {
      return typeof notification.buildFailed === 'boolean';
    }
  }
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
