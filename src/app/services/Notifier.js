/**
 * Handle logic to show notifications to user
 *
 * id: 2,
    message: 'This message confirms that you are now able to receive messages on this device',
    app: 'Pushover',
    aid: 1,
    icon: 'pushover',
    date: 1448839221,
    priority: 0,
    acked: 0,
    umid: 6298,
    sound: 'po',
    title: 'Welcome to Pushover!'
 */

import path from 'path'
import nwNotify from 'nw-notify'
import striptags from 'striptags'

import { openExternalLink } from '../nw/Window'
import Settings from '../services/Settings'
import SoundCache from './SoundCache'
import Debug from '../lib/debug'
var debug = Debug('Notifier')

nwNotify.setConfig({
  appIcon: path.join(path.resolve(path.dirname()), 'images', 'icon.png'),
  displayTime: Settings.get('displayTime') * 1000
})

// Autoupdate displayTime
Settings.on('change', (event) => {
  if (event.key === 'displayTime') {
    nwNotify.setConfig({
      displayTime: event.value * 1000
    })
  }
})

// Notification function
// Usage: notify('NFL-Release', 'Pats vs Broncos 720p usw', 'http://google.com', 'images/nfl3.png');
export function notify(notification) {
  // Set icon path
  notification.icon = (notification.icon) ? 'https://api.pushover.net/icons/' + notification.icon + '.png' : undefined
  // Sounds
  if (notification.sound)
    notification.sound = SoundCache.get(notification.sound)

  if (Settings.get('nativeNotifications') === true) {
    nativeNotify(notification.title, notification.message, notification.url, notification.icon, notification.sound)
  }
  else {
    nwNotify.notify({
      title: notification.title,
      text: notification.message,
      url: notification.url,
      image: notification.icon,
      sound: notification.sound
    })
  }
}

/**
 * Use node webkits native notification function
 */
function nativeNotify(title, text, url, iconPath, sound, retryOnError) {
  retryOnError = (retryOnError !== undefined) ? retryOnError : true
  title = title || ''
  text = text || ''
  // Native notifications don't support HTML
  text = striptags(text)
  var options = {}
  options.body = text
  if (iconPath) options.icon = iconPath

  var notice = new Notification(title, options)
  notice.onerror = function(error) {
    debug.log('ERROR displaying notification (retry=' + retryOnError + ')', error)
    if (retryOnError) {
      // Try one more time in 1 sec
      setTimeout(function() {
        debug.log('Notification retry')
        nativeNotify(title, text, url, iconPath, sound, false)
      }, 1000)
    }
  }

  if (url !== undefined) {
    notice.onclick = function() {
      openExternalLink(url)
    }
  }

  if (sound) {
    // Native notifications are shown at once (at least on OS X 10.11.3)
    // Therefore play the sound immediately
    // notice.onshow = function() {
    const audio = new window.Audio(sound)
    audio.play()
    // }
  }
}
