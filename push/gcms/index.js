var gcm = require('node-gcm'),
    config = require('../../config'),
    debug = require('debug')('hub:gcms');

exports.push = function (registrationId, message, badgeNumber, payload) {
  debug('Inside push...');
  debug('registrationId : ', registrationId);
  debug('message        : ', message);
  debug('badgeNumber    : ', badgeNumber);
  debug('payload        : ', payload);

  var sender = new gcm.Sender(config.gcms.senderId),
      notification = new gcm.Message();

  notification.addDataWithKeyValue('message', message);

  if (payload.msgcnt) {
    notification.addDataWithKeyValue('msgcnt', badgeNumber);
  }

  notification.collapseKey = 'demo';
  notification.delayWhileIdle = true;
  notification.timeToLive = 3;

  notification.addDataWithObject(JSON.stringify(payload));

  sender.send(notification, [registrationId], 4, function (err, result) {
    // TODO: Feedback?
    debug('gcms send result: ', result);
  });
};

