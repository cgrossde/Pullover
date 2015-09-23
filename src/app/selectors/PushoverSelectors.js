import { createSelector } from 'reselect'

// Get relevant part of state
const pushoverSelector = (state) => state.pushover

export const isLoggedInSelector = createSelector(
  pushoverSelector,
  (pushover) => {
    return {
      isLoggedIn: (! pushover.userKey === undefined || ! pushover.userSecret === undefined )
    }
  }
)

export const isDeviceRegisteredSelector = createSelector(
  pushoverSelector,
  (pushover) => {
    return {
      isDeviceRegistered: (! pushover.deviceName === undefined
        || ! pushover.deviceId === undefined )
    }
  }
)

export const pushoverStatusSelector = createSelector(
  isLoggedInSelector,
  isDeviceRegisteredSelector,
  (isLoggedIn, isDeviceRegistered) => {
    return {
      isLoggedIn: isLoggedIn.isLoggedIn,
      isDeviceRegistered: isDeviceRegistered.isDeviceRegistered
    }
  }
)

