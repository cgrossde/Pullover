import { hashHistory } from 'react-router'
import { createStore, applyMiddleware } from 'redux'
import { syncHistory, routeReducer } from 'react-router-redux'

import reducer from '../reducers/Index'

// Sync route actions to the history
const reduxRouterMiddleware = syncHistory(hashHistory)
const createStoreWithMiddleware = applyMiddleware(reduxRouterMiddleware)(createStore)


const store = createStoreWithMiddleware(reducer)

export default store
