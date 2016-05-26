import Gui from 'nw.gui'
import os from 'os'
import { showWindow, quitApp } from './Window'

import { transitionTo } from '../services/Navigator'

// Create permanent tray icon
// Tray icon
// tiffutil -cathidpicheck tray_mac.png tray_mac@2x.png -out tray_mac.tiff
var icon = (os.platform() === 'darwin') ? 'images/tray_mac.tiff' : 'images/tray.png'
var tray = new Gui.Tray({
  icon: icon
})

// Create tray menu items:
// Separator
var itemSeparator = new Gui.MenuItem({ type: 'separator' })
// Show status
var itemStatus = new Gui.MenuItem({ type: 'normal', label: 'Status' })
itemStatus.on('click', function() {
  showWindow()
  transitionTo('/status')
})
// Quit app
var itemQuit = new Gui.MenuItem({ type: 'normal', label: 'Quit Pullover' })
itemQuit.on('click', quitApp)

// Build tray click menu
var menu = new Gui.Menu()
menu.append(itemStatus)
menu.append(itemSeparator)
menu.append(itemQuit)
tray.menu = menu
