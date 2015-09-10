'use strict'

// Setup logging for fatal exits
import './Logging'

// Get window and setup tray
import Window from './Window'
import './Tray'

// Include package.json for NW.js, add global styles
import 'file?name=package.json!../package.json'
import './styles/styles.scss'

// Vendor: React & Router
import React from 'react/addons'
import { Router, Route } from 'react-router'
// Import App and main components
import App from './components/App'
import About from './components/About'
import Status from './components/Status'

// Debugging?
if (process.env.DEBUG === '1') {
  // Move App
  Window.moveTo(920, 23)
  // Show dev tools and arrange it next to app
  var devWindow = Window.showDevTools()
  devWindow.moveTo(0,23)
  devWindow.resizeTo(900, 700)
}

// Routing config and render App
React.render((
  <Router>
    <Route path='/' component={App}>
      <Route path='about' component={About}/>
      <Route path='status' component={Status}/>
    </Route>
  </Router>
), document.body)

// Show App once it was rendered
Window.show()
