export const SET_USER_DATA = 'SET_USER_DATA'
export const SET_DEVICE_DATA = 'SET_DEVICE_DATA'
export const UPDATE_CONNECTION_STATE = 'UPDATE_CONNECTION_STATE'
export const UPDATE_SYNC_DATE = 'UPDATE_SYNC_DATE'
export const LOGOUT = 'LOGOUT'

export function setUserData(userData) {
  return { type: SET_USER_DATA, userData }
}

export function setDeviceData(deviceData) {
  return { type: SET_DEVICE_DATA, deviceData }
}

export function updateConnectionState(connectionState) {
  return { type: UPDATE_CONNECTION_STATE, connectionState }
}

export function updateSyncDate() {
  return { type: UPDATE_SYNC_DATE }
}

export function logout() {
  return { type: LOGOUT }
}
