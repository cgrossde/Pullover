import React from 'react'
import { Router, Route, IndexRoute } from 'react-router'

// Import App and main components
import App from '../components/App'
import About from '../components/About'
import Status from '../components/Status'

// Routing config
const Routes = (
  <Router>
    <Route path='/' component={App}>
      <IndexRoute component={Status} />
      <Route path='about' component={About}/>
      <Route path='status' component={Status}/>
    </Route>
  </Router>
)

export default Routes
