/**
 * Manages fetching and displaying of notifications
 *
 * - Reconnects the websocket every half hour or
 *   when a wake from sleep was detected.
 * - Before the websocket is reconnected a fetch is made.
 * - Should more than X notifications come with this fetch
 *   only the last X will be displayed.
 */

import isOnline from 'is-online'
import isReachable from 'is-reachable'

import Debug from '../lib/debug'
import store from './Store'
import pushover, { connectWS, disconnectWS } from '../services/Pushover'
import { showWindow } from '../nw/Window'
import wakeDetect from '../lib/wake-detect'
import { processNotifications } from './NotificationManager'
import {
  updateConnectionState,
  updateSyncDate,
  logout as logoutPushover
} from '../actions/Pushover'

var debug = Debug('ConnectionManager')

// Reconnect every x min
let reconnectInterval = null
const reconnectSpan = 1000 * 60 * 30 // 30 min

// If OFFLINE => check internet connection every x sec
let checkInternetInterval = null
const checkInternetSpan = 1000 * 30 // 30 sec
let checkingInternet = false

// Handle login failures: Before we logout the user
// we wait for at least 3 consecutive login failures
let loginFails = 0
const maxLoginFails = 3
const waitAfterLoginFail = 1000 * 20 // 20 sec

// Ref to pushover ws client
let wsClient = null

// Status var (used to show info on login screen which explains logout)
let maxLoginFailsExceeded = false

// Attach on wake listener only once
// Reconnect on wake
wakeDetect.on('wake', (sleepSecs) => {
  debug.log('Device woke up after ' + sleepSecs + 's of sleep')
  if (! isStopped()) {
    reconnect()
  }
})

function isStopped() {
  return (store.getState().pushover.connectionStatus === 'STOPPED')
}

function start() {
  store.dispatch(updateConnectionState('ONLINE'))
  // Start reconnect interval
  reconnectInterval = setInterval(() => {
    debug.log('Reconnect after 30 min')
    reconnect()
  }, reconnectSpan)

  // Fetch notifications and open web socket
  fetchAndConnect()

  // Start listening for wake events
  wakeDetect.start()
}
let online = start // alias for start function

function stop() {
  store.dispatch(updateConnectionState('STOPPED'))
  // Stop WS
  disconnectFromWS()
  // Stop listening for wake events
  wakeDetect.stop()
  // Stop reconnect interval
  clearInterval(reconnectInterval)
  // Stop check internet interval
  clearInterval(checkInternetInterval)
}

function reconnect() {
  debug.log('Reconnect')
  stop()
  start()
}

function fetchAndConnect() {
  debug.log('fetchAndConnect')
  // Fetch new notifications
  fetchNotifications()
  .done((success) => {
    if (success !== false) {
      debug.log('Connect to WebSocket')
      maxLoginFailsExceeded = false
      // Start WS
      connectToWS()
    }
  })

}

function offline() {
  if (isStopped()) {
    return
  }
  stop()
  store.dispatch(updateConnectionState('OFFLINE'))
  debug.log('Offline')
  // Setup interval to check internet connection
  // and pushover availability
  checkInternetInterval = setInterval(checkInternetConnection, checkInternetSpan)
}

function connectToWS() {
  // Connect and get instance
  wsClient = connectWS()
  wsClient.on('notification', fetchNotifications)
  wsClient.on('error', offline)
  wsClient.on('loginFailed', () => {
    loginFailed('WebSocket')
  })
  wsClient.on('requestedReconnect', reconnect)
  wsClient.on('keepAlive', () => {
    store.dispatch(updateSyncDate())
  })
  wsClient.on('timeout', offline)
}

function disconnectFromWS() {
  if (wsClient !== null) {
    wsClient.removeAllListeners()
    disconnectWS()
  }
}

function checkInternetConnection() {
  debug.log('Checking internet connection')
  // Don't run more than one check concurrently
  if (checkingInternet) {
    return
  }
  else {
    checkingInternet = true
  }
  // Are we online?
  isOnline(function(err, internetOnline) {
    if (internetOnline) {
      // Is pushover reachable
      isReachable('api.pushover.net:443', function(error, reachable) {
        if (reachable) {
          debug.log('We are online again')
          clearInterval(checkInternetInterval)
          online()
        }
        checkingInternet = false
      })
    }
    else {
      checkingInternet = false
    }
  })
}

function loginFailed(type) {
  loginFails++
  if (loginFails >= maxLoginFails) {
    debug.log('Max login fails reached. Logout and relogin. - ' + type)
    maxLoginFailsExceeded = true
    stop()
    store.dispatch(logoutPushover())
    showWindow()
  }
  else {
    debug.log('Login failed (' + loginFails + ' of ' + maxLoginFails + ') - ' + type)
    stop()
    debug.log('Stopped')
    store.dispatch(updateConnectionState('OFFLINE'))
    setTimeout(() => {
      debug.log('Retry login')
      start()
    }, waitAfterLoginFail)
  }
}

function fetchNotifications() {
  if (! pushover.ready()) {
    debug.log('Pushover not ready, secret or device id missing')
    return
  }

  return pushover.fetchNotifications()
  .then(function(notifications) {
    store.dispatch(updateSyncDate())
    loginFails = 0
    debug.log('Received ' + notifications.length + ' notifications')
    return processNotifications(notifications)
  }, (error) => {
    // Check if connection or auth error
    if (error.name === 'InvalidCredentials') {
      loginFailed('fetch')
    }
    else {
      debug.log('Fetch failed - offline', error)
      offline()
    }
    return false
  })
}

function maxLoginFailsReached() {
  return maxLoginFailsExceeded
}

function resetMaxLoginFails() {
  maxLoginFailsExceeded = false
}

export { start as connectToPushover }
export { stop as disconnectFromPushover }
export { reconnect as reconnectToPushover }
export { maxLoginFailsReached }
export { resetMaxLoginFails }
