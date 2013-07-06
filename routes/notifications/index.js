var debug = require('debug')('hub:route:notifications'),
    helpers = require('../../helpers'),
    push = require('../../push');

module.exports = function (app) {

  app.post('/api/notifications', function (req, res) {
    debug('Inside POST /api/notifications');
    var result = helpers.initializeResult();

    //Convert the Travis-CI sent format to the one below and call notify
    //  {
    //    "buildFailed" : true|false,
    //    "repoId"      : "34254"
    //  }
    if (helpers.validateNotification(req)) {
      push.notify(req.body, function (respcode, statusMessage) {
        result.status = statusMessage;
        res.send(result);
      });
    } else {
      helpers.sendErrorResponse(res, result, helpers.INVALID_REQUEST_ERROR, 400);
    }

  });
};
