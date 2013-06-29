module.exports = function (app) {

  var helpers = require('../../../helpers');

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    if (helpers.validateDeviceRepo(req)) {
      //TODO: add repo to repos collection for this device
      res.send('Repository ' + req.params.repoid + ' has been subscribed for device ' + req.params.deviceid + '!');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

  app.delete('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    if (helpers.validateDeviceRepo(req)) {
      //TODO: remove repo from repos collection for this device
      res.send('Repository ' + req.params.repoid + ' has been unsubscribed for device ' + req.params.deviceid + '!');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    if (helpers.validateDevice(req)) {
      //TODO: remove all repos from repos collection for this device
      res.send('All repositories have been unsubscribed for device ' + req.params.deviceid + '!');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

};