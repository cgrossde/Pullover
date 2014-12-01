var fs = require('fs');
var archiver = require('archiver');
var NwBuilder = require('node-webkit-builder');
var nwOptions = {
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
};
var nw = new NwBuilder(nwOptions);

// Log stuff you want
nw.on('log',  console.log);

// Build returns a promise
nw.build().then(function () {
    console.log('All done!');
    var deploymentPath = './bin/deployZip';
    var version = require('./src/package').version;
    // Zip files for deployment to sourcefourge
    if(! fs.existsSync(deploymentPath)){
        fs.mkdirSync(deploymentPath);
    }
    console.log('Start zipping ...');
    for(i = 0; i < nwOptions.platforms.length; i++) {
        // These will all run in parallel, make sure every
        // zip process has it's own JS scope
        (function() {
            var platform = nwOptions.platforms[i];
            var path = './bin/pullover/' + platform;
            var zipName = 'Pullover_' + version + '_' + platform + '.zip';

            var zipPath = deploymentPath + '/' + zipName;
            if(fs.existsSync(zipPath)){
                console.log(zipPath + ' already existed. Deleting it.');
                fs.unlinkSync(zipPath);
            }
            var output = fs.createWriteStream(zipPath);
            var archive = archiver('zip');
            output.on('close', function () {
                console.log(zipName + ' done. ' + Math.floor(archive.pointer() / 1024 / 1024) + ' MB');
            });
            archive.on('error', function(err){
                throw err;
            });
            archive.pipe(output);
            archive.bulk([
                { expand: true, cwd: path, src: ['**'], dest: '.'}
            ]);
            archive.finalize();
        })();
    }
}).catch(function (error) {
    console.error(error);
});
