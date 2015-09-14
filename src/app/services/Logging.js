import Eyes from 'eyes'
import Debug from '../lib/debug'
import { showWindow } from '../nw/Window'

var debug = Debug('Fatal')
var inspect = Eyes.inspector({ stream: null })

// Catch all uncaught errors to log them to a file
// and report an issue
process.on('uncaughtException', function(error) {
	debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ')
	debug.log('=============== STACK ===============')
	debug.log(error.stack)
	debug.log('=============== Error Object ===============')
	debug.log(inspect(error).replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '').replace('\\\\n', '\n'))
	console.log('###',inspect(error).replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, ''))
	debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ')
	// Show modal to report error and restart pullover
	showWindow()
	// showModal('Fatal error',
	// 	'Pullover encountered a fatal error. Please goto <a onclick="gui.Shell.openExternal(\'https://github.com/cgrossde/Pullover/issues\');" href="#">Github (Pullover/Issues)</a> ' +
	// 	'create a new issue and post the contents of your logfile: <a onclick="gui.Shell.showItemInFolder(\'' + debug.getLogFilePath().replace(/\\/gi,'\\\\').replace(' ', '\\ ') + '\');" href="#">' + debug.getLogFilePath().replace(' ', '\\ ') + '</a>', 'danger select-text', [
	// 		{
	// 			text: 'Exit Pullover',
	// 			func: function() {
	// 				win.close();
	// 				process.exit(1);
	// 			}
	// 		}
	// 	], true);
})
