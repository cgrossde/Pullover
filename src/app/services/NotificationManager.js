/**
 * Manages displaying and storing of notifications
 *
 * Create better notification handling by moving to a functional approach.
 * The following rules need to be respected:
 * - Respect maxNotificationAmount (e.g. on startup) and show notification if some were skipped -> notifyStream
 * - Limit notifications shown to one per X ms -> notifyStream
 * - Acknowledge last notification -> latestNotificationStream
 * - Persist every notification in the database -> singleNotificationStream
 * - Only play each type of sound once within a X sec timeframe => notifyStream
 * - Notifications with a priority of -2 are not shown
 * - Notifications with a priority of -1 have no sound
 *
 * The notification database is seperated from notifying.
 * The database needs to check if the notification is already present
 * before storing it.
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

import Rx from '../lib/RxExtended'
import Debug from '../lib/debug'
import notificationDB from './NotificationDB'
import Settings from '../services/Settings'
import { notify } from './Notifier'
import Pushover from './Pushover'

const debug = Debug('NotificationManager')

// Limit notifications shown to one per X ms
// This is needed because OS X shows every notification at once and
// Would hide notifications if multiple arrive at the same time
const notifyBufferingInMs = 1500
// When receiving a lot of notification we don't want to hear the same sound
// in a loop. Only repeat a sound if it wasn't played for X ms
const msUntilSoundIsRepeated = 10 * 1000
const maxNotificationAmount = Settings.get('maxNotificationAmount')
debug.log('maxNotificationAmount', maxNotificationAmount)

// The observer and observable, which reacts on calls to processNotifications from the ConnectionManager
const notificationArrayStream = new Rx.Subject()
export function processNotifications(notificationArray) {
  // Add notificationArray to notificationArrayStream
  if (notificationArray.length > 0)
    notificationArrayStream.onNext(notificationArray)
}

//
// STREAMS
//

// Stream with every received notification (no array, single objects)
const singleNotificationStream = notificationArrayStream
  .flatMap((x) => x)
//
// Stream with the last notification of each notificationArray to acknowledge the reception
const latestNotificationStream = notificationArrayStream
  .map((x) => x[x.length - 1])

// Stream that only contains notifications which should be presented to the user
let notifyStream = notificationArrayStream
// Only present the 'maxNotificationAmount' most recent notifications, to avoid flooding
  .map((x) => {
    if (x.length > maxNotificationAmount) {
      const omittedNotifications = x.length - maxNotificationAmount
      x = x.slice(-maxNotificationAmount)
      x.push({
        title: 'Omitted ' + omittedNotifications + ' notifications',
        message: 'Change with setting "max notification queue"',
        sound: 'po',
        priority: 0
      })
    }
    return x
  })
  .flatMap((x) => x)

  // Don't show if priority === -2
  .filter((x) => {
    return (x.priority > -2)
  })

  // Set default sound if none was set
  // Delete sound of 'no' (for none) was selected
  .map((x) => {
    if (!x.sound)
      x.sound = Settings.get('defaultSound')
    if (x.sound === 'no')
      delete x.sound
    return x
  })

// Only emit one notification every X ms if client uses native notifications
// Those are usually emitted at once (at least OS X 10.11.3) and the user would
// not see all notifications if multiple are retrieved at the same time
notifyStream = notifyStream.limitRate(notifyBufferingInMs)

// Continue processing...
notifyStream = notifyStream
// Only play sound if it wasn't played in the last X seconds
  .groupBy(
    (x) => x.sound,
    (x) => x
  )
  .flatMap((x) => {
    return x.throttleMap(msUntilSoundIsRepeated, (x) => {
      x.playSound = true
      return x
    })
  })

  // Don't play sound if priority === -1 or playSound !== true
  .map((x) => {
    if (x.priority === -1 || !x.playSound)
      delete x.sound
    return x
  })


//
// ACTIONS
//

// Save every notification
singleNotificationStream
  .subscribe((notification) => {
    // Check if new before adding to db
    notificationDB.isNew(notification)
      .then((res) => {
        notificationDB.add(notification)
      })
      .catch((err) => {
        if (err.message === 'notificationExists') {
          debug.log('Notification with id ' + notification.umid + ' exists already in DB.')
        }
        else {
          debug.log('Failed saving notification', err, notification)
        }
      })
      .done()
  })

// Acknowledge last notification in received notificationArray
latestNotificationStream
  .subscribe((lastNotification) => {
    // Don't acknowledge notifications in debug mode
    if (process.env.DEBUG === '1') {
      debug.log('DEBUG MODE - will not acknowledge notifications')
    } else {
      Pushover.acknowledgeNotification({ lastNotificationId: lastNotification.id })
        .catch(function (err) {
          debug.log('Failed to acknowledge reception of notifications. lastNotificationId: '
            + lastNotificationId.id, err)
        })
        .done()
    }
  })

// Present notifications to the user
notifyStream
  .subscribe(debug.catchErrorWrapper(notify))

