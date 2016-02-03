
import Autorun from 'autorun'
import { EventEmitter } from 'events'
import Debug from '../lib/debug'


var autorun = new Autorun('Pullover')
var debug = Debug('Settings')


class Settings extends EventEmitter {

  constructor() {
    // Init eventemitter
    super()
    // Setup defaults / retrieve settings from localStorage
    this.settings = {}
    this.settings.displayTime = this.cast(localStorage.getItem('displayTime')) || 7,
    this.settings.nativeNotifications = this.cast(localStorage.getItem('nativeNotifications')) || false,
    this.settings.maxNotificationAmount = this.cast(localStorage.getItem('maxNotificationAmount')),
    this.settings.runOnStartup = this.cast(localStorage.getItem('runOnStartup')) || false
    // Enable runOnStartup if it's the firstRun
    // Otherwise get runOnStartup status from autorun module
    if (window.firstRun)
      this.enableRunOnStartup()
    else
      this.updateRunOnStartupStatus()
  }

  get(key) {
    if (this.settings[key] !== undefined) {
      // Parse if true/false/number then return
      return this.cast(this.settings[key])
    }
    else {
      debug.log('Setting "' + key + '" not found!')
      return undefined
    }
  }

  getAll() {
    return this.settings
  }

  set(key, value) {
    debug.log('Set ' + key + ' to: ' + value)
    // Allow for execution of hooks when changing certain settings
    switch (key) {
      case 'runOnStartup':
        if (value)
          this.enableRunOnStartup()
        else
          this.disableRunOnStartup()

      default:
        // Update value and emit change event
        this.setDirectly(key, value)
    }
  }

  /**
   * Set without triggering hooks attached to
   * certain settings
   */
  setDirectly(key, value) {
    this.settings[key] = value
    localStorage.setItem(key, value)
    this.emit('change', {
      key: key,
      value: value
    })
    debug.log('Changed "' + key + '"',value)
  }

  cast(value) {
    if (value === 'true') {
      return true
    }
    else if (value === 'false') {
      return false
    }
    else if (! isNaN(parseInt(value))) {
      return parseInt(value)
    }

    return value
  }

  enableRunOnStartup() {
    if (autorun.isPlatformSupported()) {
      autorun.enable()
      .then(() => {
        debug.log('Enabled autorun')
      })
      .catch((err) => {
        debug.log('Failed to enabled autorun.', err)
        this.updateRunOnStartupStatus()
      })
    }
  }

  disableRunOnStartup() {
    if (autorun.isPlatformSupported()) {
      autorun.disable()
      .then(() => {
        debug.log('Disabled autorun')
      })
      .catch(() => {
        debug.log('Failed to disable autorun', err)
        this.updateRunOnStartupStatus()
      })
    }
  }

  updateRunOnStartupStatus() {
    if (autorun.isPlatformSupported()) {
      autorun.isSet().then((enabled) => {
        this.setDirectly('runOnStartup', enabled)
      })
    }
  }

  runOnStartupSupported() {
    return autorun.isPlatformSupported()
  }
}

export default new Settings()
