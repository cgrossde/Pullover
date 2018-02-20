import os from 'os'
import ua from 'universal-analytics'
import uuidv4 from 'uuid/v4'

import Settings from './Settings'
import packageInfo from '../../package.json'

// Init
let visitor
try {
  visitor = ua('UA-114351855-1', getClientId())
  visitor.set('anonymizeIp', 1)
  visitor.set('clientId', getClientId())
  visitor.set('dataSource', 'app')
  visitor.set('applicationName', 'Pullover')
  visitor.set('applicationVersion', packageInfo.version)
  visitor.set('applicationInstallerId', getPlatform())
  visitor.set('userAgentOverride', window.navigator.userAgent)

  if (window.firstRun) {
    visitor.event('App', 'Install')

  }
  if (window.updateRun) {
    visitor.event('App', 'Updated', packageInfo.version)
  }
} catch (e) {
}

function event(category, action, label) {
  console.log('event', isEnabled(), category, action, label)
  try {
    if (isEnabled()) {
      if (label) {
        visitor.event(category, action, label, onError)
      } else {
        visitor.event(category, action, onError)
      }
    }
  } catch (e) {
  }
}

function exception(error, fatal) {
  console.log('exception', isEnabled(), error, fatal)
  try {
    if (isEnabled()) {
      visitor.exception(error, fatal, onError)
    }
  } catch (e) {
  }
}

function page(pageName) {
  console.log('page', isEnabled(), pageName)
  try {
    if (isEnabled()) {
      visitor.screenview(pageName, 'Pullover', onError)
    }
  } catch (e) {
  }
}

function onError(err) {
  console.log('Analytics error', err)
}

function isEnabled() {
  return Settings.get('collectAnonymousData')
}

function getPlatform() {
  if (os.platform() === 'darwin') {
    return 'OSX'
  }
  else if (os.platform().indexOf('win') === 0) {
    return 'WIN'
  }
  return 'LINUX'
}

function getClientId() {

  let clientId = localStorage.getItem('clientId')
  if (!clientId) {
    clientId = uuidv4()
    localStorage.setItem('clientId', clientId)
  }
  return clientId
}

export default {
  page,
  event,
  exception
}
