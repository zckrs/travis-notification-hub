if (require('./config').env === 'development') { process.env['DEBUG'] = 'hub:*, apn'; }

var debug = require('debug')('hub:app'),
    express = require('express'),
    mongoose = require('./mongoose'),
    app = express();

app.configure(function () {
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
});

debug('Connecting to database connection...');
mongoose.connect();

var start = function () {
  debug('Setting up routes..')
  require('./routes')(app);

  app.listen(3000);
  console.log('Listening on port 3000');
}

if (require('./config').env === 'development') {
  start();
} else {
  exports.app = app;
  exports.start = start;
}
