import React from 'react/addons'
import { Router, Route } from 'react-router'

// Import App and main components
import App from '../components/App'
import About from '../components/About'
import Status from '../components/Status'

// Routing config
const Routes = (
  <Router>
    <Route path='/' component={App}>
      <Route path='about' component={About}/>
      <Route path='status' component={Status}/>
    </Route>
  </Router>
)

export default Routes
