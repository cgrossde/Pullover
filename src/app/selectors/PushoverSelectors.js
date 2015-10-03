import { createSelector } from 'reselect'

// Get relevant part of state
const pushoverSelector = (state) => state.pushover

export const isLoggedInSelector = createSelector(
  pushoverSelector,
  (pushover) => {
    return {
      isLoggedIn: (pushover.userKey !== null && pushover.userSecret !== null )
    }
  }
)

export const isDeviceRegisteredSelector = createSelector(
  pushoverSelector,
  (pushover) => {
    return {
      isDeviceRegistered: (pushover.deviceName !== null
        && pushover.deviceId !== null )
    }
  }
)

export const pushoverStatusSelector = createSelector(
  pushoverSelector,
  isLoggedInSelector,
  isDeviceRegisteredSelector,
  (pushover, isLoggedIn, isDeviceRegistered) => {
    return {
      isLoggedIn: isLoggedIn.isLoggedIn,
      isDeviceRegistered: isDeviceRegistered.isDeviceRegistered,
      userEmail: pushover.userEmail,
      deviceName: pushover.deviceName,
      connectionStatus: pushover.connectionStatus,
      latestSyncDate: pushover.latestSyncDate
    }
  }
)

