/**
 * Central place to manage all paths used to store files
 *
 * BASE PATH:
 *  * OS X - '$HOME/Library/Application Support/Pullover'
 *  * Windows 8 - 'C:\Users\User\AppData\Roaming\Pullover'
 *  * Windows XP - 'C:\Documents and Settings\User\Application Data\Pullover'
 *  * Linux - '$XDG_DATA_HOME/Pullover or $HOME/.local/share/Pullover'
 *
 * Logging: BASEPATH /logs
 * Sound cache: BASEPATH /sounds
 */

import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'

class Paths {
	constructor() {
    // Base path
    this.appPath = process.env.APPDATA ||
      (process.platform === 'darwin' ? process.env.HOME + '/Library/Application\ Support' : process.env.XDG_DATA_HOME || process.env.HOME + './local/share')
    this.appPath = path.join(this.appPath, 'Pullover')
    if (! fs.existsSync(this.appPath)) {
      mkdirp.sync(this.appPath)
      console.log('Created data directory', this.appPath)
    }
    console.log('DATA PATH: ', this.appPath)

    // Log path
    this.logPath = path.join(this.appPath, 'logs')
    if (! fs.existsSync(this.logPath)) {
      mkdirp.sync(this.logPath)
      console.log('Created log directory', this.logPath)
    }

    // Sound cache path
    this.soundPath = path.join(this.appPath, 'sounds')
    if (! fs.existsSync(this.soundPath)) {
      mkdirp.sync(this.soundPath)
      console.log('Created sounds directory', this.soundPath)
    }
	}

  getLogPath() {
    return this.logPath
  }

  getSoundCachePath() {
    return this.soundPath
  }
}

export default new Paths()
