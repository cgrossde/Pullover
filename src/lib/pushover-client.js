/**
 * Connects to Pushover Open Client (REST) API as well as
 * via websocket for live updates.
 *
 * Emits the following events:
 *  - connected					Once a connection was made
 *  - disconnected 			On close and error
 *  - reconnecting 			Started a reconnect
 *  - reconnectLater 		Reconnect in x seconds
 *  - keepAlive 						Whenever an interaction with endpoint takes place
 *  - connectionTimeout   When no message from endpoint for options.connectionTimeout seconds
 *  - data								When a message is received, 1. arg is message
 *  - error 							Will be emitted for every error, use for debugging
 *  - wsError							.onerror and when parsing of message fails
 *  - closedByEndpoint		When endpoint closed connection twice usually means
 *  												incorrect credentials
 *  - message							If a ! is received from endpoint
 *  - requestedReconnect  Reconnect was requested by endpoint
 *  - unkownCommand				Received unkown command from endpoint
 */
'use strict';
var _ = require('lodash');
var os = require('os');
var util = require('util');
var debug = require('./debug')('OpenClient');
var Promise = require('promise');
var WebSocket = require('ws');
var EventEmitter = require('events').EventEmitter;

var packageInfo = require('../package.json');
var userAgent = 'Pullover/' + packageInfo.version + ' (' + os.platform() + ' '
	+ os.arch() + ' ' + os.release() + ')';
var request = require('request').defaults({ headers: { 'User-Agent': userAgent } });

/**
 * The OpenClient classe
 *
 * @class OpenClient
 * @param {object} options Configuration object
 */
var OpenClient = function(options) {
	// Setup events
	EventEmitter.call(this);
	// Setup options with defaults
	this.options = _.defaults(options, {
		// Options regarding Open Client API
		secret: null,
		deviceId: null,
		apiBaseURL: 'https://api.pushover.net/',
		apiNamespace: '1/',

		// Options regarding webSocket and reconnect
		webSocketEndpoint: 'wss://client.pushover.net/push:443',
		waitBetweenReconnects: 10,		// Time to pass between reconnects in seconds
		maxReconnects: 5,							// After x reconnects, the waitBetweenReconnects will
																	// change to waitAfterMaxReconnects
		waitAfterMaxReconnects: 300,	// Once maxReconnects is reached, wait longer between reconnects (secs)
																	// After that we revert back to waitBetweenReconnects
		connectionTimeout: 35,				// After x seconds without keepAlive from API-Endpoint,
																	// we asume a timeout and try to reconnect

		// Optional, set only if you don't want to supply
		// login(), or registerDevice() with options
		deviceName: null,
		email: null,
		password: null,
		userKey: null,								// Not used yet (get's returned together with secret on login)

		debug: false									// If true, log every method call to console
	});

	// Prevent default action (exit) if no listener for error events
	this.on('error', function() {});

	// Define some internal vars
	this.webSocket = null;						// null = disconnected
	this.lastConnect = null;					// Limit connects to one every x sec (options.timeBetweenConnects)
	this.curReconnects = 0;						// Count reconnects
	this.reconnectLater	= false;			// If not false, OpenClient is already waiting for a reconnect
	this.keepAliveTimeout = null;			// Timer that will trigger the connection timeout
	this.closedByOpenClient	= true;			// To detect if socket was closed by API-Endpoint or by
																				// a close()/reconnect() ...
	this.retryAfterAPIdisconnect = true;	// Try to reconnect once after socket was closed by endpoint.
																				// This is not always due to wrong credentials but could also
																				// be a Mac waking up from sleep
	this.lastInteraction = null;			// Date of last interaction with server
};

// Inherit from events
util.inherits(OpenClient, EventEmitter);
// Export
module.exports = OpenClient;

OpenClient.prototype.log = function() {
	if (this.options.debug) {
		// console.log.apply(console, arguments);
		debug.log.apply(null, arguments);
	}
};

