/*eslint-env node*/
/*global Notification, document, $, localStorage*/
'use strict';
// Load library / modules
var os = require('os');
var obs = require('obs');
var gui = require('nw.gui');
var path = require('path');
var http = require('https');
var debug = require('./lib/debug')('App');
var semver = require('semver');
var moment = require('moment');
var inspect = require('eyes').inspector({ stream: null });
var Autorun = require('autorun');
var autorun = new Autorun('Pullover');
var OpenClient = require('./lib/pushover-client');
var openClient = null;
var packageInfo = require('./package');

var nwNotify = require('nw-notify');
nwNotify.setConfig({
	appIcon: nwNotify.getAppPath() + 'images/icon.png'
});

debug.log('APP ICON PATH', nwNotify.getAppPath() + 'images/icon.png');

// Setup window, menubar and tray
var win = gui.Window.get();
var tray;
var uiComponents = [];

// Don't show all messages at once, or some will not be seen
var notifyTimeout = 1500;
// Keep track of connection status and update UI when it changes
var CONN_DISCONNECTED = 0;
var CONN_CONNECTED = 1;
var CONN_TIMEOUT = 2;
var connectionStatus = obs.prop(CONN_DISCONNECTED);
connectionStatus.subscribe(updateSyncStatus);
var reconnectCountdown = null;

// Get the minimize event
win.on('minimize', hideWindow);

// Handle CMD+W vs CMD+Q
win.on('close', hideWindow);

// No taskbar item
win.setShowInTaskbar(false);
win.setResizable(false);

// Mac allow CMD+C, CMD+V, CMD+W, ...
var nativeMenuBar = new gui.Menu({ type: 'menubar' });
try {
	nativeMenuBar.createMacBuiltin('Pullover');
	win.menu = nativeMenuBar;
}
catch (ex) {
	// Will fail on windows
	// debug.log(ex.message);
}

function hideWindow() {
	win.hide();
	win.setShowInTaskbar(false);
}

function showWindow() {
	win.show();
	win.setShowInTaskbar(true);
}

// Create permanent tray icon
// Tray icon
var icon = (os.platform() === 'darwin') ? 'images/tray_mac.png' : 'images/tray.png';
tray = new gui.Tray({
	icon: icon
});

// Create tray menu items:
	// Separator
	var itemSeparator = new gui.MenuItem({ type: 'separator' });
	// Show status
	var itemStatus = new gui.MenuItem({ type: 'normal', label: 'Status' });
	itemStatus.on('click', function() {
		showWindow();
		showStatus();
	});
	// Quit app
	var itemQuit = new gui.MenuItem({ type: 'normal', label: 'Quit Pullover' });
	itemQuit.on('click', quitApp);

// Build tray click menu
var menu = new gui.Menu();
menu.append(itemStatus);
menu.append(itemSeparator);
menu.append(itemQuit);
tray.menu = menu;

// Really quit app (only calable from tray)
function quitApp() {
	nwNotify.closeAll();
	win.close(true);
}

// Catch all uncaught errors to log them to a file
// and report an issue
process.on('uncaughtException', function(error) {
	debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ');
	debug.log('=============== STACK ===============');
	debug.log(error.stack);
	debug.log('=============== Error Object ===============');
	debug.log(inspect(error).replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, ''));
	debug.log(' - - - - - - - - UNCAUGHT EXCEPTION - - - - - - - - ');
	// Show modal to report error and restart pullover
	showWindow();
	showModal('Fatal error',
		'Pullover encountered a fatal error. Please goto <a onclick="gui.Shell.openExternal(\'https://github.com/cgrossde/Pullover/issues\');" href="#">Github (Pullover/Issues)</a> ' +
		'create a new issue and post the contents of your logfile: <a onclick="gui.Shell.showItemInFolder(\'' + debug.getLogFilePath().replace(/\\/gi,'\\\\').replace(' ', '\\ ') + '\');" href="#">' + debug.getLogFilePath().replace(' ', '\\ ') + '</a>', 'danger select-text', [
			{
				text: 'Exit Pullover',
				func: function() {
					win.close();
					process.exit(1);
				}
			}
		], true);
});


