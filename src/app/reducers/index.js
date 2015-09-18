import { combineReducers } from 'redux'
import { routerStateReducer } from 'redux-react-router'

const reducer = combineReducers({
	router: routerStateReducer
})

export default reducer
