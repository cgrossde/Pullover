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

import { openExternalLink } from '../nw/Window'
import striptags from '../lib/striptags'
import SoundCache from './SoundCache'
import Debug from '../lib/debug'

var debug = Debug('Notifier')

// Notification function
// Usage: notify('NFL-Release', 'Pats vs Broncos 720p usw', 'http://google.com', 'images/nfl3.png');
export function notify(notification) {
  // Set icon path
  notification.icon = (notification.icon) ? 'https://api.pushover.net/icons/' + notification.icon + '.png' : undefined
  // Sounds
  if (notification.sound)
    notification.sound = SoundCache.get(notification.sound)

  // Show app name if no title was supplied
  notification.title = notification.title || notification.app

  // Add different notification mechanisms here => currently only the
  // nw.js native notifications are support => chrome notifications
  nativeNotify(notification.title, notification.message, notification.url, notification.icon, notification.sound)
}

/**
 * Use node webkits native notification function
 */
function nativeNotify(title, text, url, iconPath, sound, retryOnError) {
  retryOnError = (retryOnError !== undefined) ? retryOnError : true
  text = text || ''
  // Native notifications don't support HTML
  text = striptags(text)
  var options = {}
  options.body = text
  if (iconPath) options.icon = iconPath

  var notice = new Notification(title, options)
  if (sound) {
    notice.onshow = () => {
      const audio = new window.Audio(sound)
      audio.play()
    }
  }
  notice.onerror = error => {
    debug.log('ERROR displaying notification (retry=' + retryOnError + ')', error)
    if (retryOnError) {
      // Try one more time in 1 sec
      setTimeout(() => {
        debug.log('Notification retry')
        nativeNotify(title, text, url, iconPath, sound, false)
      }, 1000)
    }
  }

  if (url !== undefined) {
    notice.onclick = () => {
      openExternalLink(url)
    }
  }
}

// If started in DEBUG mode a button will show up on the Status page
// Good for debugging / testing notifications (will not go through notification manager)
export function randomNotification() {
  const soundList = SoundCache.getSoundList()
  const sound = soundList[randomIndex(soundList.length - 1)][0]
  const randomNotification = {
    title: randomSentence(2),
    message: randomSentence(10) + '.',
    icon: 'pushover',
    sound
  }
  notify(randomNotification)
}

function randomSentence(numberOfWords) {
  if (numberOfWords === 0)
    return ''
  return randomWord() + ' ' + randomSentence(numberOfWords - 1)
}

const randomWords = ['engine', 'culture', 'thinker', 'reach', 'thank', 'cower', 'manufacturer', 'concert', 'ban', 'wine', 'braid', 'transaction', 'plain', 'fish', 'electronics']

function randomWord() {
  const maxIndex = randomWords.length - 1
  return randomWords[randomIndex(maxIndex)]
}

function randomIndex(maxIndex) {
  return Math.floor(Math.random() * (maxIndex + 1))
}

