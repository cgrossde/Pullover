import Debug from '../lib/debug'
var debug = Debug('ConnectionManager')

import {
  SET_USER_DATA,
  SET_DEVICE_DATA,
  UPDATE_CONNECTION_STATE,
  UPDATE_SYNC_DATE,
  LOGOUT
} from '../actions/Pushover'

// Load values from localStorage
const initialState = {
  userKey: localStorage.getItem('userKey'),
  userEmail: localStorage.getItem('userEmail'),
  userSecret: localStorage.getItem('userSecret'),
  deviceName: localStorage.getItem('deviceName'),
  deviceId: localStorage.getItem('deviceId'),
  connectionStatus: 'STOPPED',
  latestSyncDate: localStorage.getItem('latestSyncDate')
}

export function pushoverStateReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER_DATA:
      const { userKey, userEmail, userSecret } = action.userData
      localStorage.setItem('userKey', userKey)
      localStorage.setItem('userEmail', userEmail)
      localStorage.setItem('userSecret', userSecret)
      return Object.assign({}, state, {
        userKey,
        userEmail,
        userSecret
      })

    case SET_DEVICE_DATA:
      const { deviceName, deviceId } = action.deviceData
      localStorage.setItem('deviceName', deviceName)
      localStorage.setItem('deviceId', deviceId)
      return Object.assign({}, state, {
        deviceName,
        deviceId
      })

    case UPDATE_SYNC_DATE:
      const latestSyncDate = new Date().getTime()
      localStorage.setItem('latestSyncDate', latestSyncDate)
      return Object.assign({}, state, {
        latestSyncDate
      })

    case UPDATE_CONNECTION_STATE:
      const connectionStatus = action.connectionState
      const allowedStates = ['STOPPED', 'OFFLINE', 'ONLINE']
      // Is it an allowed connection state?
      if (allowedStates.indexOf(connectionStatus) === -1) {
        debug.log('Invalid connection status: ' + connectionStatus)
        return state
      }
      return Object.assign({}, state, {
        connectionStatus
      })

    case LOGOUT:
      localStorage.removeItem('userKey')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userSecret')
      localStorage.removeItem('deviceName')
      localStorage.removeItem('deviceId')
      return Object.assign({}, initialState)

    default:
      return state
  }
}
