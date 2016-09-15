
import os from 'os'
import Autorun from 'autorun'
import { EventEmitter } from 'events'
import Debug from '../lib/debug'
import packageInfo from '../../package.json'
import store from './Store'
import {
  setUserData,
  setDeviceData
} from '../actions/Pushover'

var autorun = new Autorun('Pullover')
var debug = Debug('Settings')

window.firstRun = false
window.updateRun = false

class Settings extends EventEmitter {

  constructor() {
    // Init eventemitter
    super()
    // Setup defaults / retrieve settings from localStorage
    this.settings = {}
    this.settings.windowWidth = 450
    this.settings.windowHeight = 330
    this.settings.displayTime = this.cast(localStorage.getItem('displayTime')) || 7
    this.settings.nativeNotifications = this.cast(localStorage.getItem('nativeNotifications')) || false
    this.settings.maxNotificationAmount = this.cast(localStorage.getItem('maxNotificationAmount')) || 20
    this.settings.runOnStartup = this.cast(localStorage.getItem('runOnStartup')) || false
    this.settings.defaultSound = localStorage.getItem('defaultSound') || 'po'
    debug.log('Settings loaded', this.settings)
    // First or update run?
    if (localStorage.getItem('version') === null) {
      window.firstRun = true
      this.firstRun()
    }
    // Update run?
    else if (localStorage.getItem('version') !== packageInfo.version) {
      window.updateRun = true
      this.updateRun(localStorage.getItem('version'))
    }
    // Nothing special => just update autorun status
    else {
      this.updateRunOnStartupStatus()
    }
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
    debug.log('Changed \'' + key + '\'',value)
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

  /**
   * Upgrade handling
   */
  firstRun() {
    debug.log('First run')
    // Check if version 0.x.x was installed?
    if(localStorage.secret || localStorage.id) {
      this.updateFrom_0_x_x()
    } else {
      this.set('runOnStartup', true)
      // Use mac notification center by default
      if (os.platform() === 'darwin') {
        this.settings.nativeNotifications = true
      }
    }
    localStorage.setItem('version', packageInfo.version)
  }

  updateRun(fromVersion) {
    debug.log('UPDATE RUN from ' + localStorage.getItem('version') + ' to ' + packageInfo.version)
    // For the future
    debug.log('No migrations necessary')
    localStorage.setItem('version', packageInfo.version)
    this.updateRunOnStartupStatus()
  }

  updateFrom_0_x_x() {
    debug.log('Upgrade from 0.x.x')
    // Native notifications?
    if(localStorage.newNotifier)
      this.set('nativeNotifications', false)
    else
      this.set('nativeNotifications', true)
    // Reset login data
    if(localStorage.secret || localStorage.id) {
      // Let them login again (we store the email now to let
      // the user check which account is logged in)
      store.dispatch(setUserData({
        userKey: null,
        userEmail: null,
        userSecret: null
      }))
      store.dispatch(setDeviceData({
        deviceName: null,
        deviceId: null
      }))
    }
    this.updateRunOnStartupStatus()
  }
}

export default new Settings()
