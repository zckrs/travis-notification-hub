var debug = require('debug')('hub:route:notifications'),
    apns = require('../../apns');

module.exports = function (app) {

  app.post('/api/notifications', function (req, res) {
    debug('Inside POST /api/notifications');

    //TODO: check if any device subscribes to the incoming repo and if yes, dispatch APNS/GCM notification

    // "APA91bHhQt_C02KVj1yHnNW3djucjbum-fLFafM1bzObAVvYSk8prbDM1mZPMgvkJkwB_vG2qxnum6q7SJFbcjA05qsiymoG9EdAvA5ovA1O2J5JBl0xRe-lDU1jYvz3Uft6k0ZN4_04ybC2MQyjTNxg_Wt09cy24Q"

    apns.push("66398b79cffe00de6ea95e6aa2206e33b050c9a9804ec51e5c8a0b893810108a",
              "Build failed: floydpink/Travis-CI",
              1,
              req.body);

    res.send({ status : 'Pushed a notification!' });

  });
};
