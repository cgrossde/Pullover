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
  if (notificationArray.length === 0)
    return
  // Respect max notification amount (default: 20)
  const maxNotificationAmount = Settings.get('maxNotificationAmount')
  debug.log('maxNotificationAmount', maxNotificationAmount)
  // Process notifications
  notificationArray
    .forEach((notification, index) => {
      const remainingNotifications = notificationArray.length - index
      const showNotification = (maxNotificationAmount === null
        || remainingNotifications <= maxNotificationAmount)
      processNotification(notification, showNotification)
    })
  // If we ommited showing some notifications(maxNotificationAmount) tell the user how many
  if(maxNotificationAmount < notificationArray.length) {
    const ommitedNotifications = notificationArray.length - maxNotificationAmount
    setTimeout(() => {
      notify({
        title: 'Skipped ' + ommitedNotifications + ' older notifications',
        message: 'Change with setting "max notification queue"'
      })
    }, 500);
  }

  const lastNotification = notificationArray.pop()
  // Acknowledge reception of messages
  return Pushover.acknowledgeNotification({ lastNotificationId: lastNotification.id })
    .catch(function(err) {
      debug.log('Failed to acknowledge reception of notifications. lastNotificationId: '
       + lastNotificationId.id)
    })
}

function processNotification(notification, show = true) {
  // Make sure notifications with priority -2 are not shown
  if(notification.priority === -2)
    show = false
  // Check if new before adding to db
  notificationDB.isNew(notification)
    .then((res) => {
      if (show) notify(notification)
      return notificationDB.add(notification)
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
    .done()
}