// Notification function
// Usage: notify('NFL-Release', 'Pats vs Broncos 720p usw', 'http://google.com', 'images/nfl3.png');
function notify(title, text, url, iconPath) {
	if(localStorage.newNotifier === 'true') {
		nwNotify.notify(title, text, url, iconPath);
	} else {
		nativeNotify(title, text, url, iconPath);
	}
}

/**
 * Use node webkits native notification function
 */
function nativeNotify(title, text, url, iconPath, retryOnError) {
	retryOnError = (retryOnError !== undefined) ? retryOnError : true;
	var options = {};
	options.body = text;
	if (iconPath) options.icon = iconPath;

	var notice = new Notification(title, options);
	notice.onerror = function(error) {
		debug.log('ERROR displaying notification (retry=' + retryOnError + ')', error);
		if (retryOnError) {
			// Try one more time in 1 sec
			setTimeout(function() {
				debug.log('Notification retry');
				nativeNotify(title, text, url, iconPath, false);
			}, 1000);
		}
	};

	if (url !== null) {
		notice.onclick = function() {
			gui.Shell.openExternal(url);
		};
	}
}

function showLogin() {
	if ($('#login').is(':hidden')) {
		hideUiComponents();
		$('#login').fadeIn();
	}
	var onClickFunction = function() {
		$('.login-button').off();
		showSpinner();
		openClient.login({
			email: $('#email').val(),
			password: $('#password').val()
		}).then(function(success) {
			localStorage.secret = success.secret;
			localStorage.id = success.id;
			hideModal();
			// Hand over to app again
			app();
		}, function(failed) {
			debug.log('Login failed: ' + failed);
			showModal('Login failed', failed, 'danger');
			// Enable Loginbutton again
			$('.login-button').off().on('click', onClickFunction);
		});
	};
	$('.login-button').off().on('click', onClickFunction);
}

function showInfo() {
	if ($('#info').is(':hidden')) {
		hideUiComponents();
		$('#info').fadeIn();
	}
}

function showSettings() {
	if ($('#settings').is(':hidden')) {
		hideUiComponents();
		$('#settings').fadeIn();
	}
	autorun.isSet().then(function(active) {
		$('.settings-startup').prop('checked', active);
	});
}

function showDeviceRegistration() {
	if ($('#deviceRegistration').is(':hidden')) {
		hideUiComponents();
		$('#deviceRegistration').fadeIn();
	}
	var onClickFunction = function() {
		$('.deviceRegistration-button').off();
		showSpinner();
		openClient.registerDevice({
			deviceName: $('#devicename').val()
		}).then(function(success) {
			localStorage.deviceId = success.id;
			localStorage.deviceName = $('#devicename').val();
			hideModal();
			// Connect & fetch messages
			getMessages();
			openClient.connect();
			// Hand over to app again
			app();
		}, function(error) {
			debug.log(error);
			showModal('Device registration failed', error.message, 'danger');
			// Enable deviceRegistration-button again
			$('.deviceRegistration-button').off().on('click', onClickFunction);
		});
	};
	$('.deviceRegistration-button').off().on('click', onClickFunction);
}

function showStatus() {
	if ($('#status').is(':hidden')) {
		hideUiComponents();
		$('#status').fadeIn();
	}
	// Toggle status button if not logged in or device registered
	if (! isLoggedIn() || ! isDeviceRegistered()) {
		$('.status-button').off().on('click', app);
	}
	// Show login status
	if (isLoggedIn()) {
		$('td.status-login').empty().text('Yes')
							.append(' (<span class="text-danger logout-button">Logout</span>)')
							.find('span.logout-button')
								.on('click', logout)
								.end()
							.addClass('text-success')
							.removeClass('text-danger');
	}
	else {
		$('td.status-login').empty().append('<span class="goto-login-link">No, click to login</span>')
							.find('span.goto-login-link')
								.on('click', function() {
									$('.status-button').off().on('click', showStatus);
									showLogin();
								})
								.end()
							.addClass('text-danger')
							.removeClass('text-success');
	}
	// Show device registration status
	if (isDeviceRegistered()) {
		$('td.status-device').empty().text(localStorage.deviceName)
							.addClass('text-success')
							.removeClass('text-danger');
	}
	else {
		$('td.status-device').addClass('text-danger')
							.removeClass('text-success');
		// If not logged in => show login first
		if (! isLoggedIn()) {
			$('td.status-device')
				.empty().append('<span class="goto-login-link">No, click to login</span>')
				.find('span.goto-login-link')
				.on('click', function() {
					$('.status-button').off().on('click', showStatus);
					showLogin();
				});
		} // Logged in, but no device registered => link to device registration page
		else {
			$('td.status-device')
				.empty().append('<span class="goto-deviceRegistration-link">No, click to register</span>')
				.find('span.goto-deviceRegistration-link')
				.on('click', function() {
					$('.status-button').off().on('click', showStatus);
					showDeviceRegistration();
				});
		}
	}
	// Last sync and connection status
	updateSyncStatus();
}

