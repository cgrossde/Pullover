export const SET_USER_KEY = 'SET_USER_KEY'
export const SET_USER_SECRET = 'SET_USER_SECRET'
export const SET_DEVICE_NAME = 'SET_DEVICE_NAME'
export const SET_DEVICE_ID = 'SET_DEVICE_ID'

export function setUserKey(key) {
  return { type: SET_USER_KEY, key }
}

export function setUserSecret(secret) {
  return { type: SET_USER_SECRET, secret }
}

export function setDeviceName(name) {
  return { type: SET_DEVICE_NAME, name }
}

export function setDeviceId(id) {
  return { type: SET_DEVICE_ID, id }
}
