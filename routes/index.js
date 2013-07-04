module.exports = function (app) {

  app.get('/api', function (req, res) {
    res.send('Welcome to the travis-notification-hub API !!!1');
  });

  require('./devices')(app);
  require('./notifications')(app);

};