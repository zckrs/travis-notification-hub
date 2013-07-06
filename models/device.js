var mongoose = require('mongoose'),
    deviceSchema = new mongoose.Schema({
                                         deviceId   : { type : String, unique : true, required : true },
                                         name       : { type : String, default : '' },
                                         platform   : { type : String, required : true },
                                         android    : {
                                           registrationId : { type : String, default : '' }
                                         },
                                         iOS        : {
                                           pushBadge   : { type : String, default : '' },
                                           pushSound   : { type : String, default : '' },
                                           pushAlert   : { type : String, default : '' },
                                           enabled     : { type : String, default : '' },
                                           deviceToken : { type : String, default : '' }
                                         },
                                         repos      : [],
                                         badgeCount : { type : Number, default : 0 },
                                         pushCount  : { type : Number, default : 0 },
                                         created    : Date,
                                         updated    : { type : Date, default : Date.now }
                                       });

module.exports = mongoose.model('Device', deviceSchema);