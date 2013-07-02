module.exports = function (app) {

  var debug = require('debug')('hub:route:repos'),
      helpers = require('../../../helpers');

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside PUT /api/devices/:deviceid/repos/:repoid');
    var requestData = helpers.parseRequestData(req.body);
    if (helpers.validateDeviceRepo(req, requestData)) {
      //TODO: add repo to repos collection for this device
      res.send('Repository ' + req.params.repoid + ' has been subscribed for device ' + req.params.deviceid + '!');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

  app.delete('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos/:repoid');
    var requestData = helpers.parseRequestData(req.body);
    if (helpers.validateDeviceRepo(req, requestData)) {
      //TODO: remove repo from repos collection for this device
      res.send('Repository ' + req.params.repoid + ' has been unsubscribed for device ' + req.params.deviceid + '!');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    debug('Inside DELETE /api/devices/:deviceid/repos');
    var requestData = helpers.parseRequestData(req.body);
    if (helpers.validateDevice(req, requestData)) {
      //TODO: remove all repos from repos collection for this device
      res.send('All repositories have been unsubscribed for device ' + req.params.deviceid + '!');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

};