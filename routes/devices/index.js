module.exports = function (app) {
  app.put('/api/devices/:deviceid', function (req, res) {
    //TODO: register the device for app usage here - also record if they want/don't-want notifications
    var device = { device: req.body.device };
    device.lastAccessed = new Date();
    res.send(device);
  });
  require('./repos')(app);
};