var config = require('./config');
if (config.env === 'development') { process.env['DEBUG'] = 'hub:*, apn'; }

var debug = require('debug')('hub:app'),
    express = require('express'),
    mongoose = require('./mongoose'),
    app = express();

app.configure('development', function () {
  app.use(express.logger('dev'));
});

app.use(express.bodyParser());

debug('Connecting to database connection...');
var connection = mongoose.connect();

var start = function () {
  debug('Setting up routes..')
  require('./routes')(app);

  app.listen(config.port);
  console.log('Listening on port %d', config.port);
}

exports.app = app;
exports.connection = connection;
exports.start = start;

if (config.env !== 'test') {
  start();
}
