'use strict'

var debug = true

import Gui from 'nw.gui'

if (debug) {
  // Move App
  Gui.Window.get().moveTo(920, 23)
  // Show dev tools and arrange it
  var devWindow = Gui.Window.get().showDevTools()
  devWindow.moveTo(0,23)
  devWindow.resizeTo(900, 700)
}

// Include package.json for NW.js
import 'file?name=package.json!../package.json'
import './styles/styles.scss'

import React from 'react/addons'
import App from './components/App'

React.render(<App />, document.body)
// Show App once it was rendered
Gui.Window.get().show()
