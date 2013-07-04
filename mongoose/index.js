var mongoose = require('mongoose'),
    config = require('../config'),
    uri = 'mongodb://' + config.mongo.uri + '/' + config.mongo.db,
    options = {
      user : config.mongo.user,
      pass : config.mongo.pass
    };
mongoose.connect(uri, options);

module.exports = 'OK';