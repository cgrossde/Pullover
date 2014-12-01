var Promise = require('promise');
var request = require('request');

function login(options, callback) {
	return new Promise(function(resolve, reject) {
		if(options === undefined || options.email === undefined || options.password === undefined) {
			reject('Invalid login options'); return;
		}
		var loginUrl = 'https://api.pushover.net/1/users/login.json';
		var formData = {
			email: options.email,
			password: options.password
		};
		request.post({
			url: loginUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				if(err.code && err.code === 'ENOTFOUND') {
					reject('Could not reach Pushover servers');
				} else {
					reject(err);
				}
				return;
			}

			validateResponse(body, resolve, function(response) {
				// Request failed, output meaningful error
				reject('Email or password invalid');
			});
		});
	}).nodeify(callback);
}

function registerDevice(options, callback) {
	return new Promise(function(resolve, reject) {
		if(options === undefined || options.secret === undefined || options.secret === '' || options.name === undefined) {
			reject('Invalid login options'); return;
		}

		// Validate devicename
		if(options.name.length > 25) {
			reject('Devicename to long (max 25 chars)'); return;
		}
		if(options.name.length === 0) {
			reject('Devicename to short (min 1 chars)'); return;
		}
		if(options.name.match(/^[A-Za-z0-9_-]+$/) === null) {
			reject('Devicename contains invalid chars (allowed are [A-Za-z0-9_-])'); return;
		}

		var deviceUrl = 'https://api.pushover.net/1/devices.json';
		var formData = {
			secret: options.secret,
			name: options.name,
			os: 'O'	// OpenClient is always O
		};

		request.post({
			url: deviceUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				if(err.code && err.code === 'ENOTFOUND') {
					reject('Could not reach Pushover servers');
				} else {
					reject(err);
				}
				return;
			}

			validateResponse(body, resolve, function(response) {
				// Request failed, output meaningful error
				if(response.errors !== undefined) {
					var errors = '';
					if(response.errors.name !== undefined && response.errors.name.constructor === Array) {
						errors += 'Name ' + response.errors.name.join('. ');
					}
					if(response.errors.secret !== undefined && response.errors.secret.constructor === Array) {
						errors += 'Secret ' + response.errors.secret.join('. ');
					}
					reject(errors);
				} else {
					reject('Device registration failed');
				}
			});
		});


	}).nodeify(callback);
}

function getMessages(options, callback) {
	return new Promise(function(resolve, reject) {
		if(options === undefined || options.secret === undefined || options.device_id === undefined) {
			reject('Invalid message options'); return;
		}

		var messageUrl = 'https://api.pushover.net/1/messages.json';
		var urlData = {
			secret: options.secret,
			device_id: options.device_id
		};

		request.get({
			url: messageUrl,
			form: urlData
		}, function(err, httpResponse, body) {
			if (err) {
				if(err.code && err.code === 'ENOTFOUND') {
					reject('Could not reach Pushover servers');
				} else {
					reject(err);
				}
				return;
			}

			validateResponse(body, resolve, function() {
				reject('Get messages failed, secret or device_id invalid?');
			});
		});
	}).nodeify(callback);
}

function acknowledgeMessage(options, callback) {
	return new Promise(function(resolve, reject) {
		if(options === undefined || options.lastMessageId === undefined || options.device_id === undefined || options.secret === undefined) {
			reject('Invalid options'); return;
		}

		var acknUrl = 'https://api.pushover.net/1/devices/'+ options.device_id +'/update_highest_message.json';
		var formData = {
			secret: options.secret,
			message: options.lastMessageId
		};

		request.post({
			url: acknUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				if(err.code && err.code === 'ENOTFOUND') {
					reject('Could not reach Pushover servers');
				} else {
					reject(err);
				}
				return;
			}

			validateResponse(body, resolve, function(response) {
				// Request failed, output meaningful error
				reject('Message ackn. failed');
			});
		});
	}).nodeify(callback);
}

function validateResponse(body, resolve, reject) {
	if(body !== undefined && body !== '') {
		var response = JSON.parse(body);
		if(response !== undefined && response.status !== undefined) {
			// Check response result
			if(response.status === 1) {
				resolve(response);
			} else {
				reject(response);
			}
		}
	}
	// If promise was not resolved/rejected until here => reject
	reject('Body or response mal formed / empty');
}

module.exports.login = login;
module.exports.registerDevice = registerDevice;
module.exports.getMessages = getMessages;
module.exports.acknowledgeMessage = acknowledgeMessage;