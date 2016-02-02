import Autorun from 'autorun'
import Debug from '../lib/debug'

var autorun = new Autorun('Pullover')
var debug = Debug('SettingsStateReducer')

import {
  SET_DISPLAY_TIME,
  ENABLE_NATIVE_NOTIFICATIONS,
  DISABLE_NATIVE_NOTIFICATIONS,
  SET_MAX_NOTIFICATION_AMOUNT,
  ENABLE_RUN_ON_STARTUP,
  DISABLE_RUN_ON_STARTUP,
} from '../actions/Settings'

// Load values from localStorage
const initialState = {
  displayTime: localStorage.getItem('displayTime') || 7,
  nativeNotifications: localStorage.getItem('nativeNotifications') || false,
  maxNotificationAmount: localStorage.getItem('maxNotificationAmount'),
  runOnStartup: localStorage.getItem('runOnStartup') || false
}

// // If runOnStartup is not defined we enable it and set it to true
// // if the operating system is supported. This should only happen on first runs
// if(initialState.runOnStartup === null) {
//   initialState.runOnStartup = true
//   localStorage.setItem('runOnStartup', true)
//   // If platform is not supported the settings value is irrelevant
//   // and will also not be shown on settings page
//   if (autorun.isPlatformSupported()) {
//     autorun.enable()
//     .then(() => {
//       debug.log('Enabled autorun, was null before => first run?')
//     })
//     .catch((err) => {
//       debug.log('Failed to enabled autorun, was null before.', err)
//     })
//   }
// }

export function settingsStateReducer(state = initialState, action) {
  switch (action.type) {
    case SET_DISPLAY_TIME:
      const displayTime = action.displayTime
      localStorage.setItem('displayTime', displayTime)
      return Object.assign({}, state, {
        displayTime
      })

    case ENABLE_NATIVE_NOTIFICATIONS:
      localStorage.setItem('nativeNotifications', true)
      return Object.assign({}, state, {
        nativeNotifications: true
      })

    case DISABLE_NATIVE_NOTIFICATIONS:
      localStorage.setItem('nativeNotifications', false)
      return Object.assign({}, state, {
        nativeNotifications: false
      })

    case SET_MAX_NOTIFICATION_AMOUNT:
      const maxNotificationAmount = action.maxNotificationAmount
      if (Number.isFinite(maxNotificationAmount) && maxNotificationAmount >= 0) {
        return Object.assign({}, state, {
          maxNotificationAmount
        })
      }
      else {
        return state
      }

    case ENABLE_RUN_ON_STARTUP:
      localStorage.setItem('runOnStartup', true)
      if (autorun.isPlatformSupported()) {
        autorun.enable()
        .then(() => {
          debug.log('Enabled autorun')
        })
        .catch(() => {
          // TODO: This would be bad, ... not sure what to do about it yet
          // Triggering DISABLE_RUN_ON_STARTUP could also cause an error
          // and lead to a loop.
          debug.log('Failed to enable autorun', err)
        })
      }
      return Object.assign({}, state, {
        runOnStartup: true
      })

    case DISABLE_RUN_ON_STARTUP:
      localStorage.setItem('runOnStartup', false)
      if (autorun.isPlatformSupported()) {
        autorun.disable()
        .then(() => {
          debug.log('Disabled autorun')
        })
        .catch(() => {
          // TODO: This would be bad, ... not sure what to do about it yet
          debug.log('Failed to disable autorun', err)
        })
      }
      return Object.assign({}, state, {
        runOnStartup: false
      })

    default:
      return state
  }
}