function updateSyncStatus() {
	debug.log('Conn-status:', connectionStatus());
	var timeSinceLastSync = 'never';
	if (openClient !== null && openClient.lastInteractionDate() !== null) {
		timeSinceLastSync = moment(openClient.lastInteractionDate()).fromNow();
	}

	$('td.status-sync').addClass('text-primary').text(timeSinceLastSync);
	// Update connection status
	var classes = 'text-danger text-warning text-success';
	if (connectionStatus() === CONN_CONNECTED) {
		setStatusOnline();
		$('td.status-connection').removeClass(classes)
								.addClass('text-success')
								.text('Connected');
	}
	else if (connectionStatus() === CONN_TIMEOUT) {
		debug.log('TIMEOUT');
		setStatusOffline();
		// Allow reconnect if logged in and device registered
		if (isLoggedIn() && isDeviceRegistered()) {
			$('td.status-connection').removeClass(classes)
									.addClass('text-warning')
									.empty().append('<span class="reconnect-link">Timeout, click to reconnect</span>')
									.find('span.reconnect-link')
									.on('click', forceReconnect);
		}
		else {
			$('td.status-connection').removeClass(classes)
									.addClass('text-warning')
									.text('Timeout');
		}
	}
	else if (connectionStatus() === CONN_DISCONNECTED) {
		setStatusOffline();
		if (isLoggedIn() && isDeviceRegistered()) {
			$('td.status-connection').removeClass(classes)
									.addClass('text-danger')
									.empty().append('<span class="reconnect-link">Disconnected, click to reconnect</span>')
									.find('span.reconnect-link')
									.on('click', forceReconnect);
		}
		else {
			$('td.status-connection').removeClass(classes)
									.addClass('text-danger')
									.text('Disconnected');
		}
	}
	// There was some other error, just display text
	else {
		setStatusOffline();
		$('td.status-connection').removeClass(classes)
							.addClass('text-danger')
							.text(connectionStatus());
	}
}

function hideUiComponents() {
	$(uiComponents).each(function(index, selector) {
		$(selector).hide();
	});
}

function setStatusOffline() {
	$('.status-button span').removeClass('glyphicon-signal glyphicon-refresh')
							.addClass('glyphicon-flash');
}

function setStatusOnline() {
	$('.status-button span').removeClass('glyphicon-flash glyphicon-refresh')
							.addClass('glyphicon-signal');
}

