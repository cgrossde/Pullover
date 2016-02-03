import React from 'react'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'

// Import App and main components
import App from '../components/App'
import About from '../components/About'
import Status from '../components/Status'
import Settings from '../components/Settings'

// Routing config
const Routes = (
  <Router history={hashHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={Status} />
      <Route path='about' component={About}/>
      <Route path='status' component={Status}/>
      <Route path='settings' component={Settings}/>
    </Route>
  </Router>
)

export default Routes
