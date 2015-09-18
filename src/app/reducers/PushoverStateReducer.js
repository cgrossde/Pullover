import {
  SET_USER_KEY,
  SET_USER_SECRET,
  SET_DEVICE_NAME,
  SET_DEVICE_ID
} from '../actions/Pushover'

// Load values from localStorage
const initialState = {
  userKey: localStorage.userKey,
  userSecret: localStorage.userSecret,
  deviceName: localStorage.deviceName,
  deviceId: localStorage.deviceId,
}

export function pushoverStateReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER_KEY:
      localStorage.userKey = action.key
      return Object.assign({}, state, {
        userKey: action.key
      })
    case SET_USER_SECRET:
      localStorage.userSecret = action.secret
      return Object.assign({}, state, {
        userSecret: action.secret
      })
    case SET_DEVICE_NAME:
      localStorage.deviceName = action.name
      return Object.assign({}, state, {
        deviceName: action.name
      })
    case SET_DEVICE_ID:
      localStorage.deviceId = action.id
      return Object.assign({}, state, {
        deviceId: action.id
      })
    default:
      return state
  }
}