function getMessages() {
	debug.log('getMessages - try request');
	openClient.fetchNotifications()
	.then(function(messages) {
		debug.log('getMessages - successful');
		if (messages.length === 0) {
			debug.log('No new messages');
			return;
		}
		else {
			debug.log('New messages: ' + messages.length);
		}
		if (localStorage.messagesReceived === undefined) {
			localStorage.messagesReceived = messages.length;
		}
		else {
			localStorage.messagesReceived = parseInt(localStorage.messagesReceived) + messages.length;
		}
		updateMessagesReceived();
		// Send push notifications
		$(messages).each(function(index, message) {
			// function notify(title, text, url, iconPath) {
			var title = message.title || message.app;
			var url = (message.url) ? message.url : null;
			var iconPath = 'https://api.pushover.net/icons/' + message.icon + '.png';
			setTimeout(function() {
				notify(title, message.message, url, iconPath, true);
			}, notifyTimeout * index);
		});
		// Acknowledge receiving messages
		var options = {
			lastNotificationId: messages[messages.length - 1].id,
			secret: localStorage.secret,
			device_id: localStorage.deviceId
		};
		openClient.acknowledgeNotification(options)
		.catch(function(error) {
			debug.log(error);
		})
	}, function(failed) {
		// Check if API rejected or no internet connection
		if(failed.cause.code !== 'ENOTFOUND') {
			debug.log('showReloginModal because of getting messages failed');
			showReloginModal('Get notifications failed',
				'Login was rejected by Pushover API. This device might have been removed from your account.</br>' +
				'Please try to relogin.', 'danger');
		}

		connectionStatus(CONN_DISCONNECTED);
	});
}

function showReloginModal(title, text, type) {
	// Notify user that he might have to relogin
	// and stop reconnects
	showModal(title, text, type, [
			{
				text: 'Logout',
				func: logout
			},
			{
				text: 'Reconnect',
				func: forceReconnect
			}
		]);
	// Stop reconnects
	disableCountdown();
	// Show pushover window
	showWindow();
	// Hide again if reconnect happens in the meantime
	if(openClient) {
		openClient.once('connected', function() {
			debug.log('Relogin modal hidden');
			hideModal();
			hideWindow();
		});
	}
}

function enableCountdown(secRemaining) {
	function secToText(secRemaining) {
		var text = '';
		if (secRemaining > 60) {
			var min = Math.floor(secRemaining / 60);
			var sec = secRemaining % 60;
			text = min + 'm ' + sec + 's';
		}
		else {
			text = secRemaining + 's';
		}
		return text;
	}
	disableCountdown();	// Just to be sure
	$('#status table tbody').append('<tr>' +
              '<th>Reconnect in</th>' +
              '<td class="status-reconnect">' + secToText(secRemaining) + '</td>' +
            '</tr>');
	secRemaining--;
	reconnectCountdown = setInterval(function() {
		$('.status-reconnect').empty().text(secToText(secRemaining));
		secRemaining--;
	}, 1000);
}

function disableCountdown() {
	clearInterval(reconnectCountdown);
	$('#status .status-reconnect').parent().remove();
}

// Controls app-flow
function app() {
	// uiComponents
	uiComponents = ['#login', '#deviceRegistration', '#status', '#info', '#settings'];
	hideUiComponents();
	// Toggle status button
	$('.status-button').off().on('click', showStatus);
	// Do we need to login?
	if (! isLoggedIn()) {
		$('.loggedIn').hide();
		showLogin();
	}
	// Is this device already registered?
	else if (! isDeviceRegistered()) {
		$('.loggedIn').show();
		showDeviceRegistration();
	}
	else {
		$('.loggedIn').show();
		showStatus();
	}
}

function isLoggedIn() {
	return (localStorage && localStorage.secret !== undefined);
}

function isDeviceRegistered() {
	return (localStorage && localStorage.deviceId !== undefined);
}

function logout() {
	if (openClient !== null) {
		openClient.disconnect();
	}
	disableCountdown();
	localStorage.clear();
	app();
}

function forceReconnect() {
	if (openClient !== null) {
		openClient.forceReconnect();
	}
}

function showSpinner() {
	$('#modal').hide().fadeIn();
	$('.modal-info').hide();
	$('.modal-spinner').fadeIn();
}

function showModal(title, text, type, addButtonArray, hideCloseButton) {
	debug.log('Show Modal', title, text, type, addButtonArray);
	$('.modal-additional-button').remove();
	var textClass = (type) ? 'modal-text text-' + type : 'modal-text';
	$('#modal').hide().fadeIn();
	$('.modal-info').show();
	$('.modal-spinner').hide();
	$('.modal-title').text(title);
	$('.modal-text').html(text).removeClass().addClass(textClass);
	$('.modal-button').off().on('click', hideModal);
	if (addButtonArray !== undefined) {
		$(addButtonArray).each(function(index, button) {
			$('.modal-button').parent()
			.append('<button type="button" class="btn btn-default modal-additional-button' +
				' modal-additional-button' + index + '">' + button.text + '</button>')
			.find('.modal-additional-button' + index)
			.on('click', function() {
				button.func();
				hideModal();
			});
		});
	}
	if(hideCloseButton === true) {
		$('.modal-button').hide();
	}
}

