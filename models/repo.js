var mongoose = require('mongoose'),
    repoSchema = new mongoose.Schema({
                                       repoId            : { type : String, unique : true, required : true },
                                       name              : { type : String, required : true },
                                       devicesSubscribed : { type : Number, default : 1 },
                                       lastBuildFailed   : Boolean,
                                       lastBuildFinished : Date,
                                       created           : Date,
                                       updated           : { type : Date, default : Date.now }
                                     });

module.exports = mongoose.model('Repo', repoSchema);