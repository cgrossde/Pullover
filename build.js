var NwBuilder = require('node-webkit-builder');
var nw = new NwBuilder({
    platforms: ['osx', 'win', 'linux32', 'linux64'],
    files: './src/**/**', // use the glob format
    buildDir: './bin',
    macIcns: './res/icon.icns',
    macCredits: './res/credits.html',
    winIco: './res/icon.ico',
    macPlist: {
    	CFBundleIdentifier: 'de.chris-labs.pullover',
    	CFBundleDisplayName: 'Pullover',
    	CFBundleName: 'Pullover'
    }
});

// Log stuff you want
nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
   console.log('All done!');
}).catch(function (error) {
    console.error(error);
});
