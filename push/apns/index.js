var apn = require('apn'),
    config = require('../../config'),
    debug = require('debug')('hub:apns');

exports.push = function (deviceToken, message, badgeNumber, payload) {

  debug('deviceToken    : %s', deviceToken);
  debug('message        : %s', message);
  debug('badgeNumber    : %d', badgeNumber);
  //debug('payload        : ', payload);

  var options = {
        "gateway" : config.apns.gateway,
        "cert"    : config.apns.cert,
        "key"     : config.apns.key
      },
      apnConnection = new apn.Connection(options),
      device = new apn.Device(deviceToken),
      notification = new apn.Notification();

  //debug('apnConnection  : ', apnConnection);
  //debug('device         : ', device);

  notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  notification.badge = badgeNumber;
  notification.sound = "ping.aiff";
  notification.alert = message;
  notification.payload = payload;
  //debug('notification   : ', notification);

  apnConnection.pushNotification(notification, device);

  // TODO: Incorporate APNS feedback

};