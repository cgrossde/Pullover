import Eyes from 'eyes'
import Debug from '../lib/debug'
import { showWindow } from '../nw/Window'
import packageInfo from '../../package.json'
import { transitionTo } from './Navigator'
import Analytics from './Analytics'

var debug = Debug('Fatal')
var inspect = Eyes.inspector({stream: null})

// Provoke error to test this
//setTimeout(function () {
//  test.nonexiting()
//}, 5000)

// Catch all uncaught errors to log them to a file
// and report an issue
process.on('uncaughtException', function (error) {
  // console.log may not work anymore, make sure error is at least logged to stdout
  process.stdout.write('Uncaught error: ')
  process.stdout.write(error.message + '\n')
  process.stdout.write(error.stack + '\n')
  // Ignore non fatal error visionmedia/superagent#714
  // TODO: Remove once fixed
  if (isErrorOfType(error, 'ENOTFOUND', 'getaddrinfo') || isErrorOfType(error, 'ECONNRESET', 'read')) {
    debug.log('Surpressed uncaught exception related to visionmedia/superagent#714', error)
    Analytics.exception('Supressed non critical ' + error.code + ' in ' + error.syscall)
    return
  }
  // Ignore occasional socket errors, Pullover can survive those
  if (isErrorOfType(error, 'ECONNRESET') || isErrorOfType(error, 'ENETDOWN') ||
    isErrorOfType(error, 'ETIMEDOUT', 'connect')) {
    debug.log('Surpress non critical network error (see https://github.com/cgrossde/Pullover/issues/63)', error)
    Analytics.exception('Supressed non critical ' + error.code)
    return
  }
  debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ')
  debug.log('Pullover v' + packageInfo.version)
  debug.log('=============== STACK ===============')
  debug.log(error.stack)
  debug.log('=============== Error Object ===============')
  debug.log(inspect(error).replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '').replace('\\\\n', '\n'))
  debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ')
  // Track crashes with analytics
  Analytics.exception(error.message)
  // Show modal to report error and restart pullover
  showWindow()
  transitionTo('/error')
})

function isErrorOfType(error, code, syscall) {
  if (!error.code || error.code !== code) {
    return false
  }
  if (syscall && (!error.syscall || error.syscall !== syscall)) {
    return false
  }
  return true
}
