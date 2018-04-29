/**
 * Returns an object with namespaced functions for debugging and logging
 */
import fs from 'fs'
import util from 'util'
import path from 'path'

import Paths from '../services/Paths'

var logPath = Paths.getLogPath()
console.log('LOG PATH: ', logPath)

// Logfile name (add debug if in Debug-Mode)
var logfileName = (process.env.DEBUG === '1') ? 'pullover.debug' : 'pullover'

// Keep the last 5 logfiles, shift logfile names
for (let i = 4; i >= 1; i--) {
  if (fs.existsSync(path.join(logPath, logfileName + '.' + i + '.log'))) {
    // Rename file with increased index, e.g.: pullover.2.log becomes pullover.3.log
    fs.renameSync(path.join(logPath, logfileName + '.' + i + '.log'),
      path.join(logPath, logfileName + '.' + (i + 1) + '.log'))
  }
}
var logFilePath = path.join(logPath, logfileName + '.1.log')
// Open log file for writing
var logFileHandle = fs.openSync(logFilePath, 'w')

function getLogFilePath() {
  return logFilePath
}

function getLogPath() {
  return logPath
}

function logToFile(string) {
  string += '\r\n'
  fs.writeSync(logFileHandle, string)
}

function getLogFn(namespace) {
  return function () {
    var date = util.inspect(new Date())
    var string = '  ' + namespace
    var message = ''
    for (let i = 0; i < arguments.length; i++) {
      message += '   ' + util.inspect(arguments[i])
    }
    message = message.replace(/\\n/g, '\n').replace(/\\/g, '')
    // Rightpad namespace to have all messages start in the same column
    var padTo = 20
    while (string.length < padTo)
      string += ' '
    // Now add message
    string += message
    logToFile(date + string)
    console.log.call(console, string)
  }
}

/**
 * Creates a function that can take a function fn and return a function that
 * will call fn wrapped by try/catch and log errors with the logFn
 */
function catchErrorWrapper(logFn) {
  return function (fn) {
    return function () {
      try {
        fn.apply(this, arguments)
      } catch (error) {
        logFn(error)
      }
    }
  }
}


export default function (namespace) {
  var logFn = getLogFn(namespace)
  return {
    log: logFn,
    catchErrorWrapper: catchErrorWrapper(logFn),
    getLogFilePath: getLogFilePath,
    getLogPath: getLogPath
  }
}
