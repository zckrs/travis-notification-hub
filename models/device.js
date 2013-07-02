var debug = require('debug')('hub:models:device'),
    mongoose = require('mongoose'),
    deviceSchema = new mongoose.Schema({
      deviceId   : { type : String, unique : true, required : true },
      name       : String,
      platform   : { type : String, required : true},
      repos      : [],
      badgeCount : {type : Number, default : 0},
      android    : {registrationId : String},
      iOS        : {
        pushBadge   : String,
        pushSound   : String,
        pushAlert   : String,
        enabled     : String,
        deviceToken : String
      },
      created    : Date,
      updated    : { type : Date, default : Date.now }
    });

deviceSchema.methods.findByDeviceId = function (callback) {
  debug('Inside models.device findDeviceById for deviceId: %s', this.deviceId);
  return this.model('Device').find({deviceId : this.deviceId}, callback);
};

var Device = mongoose.model('Device', deviceSchema);

module.exports = Device;