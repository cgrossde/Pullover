/**
 * Manages displaying and storing of notifications
 *
 * The notification database is seperated from notifying.
 * The database needs to check if the notification is already present
 * before storing it.
 *
 * The notification received acknowledgement is sent by the Notifier
 * once the notification was shown to the user or ignored because of
 * store.settings.maxNotificationAmount
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
    sound: 'po',
    title: 'Welcome to Pushover!' } ]
 */

import notificationDB from './NotificationDB'
import Debug from '../lib/debug'
const debug = Debug('NotificationManager')

import Settings from '../services/Settings'
import { notify } from './Notifier'
import Pushover from './Pushover'


export function processNotifications(notificationArray) {
  if (notificationArray.length < 1)
    return
  // Respect max notification amount, but don't allow more than 30
  const maxNotificationAmount = Settings.get('maxNotificationAmount') || 30
  // Process notifications
  notificationArray
    .forEach((notification, index) => {
      const remainingNotifications = notificationArray.length - index
      const showNotification = (maxNotificationAmount === null
        || remainingNotifications <= maxNotificationAmount)
      processNotification(notification, showNotification)
    })
  const lastNotification = notificationArray.pop()
  // Acknowledge reception of messages
  Pushover.acknowledgeNotification({ lastNotificationId: lastNotification.id })
    .catch(function(err) {
      debug.log('Failed to acknowledge reception of notifications. lastNotificationId: '
       + lastNotificationId.id)
    })
}

function processNotification(notification, show = true) {
  notificationDB.isNew(notification)
    .then((res) => {
      notificationDB.add(notification)
      if (show) notify(notification)
    })
    .catch((err) => {
      if (err.message === 'notificationExists') {
        // Show notification again
        debug.log('Notification with id ' + notification.id + ' exists already in DB.'
          + ' => Will show it again to the user.')
        if (show) notify(notification)
      }
      else {
        console.log('Failed adding message', err)
      }
    })
}
