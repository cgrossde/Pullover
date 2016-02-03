import { combineReducers } from 'redux'
import { routerStateReducer } from 'redux-router'

import { pushoverStateReducer } from './PushoverStateReducer'

const reducer = combineReducers({
	router: routerStateReducer,
  pushover: pushoverStateReducer,
})

export default reducer
