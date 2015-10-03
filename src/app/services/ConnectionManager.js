/**
 * Manages fetching and displaying of notifications
 *
 * - Reconnects the websocket every half hour or
 *   when a wake from sleep was detected.
 * - Before the websocket is reconnected a fetch is made.
 * - Should more than X notifications come with this fetch
 *   only the last X will be displayed.
 */

import Promise from 'promise'
import isOnline from 'is-online'
import isReachable from 'is-reachable'

import Debug from '../lib/debug'
import store from '../services/Store'
import pushover from '../services/Pushover'
import wakeDetect from '../lib/wake-detect'
import { updateConnectionState, updateSyncDate } from '../actions/Pushover'

var debug = Debug('ConnectionManager')

// Reconnect every x min
let reconnectInterval = null
let reconnectSpan = 1000 * 60 * 30 // 30 min

// If OFFLINE => check internet connection every x min
let checkInternetInterval = null
let checkInternetSpan = 1000 * 60 // 1 min
let checkingInternet = false

function start() {
  store.dispatch(updateConnectionState('ONLINE'))
  // Start reconnect interval
  reconnectInterval = setInterval(() => {
    debug.log('Reconnect after 30 min')
    reconnect()
  }, reconnectSpan)

  // Fetch notifications and open web socket
  fetchAndConnect();

  // Start listening for wake events
  wakeDetect.start()
}
let online = start // alias for start function

function stop() {
  store.dispatch(updateConnectionState('STOPPED'))
  // Stop listening for wake events
  wakeDetect.stop()
  // Stop reconnect interval
  clearInterval(reconnectInterval)
  // Stop check internet interval
  clearInterval(checkInternetInterval)
  // Stop WS
  disconnectWS()
}

function reconnect() {
  debug.log('Reconnect')
  stop()
  start()
}

// Attach on wake listener only once
// Reconnect on wake
wakeDetect.on('wake', (sleepSecs) => {
  debug.log('Device woke up after ' + sleepSecs + 's of sleep')
  reconnect()
})

function offline() {
  store.dispatch(updateConnectionState('OFFLINE'))
  stop()
  debug.log('Offline')
  // Setup interval to check internet connection
  // and pushover availability
  checkInternetInterval = setInterval(checkInternetConnection, checkInternetSpan)
}

function checkInternetConnection() {
  // Don't run more than one check concurrently
  if (checkingInternet) {
    return
  } else {
    checkingInternet = true
  }
  // Are we online?
  isOnline(function(err, internetOnline) {
    if(internetOnline) {
      // Is pushover reachable
      isReachable('api.pushover.net:443', function(err, reachable) {
        if(reachable) {
          debug.log('We are online again')
          clearInterval(checkInternetInterval)
          online()
        }
        checkingInternet = false;
      });
    } else {
      checkingInternet = false;
    }
  });
}

function fetchAndConnect() {
  debug.log('fetchAndConnect')
  // Fetch new notifications
  fetchNotifications()
  // Start WS
  connectWS();
}

function fetchNotifications() {
  if(! pushover.ready()) {
    debug.log('Pushover not ready, secret or device id missing')
    return
  }

  pushover.fetchNotifications()
  .then(function(notifications) {
    store.dispatch(updateSyncDate())
    debug.log('Received ' + notifications.length + ' notifications')
  })
  .catch(function(error) {
    debug.log('Error')
    offline()
    // Check if connection or auth error
  })
}

function connectWS() {

}

function disconnectWS() {

}

export { start as connectToPushover }
export { stop as disconnectFromPushover }
export { reconnect as reconnectToPushover }