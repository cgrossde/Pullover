/**
 * Store notifications and known apps in DB
 *
 * Example JSON:
 *
 * [ { id: 2,
    message: 'This message confirms that you are now able to receive messages on this device',
    app: 'Pushover',
    aid: 1,
    icon: 'pushover',
    date: 1448839221,
    priority: 0,
    acked: 0,
    umid: 6298,
    title: 'Welcome to Pushover!' } ]
 */

// Treo only looks in the global space
global.indexedDB = window.indexedDB

import treo from 'treo'
import treoPromise from '../lib/treo-promise-plugin-fix'

import Debug from '../lib/debug'
var debug = Debug('NotificationDB')


class NotificationDB {

  constructor() {
    // Init DB
    const schema = treo.schema()
      .version(1)
        .addStore('apps', { key: 'aid' })
        .addStore('notifications', { key: 'id' })
        .addIndex('byAppId', 'aid')
        .addIndex('byDate', 'date')

    const db = treo('pushover', schema)
      .use(treoPromise())

    this.appDB = db.store('apps')
    this.notificationDB = db.store('notifications')
    // DEBUG
    global.appDB = this.appDB
    global.notificationDB = this.notificationDB
  }

  add(notification) {
    // Create/update app collection
    return this.appDB.put(notification)
      .then(() => {
        this.appDB.all()
          .then((appList) => {
            console.log('AppList:', appList)
          })
      })
      .catch((err) => {
        console.log('Error in addNotifications', err)
        throw {
          name: 'dbfailure',
          message: (err && err.message) ? err.message : 'Unkown error'
        }
      })
  }

  isNew(notification) {
    return this.notificationDB.get(notification.id)
      .then(function(result) {
        if (result !== undefined) {
          throw new Error('notificationExists')
        }
      })
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

