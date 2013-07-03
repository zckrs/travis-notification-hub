exports.INVALID_REQUEST_ERROR = 'Invalid request.';

exports.validateDevice = function (req, requestData) {
  return req.params.deviceid === requestData.deviceId;
};

exports.validateDeviceRepo = function (req, requestData) {
  return (req.params.deviceid === requestData.deviceId) && (req.params.repoid === requestData.repo.repoId);
};