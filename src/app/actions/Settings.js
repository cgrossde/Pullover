export const SET_DISPLAY_TIME = 'SET_DISPLAY_TIME'
export const ENABLE_NATIVE_NOTIFICATIONS = 'ENABLE_NATIVE_NOTIFICATIONS'
export const DISABLE_NATIVE_NOTIFICATIONS = 'DISABLE_NATIVE_NOTIFICATIONS'
export const SET_MAX_NOTIFICATION_AMOUNT = 'SET_MAX_NOTIFICATION_AMOUNT'

export function setDisplayTime(displayTime) {
	return { type: SET_DISPLAY_TIME, displayTime }
}

export function enableNativeNotifications() {
	return { type: ENABLE_NATIVE_NOTIFICATIONS }
}

export function disableNativeNotifications() {
	return { type: DISABLE_NATIVE_NOTIFICATIONS }
}

export function setMaxNotificationAmount(maxNotificationAmount) {
	return { type: SET_MAX_NOTIFICATION_AMOUNT, maxNotificationAmount }
}
