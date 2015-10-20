import Debug from '../lib/debug'
var debug = Debug('SettingsStateReducer')

import {
  SET_DISPLAY_TIME,
  ENABLE_NATIVE_NOTIFICATIONS,
  DISABLE_NATIVE_NOTIFICATIONS,
  SET_MAX_NOTIFICATION_AMOUNT
} from '../actions/Settings'

// Load values from localStorage
const initialState = {
  displayTime: localStorage.getItem('displayTime') || 7,
  nativeNotifications: localStorage.getItem('') || false,
  maxNotificationAmount: localStorage.getItem('maxNotificationAmount')
}

export function pushoverStateReducer(state = initialState, action) {
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

    default:
      return state
  }
}
