if (require('./config').env === 'development') { process.env['DEBUG'] = 'hub:*, apn'; }

var debug = require('debug')('hub:app'),
    express = require('express'),
    dbConnection = require('./mongoose'),
    app = express();

app.use(express.logger('dev'));
app.use(express.bodyParser());

debug('Database connection: ', dbConnection);

debug('Setting up routes..')
require('./routes')(app);

app.listen(3000);
console.log('Listening on port 3000');
