var mongoose = require('mongoose'),
    repoSchema = new mongoose.Schema({
                                       repoId            : { type : String, unique : true, required : true },
                                       name              : { type : String, required : true },
                                       devicesSubscribed : { type : Number, default : 0 },
                                       lastBuildFailed   : { type : Boolean, default : false },
                                       lastBuildFinished : Date,
                                       gcmPushCount      : { type : Number, default : 0 },
                                       apnPushCount      : { type : Number, default : 0 },
                                       created           : Date,
                                       updated           : { type : Date, default : Date.now }
                                     });

module.exports = mongoose.model('Repo', repoSchema);