function hideModal() {
	$('#modal').fadeOut();
	$('.modal-info').hide();
	$('.modal-spinner').hide();
	$('.modal-additional-button').remove();
}

function versionCheck() {
	debug.log('versionCheck');
	var repoUrl = 'https://raw.githubusercontent.com/cgrossde/Pullover/master/src/package.json';
	http.get(repoUrl, function(res) {
		var body = '';

		res.on('data', function(chunk) {
			body += chunk;
		});

		res.on('end', function() {
			var latestInfo = JSON.parse(body);
			if (semver.lt(packageInfo.version, latestInfo.version)) {
				notify('Pullver Update',
					'New Update available: v' + latestInfo.version + '.\nYou are using v' + packageInfo.version + '. Click to update',
					'https://github.com/cgrossde/Pullover/releases/latest'
				);
				// Show update in about/info
				$('#info .updateAvailable').remove();
				$('.info-version').text(packageInfo.version + ' (outdated)')
				.parent().after('<tr class="updateAvailable">' +
					'<th>Latest Version</th>' +
					'<td>' + latestInfo.version + ' (<a href="#" class="whatsNew">What\'s new?</a>)</td>' +
					'</tr>')
				.parent()
				.find('.whatsNew')
				.on('click', function() {
					gui.Shell.openExternal('https://github.com/cgrossde/Pullover/releases/latest');
				});
			}
		});

	}).on('error', function(e) {
		debug.log('Version check failed: ', e);
	});
}

function runOnStartupToggle() {
	if (autorun.isPlatformSupported() === false) {
		showModal('Not supported',
			'This operation is not supported for your platform (' + os.platform() + ')');
	}
	else {
		showSpinner();
		autorun.isSet()
		.then(function(autorunEnabled) {
			if (autorunEnabled) {
				autorun.disable(hideModal);
			}
			else {
				autorun.enable(hideModal);
			}
		})
		.catch(function(error) {
			debug.log(error);
		});
	}
}

function updateMessagesReceived() {
	if (localStorage.messagesReceived !== undefined) {
		$('.messages-received').text(localStorage.messagesReceived);
	}
	else {
		$('.messages-received').text('none');
	}
}

function toggleNewNotifier() {
	if($('.settings-newnotifications').prop('checked')) {
		localStorage.newNotifier = true;
		$('.new-notifier-settings').removeClass('disabled');
		$('.new-notifier-settings input').attr('disabled', false);
	} else {
		localStorage.newNotifier = false;
		$('.new-notifier-settings').addClass('disabled');
		$('.new-notifier-settings input').attr('disabled', true);
	}
}

function updateDisplayTime() {
	var value = parseInt($('.settings-displaytime').val(), 10);
	if(isNaN(value)) {
		$('.settings-displaytime').val(localStorage.displayTime);
	} else {
		localStorage.displayTime = value;
	}
	// Update config
	nwNotify.setConfig({ displayTime: localStorage.displayTime * 1000});
}

function updateMaxConcNotifications() {
	var value = parseInt($('.settings-maxconcurrent').val(), 10);
	debug.log(value, typeof value, NaN, null);
	if(isNaN(value)) {
		$('.settings-maxconcurrent').val(localStorage.maxConcurrentNotifications);
	} else {
		localStorage.maxConcurrentNotifications = value;
	}
	// Update config
	nwNotify.setConfig({ maxVisibleNotifications: localStorage.maxConcurrentNotifications });
}

