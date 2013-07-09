travis-notification-hub
=======================

A node.js RESTful service that serves as a middle-tier hub for dispatching Travis-CI build notifications to Android and iOS applications.

[![Build Status](https://travis-ci.org/floydpink/travis-notification-hub.png?branch=master)](https://travis-ci.org/floydpink/travis-notification-hub)

### Travis Notification Hub API

##### Devices

A device that has the mobile client with a uniquely identifiable `deviceId`

`PUT /devices/:deviceId`
 - Create or update the device with `deviceId` along with APNS or GCM unique identifier
 
The request payload for device (where either `iOS` or `android` has to be populated to match `platform` value:

```
{
  "deviceId" : "Unique identifier",
  "name"     : "Friendly name",
  "platform" : "iOS | Android",
  "iOS"      : {
    "pushBadge"   : "0 | 1",
    "pushSound"   : "0 | 1",
    "pushAlert"   : "0 | 1",
    "enabled"     : "0 | 1",
    "deviceToken" : "APNS device token"
  },
  "android"  : {
    "registrationId" : "GCM registration id"
  }
}
```

#### Repositories
 
A collection of GitHub repositories with Travis-CI builds that a device could subscribe to for notifications
 
`PUT /devices/:deviceId/repos/:repoId`
 - Subscribe the device with `deviceId` for push notifications from the repository with id `repoId`

`DELETE /devices/:deviceId/repos/:repoId`
 - Unsubscribe the device with `deviceId` for push notifications from the repository with id `repoId`

The request payload for both the above endpoints with device and repo details:

```
{
  "deviceId" : "Unique identifier",
  "repo"     : {
    "repoId" : "Travis-CI identifier for the repo (egs. 543678)",
    "name"   : "Name of the repo (egs. floydpink/travis-notification-hub)"
  }
}
```
 
`DELETE /devices/:deviceId/repos`
 - Unsubscribe all previously subscribed repositories

The request payload for this request just has the `deviceId`:

```
{
  "deviceId" : "Unique identifier"
}
```

For all the four endpoints above, the `deviceId` (and `repoId`, if applicable) in the payload should match the ones in the URL.

#### Notifications

A notification from Travis-CI for every completed build along with their build status and repository id.

`POST /notifications`
 - Dispatch push notifications to all devices that have subscribed to the repository in the incoming notification

The request payload will have build status and the repo identifier and name:

```
{
  "buildFailed" : false | true,
  "repoId"      : "Travis-CI identifier for the repo (egs. 543678)",
  "name"        : "Name of the repo (egs. floydpink/travis-notification-hub)"
}
```

### Tests

Run the tests using `npm test`



Just so I could earn some bragging rights, please endorse me on coderwall!

[![endorse](https://api.coderwall.com/floydpink/endorsecount.png)](https://coderwall.com/floydpink)

[![githalytics.com alpha](https://cruel-carlota.gopagoda.com/67fe97666dd7b901a453ee7792e81e74 "githalytics.com")](http://githalytics.com/floydpink/travis-notification-hub)
