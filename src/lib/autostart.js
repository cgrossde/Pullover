/**
 * Module to test, enable and disable autostart of app
 *
 * Currently only windows and mac os supported.
 */
var os = require('os');
var Promise = require('promise');

function Autostart(appName, executablePath) {
	this.appName = appName || 'AutostartApp';
	this.executablePath = executablePath || _getPathToExecutable();
}

Autostart.prototype.isPlatformSupported = function() {
	if(os.platform() === 'darwin') {
		return true;
	}
	else if(os.platform().indexOf('win') === 0) {
		return true;
	}
	// Not supported
	else {
		return false;
	}
};

Autostart.prototype.isSet = function(callback) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if(os.platform() === 'darwin') {
			_macAppleScriptIsAutorunSet(self.appName).then(resolve);
		}

		else if(os.platform().indexOf('win') === 0) {
			_winRegIsAutorunSet(self.appName).then(resolve);
		}
		// Not supported
		else {
			resolve(false);
		}
	}).nodeify(callback);
};

Autostart.prototype.enable = function(callback) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if(os.platform() === 'darwin') {
			_macAppleScriptAutorunEnable(self.appName, self.executablePath).then(resolve);
		}

		else if(os.platform().indexOf('win') === 0) {
			_winRegAutorunEnable(self.appName, self.executablePath).then(resolve);
		}
		// Not supported
		else {
			resolve(false);
		}
	}).nodeify(callback);
};

Autostart.prototype.disable = function(callback) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if(os.platform() === 'darwin') {
			_macAppleScriptAutorunDisable(self.appName).then(resolve);
		}

		else if(os.platform().indexOf('win') === 0) {
			_winRegAutorunDisable(self.appName).then(resolve);
		}

		// Not supported
		else {
			resolve(false);
		}
	}).nodeify(callback);
};

function _macAppleScriptAutorunEnable(appName, executablePath) {
	return new Promise(function(resolve, reject) {
		var applescript = require("applescript");
		var script = 'tell application "System Events" to make login item at end' +
			' with properties {path:"' + executablePath + '",'+
			' hidden:false, name:"' + appName + '"}';
		applescript.execString(script, function(err, res) {
			if(err) {
				console.log('Autostart error:',err);
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

function _macAppleScriptAutorunDisable(appName) {
	return new Promise(function(resolve, reject) {
		var applescript = require("applescript");
		var script = 'tell application "System Events" to delete login item "' + appName + '"';
		applescript.execString(script, function(err, res) {
			if(err) {
				console.log('Autostart error:',err);
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}

function _macAppleScriptIsAutorunSet(appName) {
	return new Promise(function(resolve, reject) {
		var applescript = require("applescript");
		var script = 'tell application "System Events"\n'+
			'if login item "' + appName + '" exists then\n' +
				'return 1\n' +
			'else\n' +
				'return 0\n' +
			'end if\n' +
		'end tell';
		applescript.execString(script, function(err, res) {
			if(err && res === undefined) {
				console.log('Autostart error:',err,res);
				resolve(false);
			} else if(res === 1) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}

// Helper function to execute and log out child process
var _spawnProcess = function(command, args, options, callback) {
    var spawn = require('child_process').spawn;
    var process = spawn(command, args, options),
        err = false,
		text = '',
		errText = '';

    process.stdout.on('data', function(data) {
		text += data.toString();
    });

    process.stderr.on('data', function(data) {
        err = true;
        errText += data.toString();
    });

    if (typeof callback === 'function') {
        process.on('exit', function(exitCode) {

            if (err || exitCode !== 0) {
                return callback(true, errText);
            } else {
            	return callback(false, text);
            }
        });
    }
};

function _winRegIsAutorunSet(appName) {
	var self = this;
	return new Promise(function(resolve, reject) {
		_spawnProcess('cmd',
			['/C','REG', 'QUERY', 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','/v',appName],
			{}, function(err, res) {
				if(err) {
					console.log('Autostart error:',err);
					resolve(false);
				} else {
					resolve(true);
				}
		});
	});
}

function _winRegAutorunEnable(appName, executablePath) {
	var self = this;
	return new Promise(function(resolve, reject) {
		_spawnProcess('cmd', ['/C','REG', 'ADD', 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','/f','/v',appName,'/t','REG_SZ','/d', executablePath],
			{}, function(err, res) {
				if(err) {
					console.log('Autostart error:',err);
					resolve(false);
				} else {
					resolve(true);
				}
		});
	});
}

function _winRegAutorunDisable(appName) {
	var self = this;
	return new Promise(function(resolve, reject) {
		_spawnProcess('cmd', ['/C','REG', 'DELETE', 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','/f','/v',appName],
			{}, function(err, res) {
				if(err) {
					console.log('Autostart error:',err);
					resolve(false);
				} else {
					resolve(true);
				}
		});
	});
}


function _getPathToExecutable() {
	if(os.platform() === 'darwin') {
		var app = process.cwd().match(/.*?\.app/);
		if(app === null || app.length === 0) {
			return process.cwd();
		} else {
			return app[0];
		}
	}

	else if(os.platform().indexOf('win') === 0) {
		return process.execPath;
	}

	else {
		return process.cwd();
	}
}

module.exports = Autostart;