/**
 * Login with email and password to get secret for further calls
 *
 * @param  {object}   optionsOverride  options.email and options.password mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.login = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.login');
	var self = this;
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options;
	return new Promise(function(resolve, reject) {
		if (options.email === null || options.password === null) {
			var error = new Error('options.email and options.password mandatory');
			error.name = 'InvalidArguments';
			self.emit('error', error);
			reject(error); return;
		}

		var loginUrl = options.apiBaseURL + options.apiNamespace + 'users/login.json';
		var formData = {
			email: options.email,
			password: options.password
		};

		request.post({
			url: loginUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'Login request failed';
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers';
				}
				var error = new Error(errorDesc);
				error.name = 'LoginFailed';
				error.cause = err;
				self.emit('error', error);
				reject(error); return;
			}
			validateResponse(body,
				// Request successful
				function(response) {
					// Update self
					self.options.secret = response.secret;
					self.options.userKey = response.id;
					resolve(response);
				},
				// Request failed, output meaningful error
				function(response) {
					var error = new Error('Email or password invalid');
					error.name = 'InvalidCredentials';
					error.response = response;
					self.emit('error', error);
					reject(error);
				});
		});
	}).nodeify(callback);
};

/**
 * Register a new device to receive notifications
 *
 * @param  {object}   optionsOverride  options.secret and options.deviceName mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.registerDevice = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.registerDevice');
	var self = this;
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options;
	return new Promise(function(resolve, reject) {
		if (options.secret === null || options.deviceName === null) {
			var error = new Error('options.secret and options.deviceName mandatory');
			error.name = 'InvalidArguments';
			self.emit('error', error);
			reject(error); return;
		}
		// Check if deviceName valid
		var errorInDeviceName = validateDeviceName(options.deviceName);
		if (errorInDeviceName !== null) {
			reject(errorInDeviceName); return;
		}

		var deviceUrl = options.apiBaseURL + options.apiNamespace + 'devices.json';
		var formData = {
			secret: options.secret,
			name: options.deviceName,
			os: 'O'	// OpenClient is always O
		};

		// Make request
		request.post({
			url: deviceUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'RegisterDevice request failed';
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers';
				}
				var error = new Error(errorDesc);
				error.name = 'RegisterDeviceFailed';
				error.cause = err;
				self.emit('error', error);
				reject(error); return;
			}

			validateResponse(body,
				function(response) {
					self.options.deviceId = response.id;
					resolve(response);
				}, function(response) {
					// Request failed, output meaningful error
					if (response.errors !== undefined) {
						var errors = '';
						if (response.errors.name !== undefined && response.errors.name.constructor === Array) {
							errors += 'Name ' + response.errors.name.join('. ');
						}
						if (response.errors.secret !== undefined && response.errors.secret.constructor === Array) {
							errors += 'Secret ' + response.errors.secret.join('. ');
						}
						var error;
						if (errors !== '') {
							error = new Error(errors);
							error.name = 'InvalidArguments';
						}
						// Too many devices
						else {
							error = new Error(response.message);
							error.name = 'TooManyDevices';
						}
						error.response = response;
						self.emit('error', error);
						reject(error);
					}
					else {
						var error = new Error('Device registration failed');
						error.name = 'RegisterDeviceFailed';
						error.cause = err;
						error.response = response;
						self.emit('error', error);
						reject(error);
					}
				});
		});
	}).nodeify(callback);
};

/**
 * Check for valid deviceName
 * length: [1-25]
 * regEx: /^[A-Za-z0-9_\-]+$/
 *
 * @private
 * @param  {string} deviceName
 * @return {Boolean}
 */
function validateDeviceName(deviceName) {
	var error = null;
	// Validate devicename
	if (deviceName.length > 25) {
		error = new Error('Devicename to long (max 25 chars)');
		error.name = 'InvalidArguments';
	}
	if (deviceName.length === 0) {
		error = new Error('Devicename to short (min 1 chars)');
		error.name = 'InvalidArguments';
	}
	if (deviceName.match(/^[A-Za-z0-9_\-]+$/) === null) {
		error = new Error('Devicename contains invalid chars (allowed are [A-Z,a-z,0-9,_,-])');
		error.name = 'InvalidArguments';
	}

	return error;
}

