/**
 * Connects to Pushover Open Client (REST) API
 *
 * The following errors can be returned
 * 	- InvalidArguments - Wrong params supplied
 * 	- LoginFailed
 * 	- InvalidCredentials
 * 	-
 */
'use strict'
var _ = require('lodash')
var os = require('os')
var util = require('util')
var debug = require('./debug')('PushoverRESTClient')
var Promise = require('promise')
var EventEmitter = require('events').EventEmitter

var packageInfo = require('../../package.json')
var userAgent = 'Pullover/' + packageInfo.version + ' (' + os.platform() + ' '
	+ os.arch() + ' ' + os.release() + ')'
var request = require('request').defaults({
	headers: { 'User-Agent': userAgent }
})

/**
 * The OpenClient classe
 *
 * @class OpenClient
 * @param {object} options Configuration object
 */
var OpenClient = function(options) {
	// Setup events
	EventEmitter.call(this)
	// Setup options with defaults
	this.options = _.defaults(options, {
		// Options regarding Open Client API
		secret: null,
		deviceId: null,
		apiBaseURL: 'https://api.pushover.net/',
		apiNamespace: '1/',

		// Optional, set only if you don't want to supply
		// login(), or registerDevice() with options
		deviceName: null,
		email: null,
		password: null,
		userKey: null,				// Not used yet (get's returned together with secret on login)

		debug: false					// If true, log every method call to console
	})

	// Prevent default action (exit) if no listener for error events
	this.on('error', function() {})
}

// Inherit from events
util.inherits(OpenClient, EventEmitter)
// Export
module.exports = OpenClient

OpenClient.prototype.log = function() {
	if (this.options.debug) {
		debug.log.apply(null, arguments)
	}
}

/**
 * Login with email and password to get secret for further calls
 *
 * @param  {object}   optionsOverride  options.email and options.password mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.login = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.login')
	var self = this
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options
	return new Promise(function(resolve, reject) {
		if (options.email === null || options.password === null) {
			let error = new Error('options.email and options.password mandatory')
			error.name = 'InvalidArguments'
			self.emit('error', error)
			reject(error)
			return
		}

		var loginUrl = options.apiBaseURL + options.apiNamespace + 'users/login.json'
		var formData = {
			email: options.email,
			password: options.password
		}

		request.post({
			url: loginUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				let errorDesc = 'Login request failed'
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers'
				}
				let error = new Error(errorDesc)
				error.name = 'LoginFailed'
				error.cause = err
				self.emit('error', error)
				reject(error)
				return
			}
			validateResponse(body,
				// Request successful
				function(response) {
					// Update self
					self.options.secret = response.secret
					self.options.userKey = response.id
					resolve(response)
				},
				// Request failed, output meaningful error
				function(response) {
					let error = new Error('Email or password invalid')
					error.name = 'InvalidCredentials'
					error.response = response
					self.emit('error', error)
					reject(error)
				})
		})
	}).nodeify(callback)
}

/**
 * Register a new device to receive notifications
 *
 * @param  {object}   optionsOverride  options.secret and options.deviceName mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.registerDevice = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.registerDevice')
	var self = this
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options
	return new Promise(function(resolve, reject) {
		if (options.secret === null || options.deviceName === null) {
			let error = new Error('options.secret and options.deviceName mandatory')
			error.name = 'InvalidArguments'
			self.emit('error', error)
			reject(error)
			return
		}
		// Check if deviceName valid
		var errorInDeviceName = validateDeviceName(options.deviceName)
		if (errorInDeviceName !== null) {
			reject(errorInDeviceName)
			return
		}

		var deviceUrl = options.apiBaseURL + options.apiNamespace + 'devices.json'
		var formData = {
			secret: options.secret,
			name: options.deviceName,
			os: 'O'	// OpenClient is always O
		}

		// Make request
		request.post({
			url: deviceUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'RegisterDevice request failed'
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers'
				}
				let error = new Error(errorDesc)
				error.name = 'RegisterDeviceFailed'
				error.cause = err
				self.emit('error', error)
				reject(error)
				return
			}

			validateResponse(body,
				function(response) {
					self.options.deviceId = response.id
					resolve(response)
				}, function(response) {
					// Request failed, output meaningful error
					if (response.errors !== undefined) {
						var errors = ''
						if (response.errors.name !== undefined && response.errors.name.constructor === Array) {
							errors += 'Name ' + response.errors.name.join('. ')
						}
						if (response.errors.secret !== undefined && response.errors.secret.constructor === Array) {
							errors += 'Secret ' + response.errors.secret.join('. ')
						}
						let error
						if (errors !== '') {
							error = new Error(errors)
							error.name = 'InvalidArguments'
						}
						// Too many devices
						else {
							error = new Error(response.message)
							error.name = 'TooManyDevices'
						}
						error.response = response
						self.emit('error', error)
						reject(error)
					}
					else {
						let error = new Error('Device registration failed')
						error.name = 'RegisterDeviceFailed'
						error.cause = err
						error.response = response
						self.emit('error', error)
						reject(error)
					}
				})
		})
	}).nodeify(callback)
}

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
	let error = null
	// Validate devicename
	if (deviceName.length > 25) {
		error = new Error('Devicename to long (max 25 chars)')
		error.name = 'InvalidArguments'
	}
	if (deviceName.length === 0) {
		error = new Error('Devicename to short (min 1 chars)')
		error.name = 'InvalidArguments'
	}
	if (deviceName.match(/^[A-Za-z0-9_\-]+$/) === null) {
		error = new Error('Devicename contains invalid chars (allowed are [A-Z,a-z,0-9,_,-])')
		error.name = 'InvalidArguments'
	}

	return error
}

/**
 * Fetch unread notifications from server
 *
 * @param  {object}   optionsOverride  options.secret and options.deviceId mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.fetchNotifications = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.fetchNotifications')
	var self = this
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options
	return new Promise(function(resolve, reject) {
		if (options.secret === null || options.deviceId === null) {
			let error = new Error('options.secret and options.deviceId mandatory')
			error.name = 'InvalidArguments'
			self.emit('error', error)
			reject(error)
			return
		}

		var messageUrl = options.apiBaseURL + options.apiNamespace + 'messages.json'
		var urlData = {
			secret: options.secret,
			device_id: options.deviceId
		}

		request.get({
			url: messageUrl,
			form: urlData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'Fetch notification request failed'
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers'
				}
				let error = new Error(errorDesc)
				error.name = 'FetchNotificationsFailed'
				error.cause = err
				self.emit('error', error)
				reject(error)
				return
			}

			validateResponse(body,
				function(response) {
					if (response.messages !== undefined && response.messages.length > 0) {
						// multiple messages
						resolve(response.messages)
					}
					else if (response.messages !== undefined && response.messages.length === 0) {
						// no messages
						resolve([])
					}
					else {
						// could not read messages
						let error = new Error('Error reading messages')
						error.name = 'FetchNotificationsFailed'
						error.response = response
						self.emit('error', error)
						reject(error)
					}
				}, function(response) {
					let error = new Error('Fetch notifications failed, secret or deviceId invalid?')
					error.name = 'InvalidCredentials'
					error.response = response
					self.emit('error', error)
					reject(error)
				})
		})
	}).nodeify(callback)
}

/**
 * Acknowledge last notification was received/read
 *
 * @param  {object}   optionsOverride  options.lastNotificationId, options.deviceId and options.secret mandatory
 * @param  {Function} callback Optional callback, else this will return a promise
 * @return {Promise}  If no callback given, return promise
 */
