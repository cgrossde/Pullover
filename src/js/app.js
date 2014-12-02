// Load library / modules
var os = require('os');
var obs = require('obs');
var gui = require('nw.gui');
var http = require('https');
var semver = require('semver');
var moment = require('moment');
var openClient = require('./lib/pushover-client');
var packageInfo = require('./package');

// Setup window, menubar and tray
var win = gui.Window.get();
var tray;
var uiComponents = [];

// To get push notifications
var webSocket = null;
var maxReconnects = 10;				// Avoid flooding the server
var curReconnects = 0;				// Reconnect counter
var reconnectWaitTime = 1000*60*5;	// Wait-time for next reconnect after maxReconnects was reached
var reconnectLater = false;			// Are we waiting for a reconnect?
var reconnectCountdown = null;
var lastConnect = null;			// Date of last reconnect
var connectionTimeout = 1000*35;	// After x seconds without keepAlive from server we asume
									// to be offline(updateStatus) and try to reconnect
var webSocketClosedByApp = false;			// Try to check if webSocket was closed because of invalid device
// Connection status
var CONN_DISCONNECTED = 0;
var CONN_CONNECTED = 1;
var CONN_TIMEOUT= 2;
var connectionStatus = obs.prop(CONN_DISCONNECTED);
connectionStatus.subscribe(updateSyncStatus);
var timeoutCheck = null;			// setTimeout after each interaction with server
var timeoutFunction = function() {
	console.log('CONNECTION TIMED OUT');
	connectionStatus(CONN_TIMEOUT);
	reconnectWebSocket();
};
var lastSync = obs.prop(localStorage.lastSync);	// Observable to store last sync date
var lastSyncUpdateLocalStorage = function(oldValue, newValue) {
	localStorage.sync = newValue;
	connectionStatus(CONN_CONNECTED);		// Everytime lastSync changes, we know there was an update
	console.log('lastSync changed', oldValue, newValue);
	// Timeoutcheck
	clearTimeout(timeoutCheck);
	timeoutCheck = setTimeout(timeoutFunction, connectionTimeout);
};
lastSync.subscribe(lastSyncUpdateLocalStorage);

// Get the minimize event
win.on('minimize', hideWindow);

// Handle CMD+W vs CMD+Q
win.on('close', hideWindow);

// No taskbar item
win.setShowInTaskbar(false);
win.setResizable(false);

// Mac allow CMD+C, CMD+V, CMD+W, ...
var nativeMenuBar = new gui.Menu({ type: "menubar" });
try {
	nativeMenuBar.createMacBuiltin("Pullover");
	win.menu = nativeMenuBar;
} catch (ex) {
	// Will fail on windows
	// console.log(ex.message);
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
var icon = (os.platform() == 'darwin') ? 'images/tray_mac.png' : 'images/tray.png';
tray = new gui.Tray({
	icon: icon
});

// Create tray menu items:
	// Separator
	var itemSeparator = new gui.MenuItem({ type: 'separator'});
	// Show status
	var itemStatus = new gui.MenuItem({ type: 'normal', label: 'Status' });
	itemStatus.on('click', function(){
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
	win.close(true);
}

// Notification function
// Usage: notify('NFL-Release', 'Pats vs Broncos 720p usw', 'http://google.com', 'images/nfl3.png');
function notify(title, text, url, iconPath, retryOnError) {
	var retryOnError = (retryOnError !== undefined) ? retryOnError : true;
	var options = {};
	options.body = text;
	if(iconPath) options.icon = iconPath;

	var notice = new Notification(title, options);
	notice.onerror = function(error) {
		console.log('ERROR displaying notification (retry='+retryOnError+')', error);
		if(retryOnError) {
			// Try one more time in 1 sec
			setTimeout(function() {
				console.log('Notification retry');
				notify(title, text, url, iconPath, false);
			}, 1000);
		}
	};

	if(url !== null) {
		notice.onclick = function(event) {
			gui.Shell.openExternal(url);
		};
	}
}

function showLogin() {
	if($('#login').is(':hidden')) {
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
			console.log('Login failed: ' + failed);
			showModal('Login failed', failed, 'danger');
			// Enable Loginbutton again
			$('.login-button').off().on('click', onClickFunction);
		});
	};
	$('.login-button').off().on('click', onClickFunction);
}

function showInfo() {
	if($('#info').is(':hidden')) {
		hideUiComponents();
		$('#info').fadeIn();
	}
}

