module.exports = function (app) {
  app.get('/', function (req, res) {
    res.send('Welcome !!');
  });
  app.get('/api', function (req, res) {
    res.send('Welcome to the travis-notification-hub API !!!1');
  });
  require('./devices')(app);
  require('./notifications')(app);
};