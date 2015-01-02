/**
 * Returns an object with namespaced functions for debugging and logging
 */
var fs = require('fs');
var util = require('util');
var path = require('path');
// var debug = require('debug');
var mkdirp = require('mkdirp');

var fileLoggerReady = false;

// Also log to file
// * OS X - '/Users/user/Library/Application Support/pullover'
// * Windows 8 - 'C:\Users\User\AppData\Roaming\Pullover'
// * Windows XP - 'C:\Documents and Settings\User\Application Data\Pullover'
// * Linux - '/var/local/Pullover'
var appDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application\ Support' : '/var/local');
var logPath = path.join(appDataPath, 'Pullover');
console.log('LOG PATH: ' + logPath)
if(! fs.existsSync(logPath)) {
	mkdirp.sync(logPath);
}
// Keep the last 5 logfiles, shift logfile names
for(i = 4; i >= 1; i--) {
	if(fs.existsSync(path.join(logPath, 'pullover.'+i+'.log'))) {
		// Rename file with increased index, e.g.: pullover.2.log becomes pullover.3.log
		fs.renameSync(path.join(logPath, 'pullover.'+i+'.log'), path.join(logPath, 'pullover.'+(i+1)+'.log'));
	}
}
var logFilePath = path.join(logPath, 'pullover.1.log');
// Open log file for writing
var logFileHandle = fs.openSync(logFilePath, 'w');




function getLogFilePath() {
	return logFilePath;
}

function getLogPath() {
	return logPath;
}

function logToFile(string) {
	string += '\r\n';
	fs.writeSync(logFileHandle, string);
}

function getLogFn(namespace) {
	return function() {
		var date = util.inspect(new Date());
		var string = '  ' + namespace + '   ';
		for(i = 0; i < arguments.length; i++) {
			string += "   " + util.inspect(arguments[i]);
		}
		logToFile(date + string);
		console.log.call(console, string);
	};
}

// function getDebugFn(namespace) {
// 	var debugFn = (namespace !== undefined) ? debug(namespace+':debug') : debug('app:debug');
// 	debugFn.log = console.warn.bind(console);
// 	return debugFn;
// }

// function getErrorFn(namespace) {
// 	var errorFn = (namespace !== undefined) ? debug(namespace+':error') : debug('app:error');
// 	errorFn.log = console.error.bind(console);
// 	return errorFn;
// }

// function getShellLogFn() {
// 	return console.log;
// }

// function getShellErrorLogFn() {
// 	return function() {
// 		if(arguments.length > 0) {
// 			// If first arg is a string, make it red
// 			if(typeof arguments[0] == 'string' || arguments[0] instanceof String) {
// 				arguments[0] = "\033[31m" + arguments[0] + "\033[37m";
// 			}
// 			console.log.apply(null, arguments);
// 		}
// 	};
// }

// function getShellHighlightFn() {
// 	return function() {
// 		process.stdout.write("\033[33m");
// 		console.log.apply(null, arguments);
// 		process.stdout.write("\033[37m");
// 	};
// }


module.exports = function(namespace) {
	return {
		log: getLogFn(namespace),
		// debug: getDebugFn(namespace),
		// error: getErrorFn(namespace),
		// shell: getShellLogFn(),
		// shellSpecial: getShellHighlightFn(),
		// shellErr: getShellErrorLogFn(),
		getLogFilePath: getLogFilePath,
		getLogPath: getLogPath
	};
};