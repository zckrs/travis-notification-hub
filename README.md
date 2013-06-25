travis-notification-hub
=======================

A node.js/mogodb service that would serve as a middle-tier hub for dispatching notifications to Android and iOS applications


API
===

##### Devices

A device that has the mobile client with a uniquely identifiable `deviceId`

`PUT /devices/:id`
 - Create or update a device
 
#### Repositories
 
A collection of GitHub repositories with Travis-CI builds that a device could subscribe to for notifications
 
`PUT /devices/:id/repos/:id`
 - Subscribe to a repository
  
`DELETE /devices/:id/repos/:id`
 - Unsubscribe to a specific repository

`DELETE /devices/:id/repos`
 - Unsubscribe to all previously subscribed repositories

#### Notifications

A collection of notifications from Travis-CI builds along with their build status and repository

`PUT /notifications`
 - Create push notifications for all devices that have subscribed to the repositories in the collection of notifications
