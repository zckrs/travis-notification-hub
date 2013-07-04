var apn = require('apn'),
    config = require('../config'),
    debug = require('debug')('hub:apns');

exports.push = function (deviceToken, alertMessage, badgeNumber, payload) {
  debug('deviceToken    : ' + deviceToken);
  debug('alertMessage   : ' + alertMessage);
  debug('badgeNumber    : ' + badgeNumber);
  debug('payload        : ', payload);
  var options = {
        "gateway" : config.apns.gateway,
        "cert"    : config.apns.cert,
        "key"     : config.apns.key
      },
      apnConnection = new apn.Connection(options),
      device = new apn.Device(deviceToken),
      notification = new apn.Notification();

  debug('apnConnection  : ', apnConnection);
  debug('device         : ', device);

  notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  notification.badge = badgeNumber;
  notification.sound = "ping.aiff";
  notification.alert = alertMessage;
  notification.payload = payload;
  debug('notification   : ', notification);

  apnConnection.pushNotification(notification, device);
};