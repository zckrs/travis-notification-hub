var mongoose = require('mongoose'),
    deviceSchema = new mongoose.Schema({
                                         deviceId        : { type : String, unique : true, required : true },
                                         notifyAllBuilds : { type : Boolean, default : false},
                                         phonegapDevice  : {
                                           name     : { type : String, default : ''},
                                           platform : { type : String, required : true },
                                           cordova  : { type : String, default : ''},
                                           version  : { type : String, default : ''},
                                           model    : { type : String, default : ''}
                                         },
                                         android         : {
                                           registrationId : { type : String, default : '' }
                                         },
                                         iOS             : {
                                           enabled     : { type : String, default : '' },
                                           deviceToken : { type : String, default : '' }
                                         },
                                         repos           : [],
                                         badgeCount      : { type : Number, default : 0 },
                                         pushCount       : { type : Number, default : 0 },
                                         created         : Date,
                                         updated         : { type : Date, default : Date.now }
                                       });

module.exports = mongoose.model('Device', deviceSchema);