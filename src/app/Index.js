'use strict'

// Setup logging for fatal exits
import './services/Logging'

// Get window and setup tray
import Window from './nw/Window'
import './nw/Tray'

// Include package.json for NW.js, add global styles
import 'file?name=package.json!../package.json'
import './styles/styles.scss'

// React, Redux, ReduxRouter and routes
import React from 'react/addons'
import { Provider } from 'react-redux'
import { ReduxRouter } from 'redux-router'
import routes from './services/Routes'
import store from './services/Store'

window.store = store

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
const Root = React.createClass({
  displayName: 'Root',
  render() {
    return (
      <div>
        <Provider store={store}>
          {() =>
            <ReduxRouter>
              { routes }
            </ReduxRouter>
          }
        </Provider>
      </div>
    )
  }
})
React.render(<Root />, document.body)

// Show App once it was rendered
Window.show()
