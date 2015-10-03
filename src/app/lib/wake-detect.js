import { EventEmitter } from 'events'
/**
 * Starts/stops a loop that monitors the time. Should the loop
 * detect a time shift then the device just woke up from sleep.
 * In that case it will fire a 'wake' event with the amount of
 * seconds slept as a payload.
 *
 * Based on http://blog.alexmaccaw.com/javascript-wake-event
 */

class WakeDetect extends EventEmitter {
  constructor() {
    super()
    this.timeout = 10000  // 10s
    this.lastTime = null
    this.interval = null
  }

  start() {
    this.lastTime = (new Date()).getTime()
    this.interval = setInterval(() => {
      const currentTime = (new Date()).getTime()
      if (currentTime > (this.lastTime + this.timeout + 2000)) {
        const sleepDuration = currentTime - (this.lastTime + this.timeout + 2000)
        this.emit('wake', Math.floor(sleepDuration/1000))
      }
      this.lastTime = currentTime
    }, this.timeout)
  }

  stop() {
    clearInterval(this.interval)
  }
}

export default new WakeDetect()
