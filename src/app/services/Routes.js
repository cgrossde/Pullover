import React from 'react'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'

// Import App and main components
import App from '../components/App'
import About from '../components/About'
import Status from '../components/Status'
import Settings from '../components/Settings'
import ShowUpdate from '../components/ShowUpdate'
import FatalError from '../components/FatalError'
import NotificationList from '../components/notificationList/NotificationList'

// Routing config
const Routes = (
  <Router history={hashHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={Status} />
      <Route path='about' component={About}/>
      <Route path='status' component={Status}/>
      <Route path='settings' component={Settings}/>
      <Route path='error' component={FatalError}/>
      <Route path='updateAvailable' component={ShowUpdate}/>
      <Route path='notifications' component={NotificationList}/>
    </Route>
  </Router>
)

export default Routes
