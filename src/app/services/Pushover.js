import PushoverRestClient from '../lib/pushover-rest-client'
import PushoverWSClient from '../lib/pushover-ws-client'
import store from './Store'
import Debug from '../lib/debug'
import { pushoverStatusSelector } from '../selectors/PushoverSelectors'

const debug = Debug('Pushover')
const state = store.getState()
let pushoverState = pushoverStatusSelector(state)

// Rest Client
let options = {
  debug: true
}
// If logged in provide secret and deviceId to pushoverClient
if (pushoverState.isLoggedIn) {
  options.secret = state.pushover.userSecret
}
if (pushoverState.isDeviceRegistered) {
  options.deviceId = state.pushover.deviceId
}
const restClient = new PushoverRestClient(options)

export default restClient

// Websocket
let wsClient = null

function initWSClient() {
  const currentState = store.getState()
  pushoverState = pushoverStatusSelector(currentState)
  if (pushoverState.isLoggedIn && pushoverState.isDeviceRegistered) {
    wsClient = new PushoverWSClient({
      userSecret: currentState.pushover.userSecret,
      deviceId: currentState.pushover.deviceId
    })
    return true
  }
  return false
}

export function connectWS() {
  // Do we need to init the ws client?
  if (wsClient === null) {
    if (!initWSClient()) {
      debug.log('Could not init Websocket, not logged in or no device registered')
      return false
    }
  }

  wsClient.connect()
  return wsClient
}

export function disconnectWS() {
  if (wsClient !== null) {
    try {
      wsClient.disconnect()
    } catch (e) {
      debug.log('Error during disconnect.', e)
    }
    wsClient = null
  }
}
