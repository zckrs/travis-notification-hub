console.log('NODE_ENV: %s', process.env.NODE_ENV);
var env = process.env.NODE_ENV || 'development',
    config = require('./config.' + env);

// config.development or config.<NODE_ENV> files are excluded from source control

module.exports = config;