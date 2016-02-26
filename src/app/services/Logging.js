import Eyes from 'eyes'
import Debug from '../lib/debug'
import { showWindow } from '../nw/Window'
import packageInfo from '../../package.json'
import { transitionTo } from './Navigator'

var debug = Debug('Fatal')
var inspect = Eyes.inspector({stream: null})

// Provoke error to test this
//setTimeout(function () {
//  test.nonexiting()
//}, 5000)

// Catch all uncaught errors to log them to a file
// and report an issue
process.on('uncaughtException', function (error) {
  debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ')
  debug.log('Pullover v' + packageInfo.version)
  debug.log('=============== STACK ===============')
  debug.log(error.stack)
  debug.log('=============== Error Object ===============')
  debug.log(inspect(error).replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '').replace('\\\\n', '\n'))
  debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ')
  // Show modal to report error and restart pullover
  showWindow()
  transitionTo('/error')
})
