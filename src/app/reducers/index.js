import { combineReducers } from 'redux'
import { routerStateReducer } from 'redux-router'

import { pushoverStateReducer } from './PushoverStateReducer'
import { settingsStateReducer } from './SettingsStateReducer'

console.log('Init store')
const reducer = combineReducers({
	router: routerStateReducer,
  pushover: pushoverStateReducer,
  settings: settingsStateReducer
})

export default reducer
