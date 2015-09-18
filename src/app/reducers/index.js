import { combineReducers } from 'redux'
import { routerStateReducer } from 'redux-react-router'

import { pushoverStateReducer } from './PushoverStateReducer'

console.log(pushoverStateReducer)

const reducer = combineReducers({
	router: routerStateReducer,
  pushover: pushoverStateReducer
})

export default reducer
