module.exports = function (app) {

  app.put('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    var postData = JSON.parse(req.body.data);
    if ((req.params.deviceid === postData.deviceId) && (req.params.repoid === postData.repoId)) {
      //TODO: add repo to repos collection for this device
      res.send({
                 type     : 'Repo',
                 repoId   : req.params.repoid,
                 deviceId : req.params.deviceid
               });
    } else {
      res.send('Invalid request.');
    }
  });

  app.delete('/api/devices/:deviceid/repos/:repoid', function (req, res) {
    //TODO: remove repo from repos collection for this device
    res.send('Repository ' + req.params.repoid + ' has been unsubscribed for device ' + req.params.deviceid + '!');
  });

  app.delete('/api/devices/:deviceid/repos', function (req, res) {
    //TODO: remove all repos from repos collection for this device
    res.send('All repositories have been unsubscribed for device ' + req.params.deviceid + '!');
  });

};