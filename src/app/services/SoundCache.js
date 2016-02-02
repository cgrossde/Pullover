import fs from 'fs'
import path from 'path'
import https from 'https'
import mkdirp from 'mkdirp'

import Debug from '../lib/debug'
const debug = Debug('SoundCache')

// Cache sound files
// * OS X - '/Users/user/Library/Application Support/pullover/sounds'
// * Windows 8 - 'C:\Users\User\AppData\Roaming\Pullover\sounds'
// * Windows XP - 'C:\Documents and Settings\User\Application Data\Pullover\sounds'
// * Linux - '$XDG_DATA_HOME/Pullover or $HOME/.local/share/Pullover/sounds'
var appDataPath = process.env.APPDATA ||
  (process.platform === 'darwin' ? process.env.HOME + '/Library/Application\ Support' : process.env.XDG_DATA_HOME || process.env.HOME + './local/share')
var soundCachePath = path.join(appDataPath, 'Pullover', 'sounds')
console.log('SOUND CACHE: ' + soundCachePath)
if (! fs.existsSync(soundCachePath)) {
  mkdirp.sync(soundCachePath)
}

class SoundCache {
  constructor(soundCachePath) {
    this.path = soundCachePath
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
}

export default new SoundCache(soundCachePath)
