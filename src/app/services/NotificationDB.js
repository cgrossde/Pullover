/**
 * Store notifications and known apps in DB
 *
 * Example JSON:
 *
 * [ { id: 2, // ID unique to this device
    message: 'This message confirms that you are now able to receive messages on this device',
    app: 'Pushover',
    aid: 1,
    icon: 'pushover',
    date: 1448839221,
    priority: 0,
    acked: 0,
    umid: 6298, // Unique ID over all devices
    title: 'Welcome to Pushover!' } ]
 */
import path from 'path'
import Datastore from 'nedb'
import Promise from 'promise'
import { EventEmitter } from 'events'

import Paths from './Paths'
import Debug from '../lib/debug'

var debug = Debug('NotificationDB')


class NotificationDB extends EventEmitter {

  constructor() {
    // Init eventemitter
    super()
    // Init DB
    this.notificationDB = new Datastore(
      { filename: path.join(Paths.getNotificationDBPath(), 'notifications.db'), autoload: true }
    )
    // DEBUG
    global.notificationDB = this.notificationDB
  }

  add(notification) {
    return new Promise((resolve, reject) => {
      // Store the original id(unique to this device only!!), but make clear it's
      // not the identifier (nedb will generate one for us: _id)
      notification.originalId = notification.id
      delete notification.id
      // Store notification
      this.notificationDB.insert(notification, (err, newDoc) => {
        if (err) {
          debug.log('Error in addNotifications', err)
          reject({
            name: 'dbfailure',
            message: (err && err.message) ? err.message : 'Unkown error'
          })
        }
        this.emit('newNotification', newDoc)
        this.updateCount()
        resolve(newDoc)
      })
    })
  }

  isNew(notification) {
    return new Promise((resolve, reject) => {
      this.notificationDB.findOne({umid: notification.umid}, (err, res) => {
        if (err || res !== null) {
          reject(new Error('notificationExists'))
        }
        resolve()
      })
    })
  }

  count() {
    return new Promise((resolve, reject) => {
      this.notificationDB.count({}, (err, count) => {
        if (err)
          reject(err)
        resolve(count)
      })
    })
  }

  updateCount() {
    this.count().then((count) => {
      this.emit('newCount', count)
    })
  }

  getDBInstance() {
    return this.notificationDB
  }


}



// function purgeOldNotifications() {
//   // TODO:
// }

// function purgeNotificationsByApp() {
//   // TODO:
// }

// function purgeAllNotifications() {
//   // TODO:
// }

export default new NotificationDB()

