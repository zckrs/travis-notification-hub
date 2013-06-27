// architecture from this SO answer - http://stackoverflow.com/a/15572522 (thanks nevi_me!)
var db = require('./mongoose'),
    express = require('express');

var app = express();

app.use(express.logger('dev'));
app.use(express.bodyParser());

require('./routes')(app);

app.listen(3000);
console.log('Listening on port 3000...');