travis-notification-hub
=======================

A node/mongoose service that would serve as a middle-tier hub for dispatching build notifications to Android and iOS applications.


### Travis Notification Hub API

##### Devices

A device that has the mobile client with a uniquely identifiable `deviceId`

`PUT /devices/:deviceId`
 - Create or update the device with `deviceId` along with APNS or GCM unique identifier
 
#### Repositories
 
A collection of GitHub repositories with Travis-CI builds that a device could subscribe to for notifications
 
`PUT /devices/:deviceId/repos/:repoId`
 - Subscribe the device with `deviceId` for push notifications from the repository with id `repoId`
  
`DELETE /devices/:deviceId/repos/:repoId`
 - Unsubscribe the device with `deviceId` for push notifications from the repository with id `repoId`

`DELETE /devices/:deviceId/repos`
 - Unsubscribe all previously subscribed repositories

#### Notifications

A notification from Travis-CI for every completed build along with their build status and repository id.

`POST /notifications`
 - Dispatch push notifications to all devices that have subscribed to the repository in the incoming notification
