import fs from 'fs'
import path from 'path'
import https from 'https'

import Paths from '../services/Paths'
import Debug from '../lib/debug'
const debug = Debug('SoundCache')

class SoundCache {
  constructor(soundCachePath) {
    this.path = Paths.getSoundCachePath()
    this.soundUrl = 'https://api.pushover.net/sounds/'
    // Make sure default sound is downloaded
    this.get('po')
  }

  get(soundName) {
    const soundFilePath = this.getPath(soundName)
    try {
      if (fs.statSync(soundFilePath).isFile()) {
        return 'file://' + soundFilePath
      }
    }
    catch (e) {
      // File not downloaded yet => return remote link
      // and download in background
      this.download(soundName)
      return this.getUrl(soundName)
    }
  }

  download(soundName) {
    const soundFileUrl = this.getUrl(soundName)
    const soundFilePath = this.getPath(soundName)
    const soundFile = fs.createWriteStream(soundFilePath)
    const request = https.get(soundFileUrl, (response) => {
      response.pipe(soundFile)
      soundFile.on('finish', () => {
        debug.log('Download of sound "' + soundName + '" successfull => ' + soundFilePath)
        soundFile.close()
      })
      .on('error', (err) => {
        fs.unlink(soundFile)
        debug.log('Failed to download: ' + soundFileUrl, err, err.stack)
      })
    })
  }

  getPath(soundName) {
    return path.join(this.path, soundName + '.wav')
  }

  getUrl(soundName) {
    return this.soundUrl + soundName + '.wav'
  }

  /**
   * See https://pushover.net/api#sounds
   *
   * However the key is different for the client => manually send notifications
   * with different sounds to compile list
   */
  getSoundList() {
    return [
      ["po", "Pushover (default)"],
      ["bk", "Bike"],
      ["bu", "Bugle"],
      ["ch", "Cash Register"],
      ["cl", "Classical"],
      ["co", "Cosmic"],
      ["fa", "Falling"],
      ["gl", "Gamelan"],
      ["ic", "Incoming"],
      ["im", "Intermission"],
      ["ma", "Magic"],
      ["mc", "Mechanical"],
      ["pn", "Piano Bar"],
      ["si", "Siren"],
      ["sp", "Space Alarm"],
      ["tg", "Tug Boat"],
      ["ln", "Alien Alarm (long)"],
      ["mb", "Climb (long)"],
      ["ps", "Persistent (long)"],
      ["ec", "Pushover Echo (long)"],
      ["ud", "Up Down (long)"],
      ["no", "None (silent)"],
    ]
  }
}

export default new SoundCache()