OpenClient.prototype.acknowledgeNotification = function(optionsOverride, callback) {
	this.log('OpenClient.prototype.acknowledgeNotification')
	var self = this
	var options = (optionsOverride) ? _.defaults(optionsOverride, self.options) : self.options
	return new Promise(function(resolve, reject) {
		if (options.lastNotificationId === undefined || options.deviceId === null || options.secret === null) {
			let error = new Error('options.lastNotificationId, options.deviceId and options.secret mandatory')
			error.name = 'InvalidArguments'
			self.emit('error', error)
			reject(error)
			return
		}

		var acknUrl = options.apiBaseURL + options.apiNamespace + 'devices/' +
			options.deviceId + '/update_highest_message.json'
		var formData = {
			secret: options.secret,
			message: options.lastNotificationId
		}

		request.post({
			url: acknUrl,
			formData: formData
		}, function(err, httpResponse, body) {
			if (err) {
				var errorDesc = 'Acknowledge notification request failed'
				if (err.code && err.code === 'ENOTFOUND') {
					errorDesc = 'Could not reach Pushover servers'
				}
				let error = new Error(errorDesc)
				error.name = 'AcknowledgeNotificationFailed'
				error.cause = err
				self.emit('error', error)
				reject(error)
				return
			}

			validateResponse(body, resolve, function(response) {
				// Request failed, output meaningful error
				let error = new Error('Acknowledge notification returned bad status')
				error.name = 'AcknowledgeNotificationFailed'
				error.response = response
				self.emit('error', error)
				reject(error)
				return
			})
		})
	}).nodeify(callback)
}

OpenClient.prototype.ready = function() {
	if (this.options.secret !== null && this.options.deviceId !== null) {
		return true
	}
	return false
}

/**
 * Try to parse payload of response,
 * if response was valid resolve else reject
 *
 * @private
 */
function validateResponse(body, resolve, reject) {
	if (body !== undefined && body !== '') {
		try {
			var response = JSON.parse(body)
		} catch (e) {
			// Server returned non-JSON response
			debug.log('Invalid response from server', body)
		}
		if (response !== undefined && response.status !== undefined) {
			// Check response result
			if (response.status === 1) {
				resolve(response)
			}
			else {
				reject(response)
			}
			return
		}
	}
	// If promise was not resolved/rejected until here => reject
	let error = new Error('Body or response mal formed / empty')
	error.name = 'MalformedResponse'
	reject(error)
}
