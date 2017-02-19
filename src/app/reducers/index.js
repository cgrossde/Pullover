import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import { pushoverStateReducer } from './PushoverStateReducer'

const reducer = combineReducers({
	routing: routerReducer,
  pushover: pushoverStateReducer,
})

export default reducer
