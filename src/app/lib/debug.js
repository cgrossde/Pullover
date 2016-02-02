/**
 * Returns an object with namespaced functions for debugging and logging
 */
import fs from 'fs'
import util from 'util'
import path from 'path'
import mkdirp from 'mkdirp'

// Also log to file
// * OS X - '/Users/user/Library/Application Support/pullover'
// * Windows 8 - 'C:\Users\User\AppData\Roaming\Pullover'
// * Windows XP - 'C:\Documents and Settings\User\Application Data\Pullover'
// * Linux - '$XDG_DATA_HOME/Pullover or $HOME/.local/share/Pullover'
var appDataPath = process.env.APPDATA ||
	(process.platform === 'darwin' ? process.env.HOME + '/Library/Application\ Support' : process.env.XDG_DATA_HOME || process.env.HOME + './local/share')
var logPath = path.join(appDataPath, 'Pullover')
console.log('LOG PATH: ' + logPath)
if (! fs.existsSync(logPath)) {
	mkdirp.sync(logPath)
}
// Logfile name (add debug if in Debug-Mode)
var logfileName = (process.env.DEBUG === '1') ? 'pullover.debug' : 'pullover'

// Keep the last 5 logfiles, shift logfile names
for (let  i = 4; i >= 1; i--) {
	if (fs.existsSync(path.join(logPath, logfileName + '.' + i + '.log'))) {
		// Rename file with increased index, e.g.: pullover.2.log becomes pullover.3.log
		fs.renameSync(path.join(logPath, logfileName + '.' + i + '.log'),
			path.join(logPath, logfileName + '.' +(i+1)+'.log'))
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
	return function() {
		var date = util.inspect(new Date())
		var string = '  ' + namespace + '   '
		for (let i = 0; i < arguments.length; i++) {
			string += '   ' + util.inspect(arguments[i])
		}
		string = string.replace(/\\n/g, '\n').replace(/\\/g, '')
		logToFile(date + string)
		console.log.call(console, string)
	}
}


export default function(namespace) {
	return {
		log: getLogFn(namespace),
		getLogFilePath: getLogFilePath,
		getLogPath: getLogPath
	}
}