/**
 * Fetch unread notifications from server
 *
 * @param  {object}   optionsOverride  options.secret and options.deviceId mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.fetchNotifications = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.fetchNotifications');
	var self = this;
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options;
	return new Promise(function(resolve, reject) {
		if (options.secret === null || options.deviceId === null) {
			var error = new Error('options.secret and options.deviceId mandatory');
			error.name = 'InvalidArguments';
			self.emit('error', error);
			reject(error); return;
		}

		var messageUrl = options.apiBaseURL + options.apiNamespace + 'messages.json';
		var urlData = {
			secret: options.secret,
			device_id: options.deviceId
		};

		request.get({
			url: messageUrl,
			form: urlData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'Fetch notification request failed';
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers';
				}
				var error = new Error(errorDesc);
				error.name = 'FetchNotificationsFailed';
				error.cause = err;
				self.emit('error', error);
				reject(error); return;
			}

			validateResponse(body,
				function(response) {
					if (response.messages !== undefined && response.messages.length > 0) {
						// multiple messages
						resolve(response.messages);
					}
					else if (response.messages !== undefined && response.messages.length === 0) {
						// no messages
						resolve([]);
					}
					else {
						// could not read messages
						var error = new Error('Error reading messages');
						error.name = 'FetchNotificationsFailed';
						error.response = response;
						self.emit('error', error);
						reject(error);
					}
				}, function(response) {
					var error = new Error('Fetch notifications failed, secret or deviceId invalid?');
					error.name = 'InvalidCredentials';
					error.response = response;
					self.emit('error', error);
					reject(error);
				});
		});
	}).nodeify(callback);
};

/**
 * Acknowledge last notification was received/read
 *
 * @param  {object}   optionsOverride  options.lastNotificationId, options.deviceId and options.secret mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.acknowledgeNotification = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.acknowledgeNotification');
	var self = this;
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options;
	return new Promise(function(resolve, reject) {
		if (options.lastNotificationId === undefined || options.deviceId === null || options.secret === null) {
			var error = new Error('options.lastNotificationId, options.deviceId and options.secret mandatory');
			error.name = 'InvalidArguments';
			self.emit('error', error);
			reject(error); return;
		}

		var acknUrl = options.apiBaseURL + options.apiNamespace + 'devices/' +
			options.deviceId + '/update_highest_message.json';
		var formData = {
			secret: options.secret,
			message: options.lastNotificationId
		};

		request.post({
			url: acknUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'Acknowledge notification request failed';
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers';
				}
				var error = new Error(errorDesc);
				error.name = 'AcknowledgeNotificationFailed';
				error.cause = err;
				self.emit('error', error);
				reject(error); return;
			}

			validateResponse(body, resolve, function(response) {
				// Request failed, output meaningful error
				var error = new Error('Acknowledge notification returned bad status');
				error.name = 'AcknowledgeNotificationFailed';
				error.response = response;
				self.emit('error', error);
				reject(error); return;
			});
		});
	}).nodeify(callback);
};

/**
 * Connects websocket, so we can listen for live updates
 *
 * @param  {object}   optionsOverride options.secret and options.deviceId mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.connect = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.connect');
	var self = this;
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options;
	return new Promise(function(resolve, reject) {
		// Already open? => exit
		if (self.webSocket !== null) {
			resolve(false);
			return;
		}
		// Credentials available?
		if (options.secret === null || options.deviceId === null) {
			var error = new Error('options.secret and options.deviceId mandatory');
			error.name = 'InvalidArguments';
			self.emit('error', error);
			reject(error); return;
		}
		// Reset keepAlive, increase connect counter, ...
		self.lastConnect = new Date();
		self.curReconnects++;
		self.closedByOpenClient = false;	// Reset since we are connecting
		// Connect
		self.webSocket = new WebSocket(options.webSocketEndpoint);
		// Register callbacks
		self.webSocket.on('open', function() {
			self.emit('connected');
			var loginToken = 'login:' + options.deviceId + ':' + options.secret;
			if (self.webSocket !== null && self.webSocket !== undefined && self.webSocket.readyState === 1) {
				self.webSocket.send(loginToken);
				self._resetKeepAlive();
			}
			resolve(true);		// Resolve here, we can not know if login will be successful
		});

		self.webSocket.on('message', function(data) {
			var message;
			try {
				message = data.toString('utf8');
			}
			catch (err) {
				var error = new Error('Error parsing incoming data from websocket');
				error.name = 'WebsocketError';
				error.cause = err;
				self.emit('wsError', error);
				self.emit('error', error);
				return;
			}
			self.emit('data', message);
			self._parseCommand(message);
		});

		self.webSocket.on('close', function() {
			self.webSocket = null;
			self.emit('disconnected');
			// Was it closed by OpenClient or Endpoint?
			if (! self.closedByOpenClient) {
				self.log('Not closed by client');
				// Possibly closed by API-Endpoint
				// Try to reconnect once
				if (self.retryAfterAPIdisconnect) {
					self.log('retryAfterAPIdisconnect');
					self.retryAfterAPIdisconnect = false;
					self.forceReconnect();
				}
				else {
					// Still closed by endpoint, possibly wrong credentials
					// => emit event
					self.log('Connection seems to have been closed by API Endpoint, this is unusual');
					self.log('Trying to reconnect ...');
					self.log('closedByEndpoint');
					self.emit('closedByEndpoint');
					self.reconnect();
				}
			}
			else { // Closed by OpenClient
				// Just log to console for now
				self.log('Connection closed (by OpenClient)');
			}
		});

		self.webSocket.on('error', function(event) {
			self.closedByOpenClient = true;
			self.webSocket = null;
			self.emit('disconnected');
			var error = new Error('Websocket error');
			error.name = 'WebsocketError';
			error.cause = event;
			self.emit('wsError', error);
			self.emit('error', error);
			self.reconnect();
			reject('Error opening connection.');
		});

	}).nodeify(callback);
};


/**
 * React to commands from websocket
 *
 * @private
 * @param  {string} command
 */
