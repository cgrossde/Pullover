import { combineReducers } from 'redux'
import { hashHistory } from 'react-router'
import { routeReducer } from 'react-router-redux'

import { pushoverStateReducer } from './PushoverStateReducer'

const reducer = combineReducers({
	rounting: routeReducer,
  pushover: pushoverStateReducer,
})

export default reducer
