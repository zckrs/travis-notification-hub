var debug = require('debug')('hub:route:notifications'),
    push = require('../../push');

module.exports = function (app) {

  app.post('/api/notifications', function (req, res) {
    debug('Inside POST /api/notifications');

    //Convert the Travis-CI sent format to the one below and call notify
    //  {
    //    "buildFailed" : true|false,
    //    "repoId"      : "34254"
    //  }

    push.notify(req.body, function (respcode, statusMessage) {

      res.send({ status : statusMessage});

    });

  });
};
