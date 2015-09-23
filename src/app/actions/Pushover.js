export const SET_USER_DATA = 'SET_USER_DATA'
export const SET_DEVICE_DATA = 'SET_DEVICE_DATA'
export const LOGOUT = 'LOGOUT'

export function setUserData(userData) {
  return { type: SET_USER_DATA, userData }
}

export function setDeviceData(deviceData) {
  return { type: SET_DEVICE_DATA, deviceData }
}

export function logout() {
  return { type: LOGOUT }
}
