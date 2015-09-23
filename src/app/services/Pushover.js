import PushoverRestClient from '../lib/pushover-rest-client'
import store from './Store'
import { pushoverStatusSelector } from '../selectors/PushoverSelectors'

const state = store.getState()
const pushoverState = pushoverStatusSelector(state)

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
