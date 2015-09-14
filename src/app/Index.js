'use strict'

// Setup logging for fatal exits
import './services/Logging'

// Get window and setup tray
import Window from './nw/Window'
import './nw/Tray'

// Include package.json for NW.js, add global styles
import 'file?name=package.json!../package.json'
import './styles/styles.scss'

// React and Router(as well as App)
import React from 'react/addons'
import router from './services/Router'


// Debugging?
if (process.env.DEBUG === '1') {
  // Move App
  Window.moveTo(920, 23)
  // Show dev tools and arrange it next to app
  var devWindow = Window.showDevTools()
  devWindow.moveTo(0,23)
  devWindow.resizeTo(900, 700)
  devWindow.show()
}

// Render App
React.render(router, document.body)

// Show App once it was rendered
Window.show()
