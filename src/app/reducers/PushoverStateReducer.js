import {
  SET_USER_DATA,
  SET_DEVICE_DATA,
  LOGOUT
} from '../actions/Pushover'

// Load values from localStorage
const initialState = {
  userKey: localStorage.getItem('userKey'),
  userEmail: localStorage.getItem('userEmail'),
  userSecret: localStorage.getItem('userSecret'),
  deviceName: localStorage.getItem('deviceName'),
  deviceId: localStorage.getItem('deviceId'),
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
