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
import pushover, { connectWS, disconnectWS } from '../services/Pushover'
import wakeDetect from '../lib/wake-detect'
import {
  updateConnectionState,
  updateSyncDate,
  logout as logoutPushover
} from '../actions/Pushover'

var debug = Debug('ConnectionManager')

// Reconnect every x min
let reconnectInterval = null
const reconnectSpan = 1000 * 60 * 30 // 30 min

// If OFFLINE => check internet connection every x min
let checkInternetInterval = null
const checkInternetSpan = 1000 * 60 * 2 // 2 min
let checkingInternet = false

// Handle login failures: Before we logout the user
// we wait for at least 3 consecutive login failures
let loginFails = 0
const maxLoginFails = 3
const waitAfterLoginFail = 1000 * 60 * 1 // 1 min

// Ref to pushover ws client
let wsClient = null

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
  // Start WS
  connectToWS()
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
  wsClient.removeAllListeners()
  disconnectWS()
}

function checkInternetConnection() {
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
    store.dispatch(logoutPushover())
  }
  else {
    debug.log('Login failed (' + loginFails + ' of ' + maxLoginFails + ') - ' + type)
    stop()
    store.dispatch(updateConnectionState('OFFLINE'))
    setTimeout(start, waitAfterLoginFail)
  }
}

function fetchNotifications() {
  if (! pushover.ready()) {
    debug.log('Pushover not ready, secret or device id missing')
    return
  }

  pushover.fetchNotifications()
  .then(function(notifications) {
    store.dispatch(updateSyncDate())
    loginFails = 0
    debug.log('Received ' + notifications.length + ' notifications', notifications)
  })
  .catch(function(error) {
    // Check if connection or auth error
    if (error.name === 'InvalidCredentials') {
      loginFailed('fetch')
    }
    else {
      debug.log('Fetch failed - offline', error)
      offline()
    }
  })
}

export { start as connectToPushover }
export { stop as disconnectFromPushover }
export { reconnect as reconnectToPushover }
