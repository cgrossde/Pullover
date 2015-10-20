// /**
//  * Handle logic to show notifications to user
//  */

// import nwNotify from 'nw-notify'
// nwNotify.setConfig({
//   appIcon: nwNotify.getAppPath() + 'images/icon.png'
// });

// // Notification function
// // Usage: notify('NFL-Release', 'Pats vs Broncos 720p usw', 'http://google.com', 'images/nfl3.png');
// export function notify(title, text, url, iconPath) {
//   if(localStorage.newNotifier === 'true') {
//     nwNotify.notify(title, text, url, iconPath);
//   } else {
//     nativeNotify(title, text, url, iconPath);
//   }
// }



// /**
//  * Use node webkits native notification function
//  */
// function nativeNotify(title, text, url, iconPath, retryOnError) {
//   retryOnError = (retryOnError !== undefined) ? retryOnError : true;
//   var options = {};
//   options.body = text;
//   if (iconPath) options.icon = iconPath;

//   var notice = new Notification(title, options);
//   notice.onerror = function(error) {
//     debug.log('ERROR displaying notification (retry=' + retryOnError + ')', error);
//     if (retryOnError) {
//       // Try one more time in 1 sec
//       setTimeout(function() {
//         debug.log('Notification retry');
//         nativeNotify(title, text, url, iconPath, false);
//       }, 1000);
//     }
//   };

//   if (url !== null) {
//     notice.onclick = function() {
//       gui.Shell.openExternal(url);
//     };
//   }
// }