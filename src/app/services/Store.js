import { createStore, compose } from 'redux'
import { reduxReactRouter } from 'redux-react-router'
import createHashHistory from 'react-router/node_modules/history/lib/createHashHistory'

import reducer from '../reducers/index'

const store = compose(
  reduxReactRouter({ createHistory: createHashHistory })
)(createStore)(reducer)

export default store
