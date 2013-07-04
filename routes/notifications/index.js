var debug = require('debug')('hub:route:notifications'),
    helpers = require('../../helpers'),
    apns = require('../../apns');

module.exports = function (app) {

  app.post('/api/notifications', function (req, res) {
    debug('Inside POST /api/notifications');

    //TODO: check if any device subscribes to the incoming repo and if yes, dispatch APNS/GCM notification

    //    var myDevice = {
    //      "deviceid"     : "iOS-6.1.4-iPhone5,1-86C6B0B1-5ECB-49B3-A70A-087E71770495",
    //      "deviceStatus" : {
    //        "type"        : "7",
    //        "pushBadge"   : "1",
    //        "pushSound"   : "1",
    //        "enabled"     : "1",
    //        "deviceToken" : "66398b79cffe00de6ea95e6aa2206e33b050c9a9804ec51e5c8a0b893810108a",
    //       // "APA91bHhQt_C02KVj1yHnNW3djucjbum-fLFafM1bzObAVvYSk8prbDM1mZPMgvkJkwB_vG2qxnum6q7SJFbcjA05qsiymoG9EdAvA5ovA1O2J5JBl0xRe-lDU1jYvz3Uft6k0ZN4_04ybC2MQyjTNxg_Wt09cy24Q"
    //        "pushAlert"   : "1"}
    //    };
    //
    //    apns.push(myDevice.deviceStatus.deviceToken, "Hello from APNS", 3, { 'repo' : requestData.repoName });

    res.send('Pushed a notification!');

  });
};
