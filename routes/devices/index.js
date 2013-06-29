module.exports = function (app) {
  var helpers = require('../../helpers');

  app.put('/api/devices/:deviceid', function (req, res) {
    if (helpers.validateDevice(req)) {
      //TODO: register the device for app usage here - also record if they want/don't-want notifications
      res.send('Device ' + req.params.deviceid + ' has been registered.');
    } else {
      res.send(helpers.INVALID_REQUEST_ERROR);
    }
  });

  require('./repos')(app);
};