import Gui from 'nw.gui'

// Get main window
const win = nw.Window.get()

export default win

// Export function to show, hide and quit the app
export function hideWindow() {
	win.hide()
	win.setShowInTaskbar(false)
}

export function showWindow() {
	win.show()
	win.setShowInTaskbar(true)
}

// Really quit app (only callable from tray)
export function quitApp() {
	win.close(true)
}

export function openExternalLink(link) {
  Gui.Shell.openExternal(link)
}

export function externalLinkHandler(event) {
  event.preventDefault()
  openExternalLink(event.target.href)
}

export function showItemInFolder(path) {
  Gui.Shell.showItemInFolder(path)
}

// Get the minimize event
win.on('minimize', hideWindow)

// Handle CMD+W vs CMD+Q
win.on('close', hideWindow)

// Mac allow CMD+C, CMD+V, CMD+W, ...
var nativeMenuBar = new Gui.Menu({ type: 'menubar' })
try {
  nativeMenuBar.createMacBuiltin('Pullover')
  win.menu = nativeMenuBar
}
catch (ex) {
  // Will fail on windows
}

// No taskbar item
win.setShowInTaskbar(false)
win.setResizable(false)