OpenClient.prototype._parseCommand = function(command) {
	this.log('OpenClient.prototype._parseCommand');
	// New messages
	if (command === '!') {
		this._resetKeepAlive();
		this.emit('message');

	}
	else if (command === 'E') {
		this.log('Login failed');
		this.emit('loginFailed');
		this.disconnect();
	}
	// Reconnect
	else if (command === 'R') {
		this.emit('requestedReconnect');
		this.reconnect();
	}
	// Keep alive
	else if (command === '#') {
		this._resetKeepAlive();
		this.retryAfterAPIdisconnect = true;	// Reset
	}
	else {
		this.emit('unkownCommand', command);
		var error = new Error('Received unkown command');
		error.name = 'WebsocketError';
		error.cause = command;
		this.emit('error', error);
	}
};

/**
 * Close websocket and stop reconnects
 *
 * @return {Boolean} False if no websocket was opened, else true
 */
OpenClient.prototype.disconnect = function() {
	this.log('OpenClient.prototype.disconnect');
	if (this.webSocket !== null) {
		this.closedByOpenClient = true;
		this.webSocket.close();
		this.webSocket = null;
		this._stopKeepAlive();
		return true;
	}
	return false;
};

/**
 * Reconnects websocket but respects options.waitBetweenReconnects and
 * options.waitAfterMaxReconnects
 *
 * @return {Number} Seconds until reconnect
 */
OpenClient.prototype.reconnect = function() {
	this.log('OpenClient.prototype.reconnect');
	// maxReconnects not reached?
	if (this.curReconnects <= this.options.maxReconnects) {
		var secSinceLastConnect = 0;
		if (this.lastConnect !== null) {
			secSinceLastConnect = Math.floor((new Date().getTime() - this.lastConnect.getTime()) / 1000);
		}
		if (secSinceLastConnect < this.options.waitBetweenReconnects) {
			// Last connect less than waitBetweenReconnects ago
			// Reconnect in waitBetweenReconnects - secSinceLastConnect
			// Returns seconds until reconnect
			return this._tryReconnectLater(this.options.waitBetweenReconnects - secSinceLastConnect);
		}
		else if (this.reconnectLater === false) {
			// Last connect more than waitBetweenReconnects ago and no reconnect currently waiting
			// Reconnect now
			this.forceReconnect();
			return 0; // Reconnecting now
		}
		else {
			// Already reconnecting, return time left till reconnect
			return this.secondsTillReconnect();
		}
	}
	else {
		// Max reconnects reached
		if (this.reconnectLater === false) {
			this.curReconnects = 0;
			return this._tryReconnectLater(this.options.waitAfterMaxReconnects); // Returns seconds until reconnect
		}
		else {
			// Already reconnecting, return time left till reconnect
			return this.secondsTillReconnect();
		}
	}
};

