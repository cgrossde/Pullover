'use strict'
// Setup logging for fatal exits
import './services/Logging'
// Get window and setup tray
import Window, { quitApp, showWindow } from './nw/Window'
import './nw/Tray'
// Include package.json for NW.js, also add global styles
import '!!file-loader?name=package.json!../package.json'
import './styles/styles.scss'
// React, Redux, ReduxRouter and routes
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import routes from './services/Routes'
import store from './services/Store'
// Update check
import { check } from './services/UpdateCheck'

// Make it accessible for debugging
window.store = store

// Debugging?
if (process.env.DEBUG === '1') {
  // Move App
  Window.moveTo(920, 23)
  // Show dev tools and arrange it next to app
  Window.showDevTools()
}

// Close SIGINT e.g. CTRL+C
process.on('SIGINT', function () {
  console.log('Caught interrupt signal - Closing Pullover')
  quitApp()
  setTimeout(process.exit, 500)
})

// Render App
class Root extends React.Component {
  render() {
    return (
      <div>
        <Provider store={store}>
          { routes }
        </Provider>
      </div>
    )
  }
}
ReactDOM.render(<Root />, document.body)

// Show App once it was rendered (only if it's the first start or debug mode)
if (window.firstRun || process.env.DEBUG === '1')
  showWindow()

check()
