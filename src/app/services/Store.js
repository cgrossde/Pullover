import { hashHistory } from 'react-router'
import { createStore, applyMiddleware } from 'redux'
import { routerMiddleware } from 'react-router-redux'

import reducer from '../reducers/Index'

// Sync route actions to the history
const reduxRouterMiddleware = routerMiddleware(hashHistory)
const createStoreWithMiddleware = applyMiddleware(reduxRouterMiddleware)(createStore)


const store = createStoreWithMiddleware(reducer)

export default store