/**
 * Forces a reconnect now, without waiting
 */
OpenClient.prototype.forceReconnect = function() {
	this.log('OpenClient.prototype.forceReconnect');
	this.emit('reconnecting');
	this._stopKeepAlive();
	this._stopReconnectCountdown();
	this.disconnect();
	this.connect();
};

/**
 * Is openClient waiting for a reconnect?
 * @return {Boolean}
 */
OpenClient.prototype.isReconnecting = function() {
	this.log('OpenClient.prototype.isReconnecting');
	if (this.reconnectLater === false) return false;
	else return true;
};

/**
 * Returns number of seconds until reconnect or
 * false if no reconnect is waiting/happing
 *
 * @return {Boolean}
 */
OpenClient.prototype.secondsTillReconnect = function() {
	this.log('OpenClient.prototype.secondsTillReconnect');
	if (this.isReconnecting()) return getTimeLeft(this.reconnectLater);
	else return false;
};

/**
 * When was the last time we received something from the API-endpoint
 * @return {Date}
 */
OpenClient.prototype.lastInteractionDate = function() {
	this.log('OpenClient.prototype.lastInteractionDate');
	return this.lastInteraction;
};

/**
 * Private function to schedule a reconnect. Returns time
 * until reconnect which does not have to be equal to waitTime
 * since a reconnect could already be scheduled
 *
 * @private
 * @param  {Number} waitTime Time in seconds until reconnect should happen
 * @return {Number}          Time in seconds until reconnect will happen
 */
OpenClient.prototype._tryReconnectLater = function(waitTime) {
	this.log('OpenClient.prototype._tryReconnectLater', waitTime);
	// Only reconnect later if not already reconnecting
	if (this.reconnectLater === false) {
		// Try again later
		var self = this;
		this.reconnectLater = setTimeout(function() {
			self.forceReconnect();
			self.reconnectLater = false;
		}, waitTime * 1000);
		this.emit('reconnectLater', waitTime);
		return waitTime;	// Return seconds until reconnect
	}
	else {
		// Already reconnecting, return time left till reconnect
		return this.secondsTillReconnect();
	}
};

/**
 * Reset reconnect countdown, do not reconnect later
 *
 * @private
 */
OpenClient.prototype._stopReconnectCountdown = function() {
	this.log('OpenClient.prototype._stopReconnectCountdown');
	clearTimeout(this.reconnectLater);
	this.reconnectLater = false;
};

/**
 * Called whenever we received something from the API-endpoint to
 * know the connection is still alive. Will reset the timeout counter.
 *
 * @private
 */
OpenClient.prototype._resetKeepAlive = function() {
	this.log('OpenClient.prototype._resetKeepAlive');
	this.lastInteraction = new Date();
	this.emit('keepAlive');
	this._stopKeepAlive();
	this.keepAliveTimeout = setTimeout(
		this._connectionTimeout.bind(this),
		this.options.connectionTimeout * 1000
	);
};

/**
 * Stop timeout counter
 *
 * @private
 */
OpenClient.prototype._stopKeepAlive = function() {
	this.log('OpenClient.prototype._stopKeepAlive');
	clearTimeout(this.keepAliveTimeout);
};

/**
 * Will be called when the connection times out. Will try to reconnect.
 *
 * @private
 */
OpenClient.prototype._connectionTimeout = function() {
	this.log('OpenClient.prototype._connectionTimeout');
	this.emit('connectionTimeout');
	this.reconnect();
};

/**
 * Get time left in a timeout (in seconds)
 *
 * @private
 * @param  {object} timeout
 * @return {number}
 */
function getTimeLeft(timeout) {
    return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

/**
 * Try to parse payload of response,
 * if response was valid resolve else reject
 *
 * @private
 */
function validateResponse(body, resolve, reject) {
	if (body !== undefined && body !== '') {
		var response = JSON.parse(body);
		if (response !== undefined && response.status !== undefined) {
			// Check response result
			if (response.status === 1) {
				resolve(response);
			}
			else {
				reject(response);
			}
			return;
		}
	}
	// If promise was not resolved/rejected until here => reject
	var error = new Error('Body or response mal formed / empty');
	error.name = 'MalformedResponse';
	reject(error);
}