// Login to Pushover
$(document).ready(function() {
	// win.showDevTools();
	// Show app-container
	$('.app-container').removeClass('hide');
	// Setup tobpar buttons
	$('.status-button').on('click', showStatus);
	$('.close-button').on('click', hideWindow);
	$('.info-button').on('click', showInfo);
	$('.settings-button').on('click', showSettings);
	// Setup dev-tools button
	$('.show-devtools-button').on('click', function() {
		win.showDevTools();
	});
	// Setup show log file folder
	$('.open-log-folder').on('click', function() {
		gui.Shell.showItemInFolder(debug.getLogFilePath());
	});
	// Setup registration link
	$('.create-account-link').on('click', function() {
		gui.Shell.openExternal('https://pushover.net/login');
	});
	// Init tooltips
	$('[data-toggle="tooltip"]').tooltip();
	// Set initial connection status to disconnected
	connectionStatus(CONN_DISCONNECTED);
	updateSyncStatus();

	// Github link
	$('.github-link').on('click', function() {
		gui.Shell.openExternal('https://github.com/cgrossde/Pullover');
	});
	// Issue link
	$('.github-issue-link').on('click', function() {
		gui.Shell.openExternal('https://github.com/cgrossde/Pullover/issues');
	});
	// App version
	$('.info-version').text(packageInfo.version);

	//
	// Settings
	//

	// Run on startup
	$('.settings-startup').on('change', runOnStartupToggle);

	// Update check - always check for updates!!
	versionCheck();

	// New notifier (autoenable for windows if not yet set)
	if(localStorage.newNotifier === undefined) {
		if (os.platform().indexOf('win') === 0) {
			localStorage.newNotifier = true;
		}
	}

	if(localStorage.displayTime === undefined) {
		localStorage.displayTime = 7;
	}
	$('.settings-displaytime').val(localStorage.displayTime)
		.on('change', updateDisplayTime);
	nwNotify.setConfig({ displayTime: localStorage.displayTime * 1000 });

	if(localStorage.maxConcurrentNotifications === undefined) {
		localStorage.maxConcurrentNotifications = 7;
	}
	$('.settings-maxconcurrent').val(localStorage.maxConcurrentNotifications)
		.on('change', updateMaxConcNotifications);
	nwNotify.setConfig({ maxVisibleNotifications: localStorage.maxConcurrentNotifications });

	if(localStorage.newNotifier === 'true') {
		$('.settings-newnotifications').prop('checked', true);
	} else {
		$('.new-notifier-settings').addClass('disabled');
		$('.new-notifier-settings input').attr('disabled', true);
	}
	$('.settings-newnotifications').on('change', toggleNewNotifier);


	// If not logged in or device not registered, show app window
	// else just leave it in tray
	if (! isLoggedIn() || ! isDeviceRegistered()) {
		showWindow();
	}
	else {
		hideWindow();
	}

	// Set message counter
	updateMessagesReceived();

	hideModal();

	// Init openClient
	var options = {
		debug: true
	};
	if (isLoggedIn()) {
		options.secret = localStorage.secret;
		options.id = localStorage.id;
	}
	if (isDeviceRegistered()) {
		options.deviceId = localStorage.deviceId;
	}
	openClient = new OpenClient(options);

	// Register actions
	openClient.on('disconnected', function() {
		connectionStatus(CONN_DISCONNECTED);
	});
	openClient.on('connected', function() {
		connectionStatus(CONN_CONNECTED);
	});
	openClient.on('connectionTimeout', function() {
		connectionStatus(CONN_TIMEOUT);
		// Fetch messages after a timeout (usually due to sleep of mac)
		getMessages();
	});
	openClient.on('keepAlive', function() {
		connectionStatus(CONN_CONNECTED);
	});
	openClient.on('reconnecting', disableCountdown);
	openClient.on('reconnectLater', function(secondsTillReconnect) {
		enableCountdown(secondsTillReconnect);
	});
	openClient.on('message', getMessages);
	openClient.on('loginFailed', function() {
		debug.log('showReloginModal because of failed login');
		showReloginModal('Login failed',
		'Login was rejected by Pushover API. This device might have been removed from your account.</br>' +
		'Please try to relogin.', 'danger');
	});
	// Connect if we have the credentials, also get messages
	if (isLoggedIn() && isDeviceRegistered()) {
		getMessages();
		openClient.connect().catch(function(failure) {
			debug.log(failure);
		});
	}
	// Start App
	app();
});
