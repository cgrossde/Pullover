import React from 'react/addons'
import { Router, Route } from 'react-router'
//import history from './History'
import history from './History'

// Import App and main components
import App from '../components/App'
import About from '../components/About'
import Status from '../components/Status'

// Routing config
var router = (
  <Router history={history}>
    <Route path='/' component={App}>
      <Route path='about' component={About}/>
      <Route path='status' component={Status}/>
    </Route>
  </Router>
)

export default router
