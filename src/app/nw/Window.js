import Gui from 'nw.gui'

// Get main window
var win = Gui.Window.get()

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

export function openExternalLink(event) {
  event.preventDefault()
  Gui.Shell.openExternal(event.target.href)
}

// Get the minimize event
win.on('minimize', hideWindow)

// Handle CMD+W vs CMD+Q
win.on('close', hideWindow)

// No taskbar item
win.setShowInTaskbar(false)
win.setResizable(false)
