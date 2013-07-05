var mongoose = require('mongoose'),
    deviceSchema = new mongoose.Schema({
                                         deviceId   : { type : String, unique : true, required : true },
                                         name       : String,
                                         platform   : { type : String, required : true },
                                         android    : { registrationId : String },
                                         iOS        : {
                                           pushBadge   : String,
                                           pushSound   : String,
                                           pushAlert   : String,
                                           enabled     : String,
                                           deviceToken : String
                                         },
                                         repos      : [],
                                         badgeCount : { type : Number, default : 0 },
                                         pushCount  : { type : Number, default : 0 },
                                         created    : Date,
                                         updated    : { type : Date, default : Date.now }
                                       });

module.exports = mongoose.model('Device', deviceSchema);