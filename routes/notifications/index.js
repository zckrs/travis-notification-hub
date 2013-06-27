module.exports = function (app) {
  app.post('/api/notifications', function (req, res) {
    //TODO: check if any device subscribes to the incoming repo and if yes, dispatch APNS/GCM notification
    res.send('Notifications!');
  });
};