function showDeviceRegistration() {
	if($('#deviceRegistration').is(':hidden')) {
		hideUiComponents();
		$('#deviceRegistration').fadeIn();
	}
	var onClickFunction = function() {
		$('.deviceRegistration-button').off();
		showSpinner();
		openClient.registerDevice({
			name: $('#devicename').val(),
			secret: localStorage.secret,
		}).then(function(success) {
			localStorage.deviceId = success.id;
			localStorage.deviceName = $('#devicename').val();
			hideModal();
			// Hand over to app again
			app();
		}, function(failed) {
			console.log(failed);
			showModal('Device registration failed', failed, 'danger');
			// Enable deviceRegistration-button again
			$('.deviceRegistration-button').off().on('click', onClickFunction);
		});
	};
	$('.deviceRegistration-button').off().on('click', onClickFunction);
}

function showStatus() {
	if($('#status').is(':hidden')) {
		hideUiComponents();
		$('#status').fadeIn();
	}
	// Toggle status button if not logged in or device registered
	if(! isLoggedIn() || ! isDeviceRegistered()) {
		$('.status-button').off().on('click', app);
	}
	// Show login status
	if(isLoggedIn()) {
		$('td.status-login').empty().text('Yes')
							.append(' (<span class="text-danger logout-button">Logout</span>)')
							.find('span.logout-button')
								.on('click', logout)
								.end()
							.addClass('text-success')
							.removeClass('text-danger');
	} else {
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
	if(isDeviceRegistered()) {
		$('td.status-device').empty().text(localStorage.deviceName)
							.addClass('text-success')
							.removeClass('text-danger');
	} else {
		$('td.status-device').addClass('text-danger')
							.removeClass('text-success');
		// If not logged in => show login first
		if(! isLoggedIn()) {
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
	// Update last sync
	var timeSinceLastSync = (lastSync() === undefined) ? 'never' : moment(lastSync()).fromNow();
	$('td.status-sync').addClass('text-primary').text(timeSinceLastSync);
	// Update connection status
	var classes = "text-danger text-warning text-success";
	if(connectionStatus() === CONN_CONNECTED) {
		setStatusOnline();
		$('td.status-connection').removeClass(classes)
								.addClass('text-success')
								.text('Connected');
	}
	else if(connectionStatus() === CONN_TIMEOUT) {
		setStatusOffline();
		// Allow reconnect if logged in and device registered
		if(isLoggedIn() && isDeviceRegistered()) {
			$('td.status-connection').removeClass(classes)
									.addClass('text-warning')
									.empty().append('<span class="reconnect-link>Timeout, click to reconnect</span>')
									.find('span.reconnect-link')
									.on('click', forceReconnect);
		} else {
			$('td.status-connection').removeClass(classes)
									.addClass('text-warning')
									.text('Timeout');
		}
	}
	else if(connectionStatus() === CONN_DISCONNECTED) {
		setStatusOffline();
		if(isLoggedIn() && isDeviceRegistered()) {
			$('td.status-connection').removeClass(classes)
									.addClass('text-danger')
									.empty().append('<span class="reconnect-link">Disconnected, click to reconnect</span>')
									.find('span.reconnect-link')
									.on('click', forceReconnect);
		} else {
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

function setStatusRefresh() {
	$('.status-button span').removeClass('glyphicon-signal glyphicon-flash')
							.addClass('glyphicon-refresh');
}

function setStatusOnline() {
	$('.status-button span').removeClass('glyphicon-flash glyphicon-refresh')
							.addClass('glyphicon-signal');
}

function getMessages() {
	console.log('getMessages - try request');
	openClient.getMessages({
		secret: localStorage.secret,
		device_id: localStorage.deviceId
	})
	.then(function(response) {
		console.log('getMessages - successful');
		lastSync(moment().toISOString());
		// OpenWebSocket if not already happened
		openWebSocket();
		// Parse response
		if(response.messages !== undefined && response.messages.length > 0) {
			console.log('New messages: ' + response.messages.length);
			// Send push notifications
			$(response.messages).each(function(index, message) {
				// function notify(title, text, url, iconPath) {
				var title = message.title || message.app;
				var url = (message.url) ? message.url : null;
				var iconPath = 'https://api.pushover.net/icons/' + message.icon + '.png';
				notify(title, message.message, url, iconPath, true);
			});
			// Acknowledge receiving messages
			var options = {
				lastMessageId: response.messages[response.messages.length-1].id,
				secret: localStorage.secret,
				device_id: localStorage.deviceId
			};
			openClient.acknowledgeMessage(options);
		}
	}, function(failed) {
		console.log(failed);
		connectionStatus(failed);
	});
}

function openWebSocket() {
	if(! isLoggedIn() || !isDeviceRegistered()) {
		console.log('ERROR: Tried to openWebSocket without login or deviceRegistration');
		return;
	}

	if (webSocket === null || webSocket.readyState === undefined || webSocket.readyState > 1) {
		lastConnect = moment().toISOString();
		curReconnects++;
		console.log('SOCKET: CREATE NEW');
		webSocketClosedByApp = false;
		webSocket = new WebSocket('wss://client.pushover.net/push:443');

		webSocket.onopen = function () {
			console.log('SOCKET: Connection opened');
			console.log('LOGGING IN');
			var loginToken = 'login:' + localStorage.deviceId + ':' + localStorage.secret;
			if(webSocket !== null && webSocket !== undefined && webSocket.readyState === 1) {
				webSocket.send(loginToken);
				lastSync(moment().toISOString());
			}
		};

		webSocket.onmessage = function(event) {
			var message;
			var reader = new FileReader();
			reader.addEventListener("loadend", function() {
				message = reader.result;
				console.log('SOCKET IN: ' + message);
				parseCommand(message);
			});
			reader.readAsText(event.data);
		};

		webSocket.onclose = function(event) {
			connectionStatus(CONN_DISCONNECTED);
			console.log('SOCKET CLOSED');
			webSocket = null;
			if(! webSocketClosedByApp) {
				console.log('Websocket was closed by API ENDPOINT !!! ');
				webSocketClosedByAPIEndpoint();
			} else {
				// Reconnect
				reconnectWebSocket();
			}
		};

		webSocket.onerror = function(event) {
			webSocketClosedByApp = true;
			connectionStatus(CONN_DISCONNECTED);
			console.log('SOCKET ERROR', event);
			webSocket = null;
			// Reconnect
			reconnectWebSocket();
		};
  	}
}

function webSocketClosedByAPIEndpoint() {
	// Notify user that he might have to relogin
	// and stop reconnects
	showModal('Login failed', 'Login was rejected by Pushover API. This device might have been removed from your account.</br>' +
		'Please try to relogin.', 'danger', [
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
	clearTimeout(reconnectLater);
	reconnectLater = false;
	closeWebSocket();
	// Show pushover window
	showWindow();
}


function tryReconnectLater(waitTime, laterFunction) {
	console.log('Reconnect later', waitTime);
	connectionStatus(CONN_DISCONNECTED);
	if(reconnectLater === false) {
		// Display reconnect countdown
		enableCountdown(waitTime);
		// Try again later
		reconnectLater = setTimeout(function() {
			disableCountdown();
			laterFunction();
			reconnectLater = false;
		}, waitTime);
	}
}

function enableCountdown(msRemaining) {
	function secToText(secRemaining) {
		var text = '';
		if(secRemaining > 60) {
			var min = Math.floor(secRemaining / 60);
			var sec = secRemaining % 60;
			text = min+'m '+sec+'s';
		} else {
			text = secRemaining + 's';
		}
		return text;
	}
	var secRemaining = Math.floor(msRemaining / 1000);
	disableCountdown();	// Just to be sure
	$('#status table tbody').append('<tr>' +
              '<th>Reconnect in</th>'+
              '<td class="status-reconnect">'+secToText(secRemaining)+'</td>' +
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

function forceReconnect() {
	// Disable countdown
	disableCountdown();
	clearTimeout(reconnectLater);
	reconnectLater = false;
	openWebSocket();
}

function closeWebSocket() {
	if (webSocket !== null) {
		webSocketClosedByApp = true;
		webSocket.close();
		webSocket = null;
	}
}

function reconnectWebSocket() {
	if(curReconnects <= maxReconnects) {
		console.log('Reconnect');
		secSinceLastConnect = (lastConnect === null) ? 1000 : moment().unix() - moment(lastConnect).unix();
		if(secSinceLastConnect < 10 && reconnectLater === false) {
			console.log('Reconnect later ... time since last: ', secSinceLastConnect);
			tryReconnectLater(10*1000, function() {
				closeWebSocket();
				openWebSocket();
			});
			return false;
		} else if(reconnectLater === false) {
			console.log('Reconnect later=False');
			closeWebSocket();
			openWebSocket();
			return true;
		} else {
			console.log('Already reconnecting');
			return false;
		}
	} else {
		if(reconnectLater === false) {
			tryReconnectLater(reconnectWaitTime, function(){
				console.log('Try again');
				curReconnects = 0;
				closeWebSocket();
				openWebSocket();
			});
		}
		return false;
	}
}

function parseCommand(message) {
	// New messages
	if(message === "!") {
		lastSync(moment().toISOString());
		getMessages();
	}
	// Reconnect
	else if(message === "R") {
		reconnectWebSocket();
	}
	// Keep alive
	else if(message === "#") {
		lastSync(moment().toISOString());
	} else {
		console.log('Unkown command: ', message);
	}
}


// Controls app-flow
var app = function() {
	// uiComponents
	uiComponents = ['#login', '#deviceRegistration', '#status', '#info'];
	hideUiComponents();
	// Toggle status button
	$('.status-button').off().on('click', showStatus);
	// Toggle info button
	$('.info-button').off().on('click', showInfo);
	// Do we need to login?
	if(! isLoggedIn()) {
		$('.loggedIn').hide();
		showLogin();
	}
	// Is this device already registered?
	else if(! isDeviceRegistered()) {
		$('.loggedIn').show();
		showDeviceRegistration();
	}
	else {
		$('.loggedIn').show();
		showStatus();
		if(webSocket === null) {
			openWebSocket();
		}
	}
};

function isLoggedIn() {
	return (localStorage.secret !== undefined);
}

function isDeviceRegistered() {
	return (localStorage.deviceId !== undefined);
}

function logout() {
	disableCountdown();
	clearTimeout(reconnectLater);
	reconnectLater = false;
	closeWebSocket();
	localStorage.clear();
	lastSync(null);
	connectionStatus(CONN_DISCONNECTED);
	app();
}

function showSpinner() {
	$('#modal').hide().fadeIn();
	$('.modal-info').hide();
	$('.modal-spinner').fadeIn();
}

function showModal(title, text, type, addButtonArray) {
	$('.modal-additional-button').remove();
	var textClass = (type) ? 'modal-text text-'+type : 'modal-text';
	$('#modal').hide().fadeIn();
	$('.modal-info').show();
	$('.modal-spinner').hide();
	$('.modal-title').text(title);
	$('.modal-text').html(text).removeClass().addClass(textClass);
	$('.modal-button').off().on('click', hideModal);
	if(addButtonArray !== undefined) {
		$(addButtonArray).each(function(index, button) {
			$('.modal-button').parent()
			.append('<button type="button" class="btn btn-default modal-additional-button modal-additional-button'+index+'">'+button.text+'</button>')
			.find('.modal-additional-button'+index)
			.on('click', function() {
				button.func();
				hideModal();
			});
		});
	}
}

function hideModal() {
	$('#modal').fadeOut();
	$('.modal-info').hide();
	$('.modal-spinner').hide();
	$('.modal-additional-button').remove();
}

function versionCheck() {
	var repoUrl = "https://raw.githubusercontent.com/cgrossde/Pullover/master/package.json";
	http.get(repoUrl, function(res) {
		var body = '';

	    res.on('data', function(chunk) {
	        body += chunk;
	    });

	    res.on('end', function() {
	        var latestInfo = JSON.parse(body);
	        console.log("Got response: ", latestInfo);
	        if(semver.lt(packageInfo.version, latestInfo.version)) {
	        	notify('Pullver Update',
	        		'New Update available: v' + latestInfo.version + '. You are using v' + packageInfo.version,
	        		'https://github.com/cgrossde/Pullover'
	        	);
	        	$('.info-version').text(packageInfo.version + ' (outdated)')
	        	.parent().after('<tr>'+
                  '<th>Latest Version</th>'+
                  '<td>'+latestInfo.version+'</td>'+
                '</tr>');
	        }
	    });
	}).on('error', function(e) {
	      console.log("Version check failed: ", e);
	});
}

// Login to Pushover
$(document).ready(function() {
	// Show app-container
	$('.app-container').removeClass('hide');
	// Setup status button
	$('.status-button').on('click', showStatus);
	$('.status-exit-button').on('click', app);
	// Close button
	$('.close-button').on('click', hideWindow);
	// Setup dev-tools button
	$('.show-devtools-button').on('click', function() {
		win.showDevTools();
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

	// If not logged in or device not registered, show app window
	// else just leave it in tray
	if(! isLoggedIn || ! isDeviceRegistered()) {
		showWindow();
	}
	// Update checker
	versionCheck();
	hideModal();
	// Start App
	app();
});
