var debug = require ('debug') ('hub:models:repo'),
    mongoose = require ('mongoose'),
    repoSchema = new mongoose.Schema ({
                                        repoId            : { type : String, unique : true, required : true },
                                        name              : { type : String, required : true },
                                        lastBuildFailed   : Boolean,
                                        lastBuildFinished : Date,
                                        created           : Date,
                                        updated           : { type : Date, default : Date.now }
                                      });

repoSchema.methods.findByRepoId = function (callback) {
  debug ('Inside models.repo findByRepoId for repoId: %s', this.repoId);
  return this.model ('Repo').find ({repoId : this.repoId}, callback);
};

var Repo = mongoose.model ('Repo', repoSchema);

module.exports = Repo;