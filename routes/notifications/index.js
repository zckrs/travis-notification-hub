var apns = require('../../apns');

module.exports = function (app) {

  app.post('/api/notifications', function (req, res) {
    //TODO: check if any device subscribes to the incoming repo and if yes, dispatch APNS/GCM notification
    var myDevice = {
      "deviceid"     : "iOS-6.1.4-iPhone5,1-86C6B0B1-5ECB-49B3-A70A-087E71770495",
      "deviceStatus" : {
        "type"        : "7",
        "pushBadge"   : "1",
        "pushSound"   : "1",
        "enabled"     : "1",
        "deviceToken" : "66398b79cffe00de6ea95e6aa2206e33b050c9a9804ec51e5c8a0b893810108a",
        "pushAlert"   : "1"}
    };

    apns.push(myDevice.deviceStatus.deviceToken, "Hello from APNS", 3, { 'repo' : 'floydpink/harimenon.com' });

    res.send('Pushed a notification!');

  });
};