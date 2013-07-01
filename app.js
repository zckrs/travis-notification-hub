// architecture from this SO answer - http://stackoverflow.com/a/15572522 (thanks nevi_me!)
process.env['DEBUG'] = 'hub:*, apn';

var db = require('./mongoose'),
    express = require('express'),
    debug = require('debug')('hub:app');

var app = express();

app.use(express.logger('dev'));
app.use(express.bodyParser());

debug('Setting up routes..')
require('./routes')(app);

debug('Begin listening on port 3000...');
app.listen(3000);
console.log('Listening on port 3000');
