var fs = require('fs.extra');
var del = require('del');
var swig  = require('swig');
var async = require('async');
var appdmg = require('appdmg');
var program = require('commander');
var Promise = require('promise');
var archiver = require('archiver');
var NwBuilder = require('node-webkit-builder');
var Connection = require('ssh2');
var packageInfo = require('./src/package');
var childProcess = require('child_process');

var buildConf = require('./config/buildConf');
var dmgConf = require('./config/dmgConf');

// Console app
// build
program
    .version(packageInfo.version)
    .command('build')
    .description('Build binaries')
    .action(build);
// Create distributables .zip / .dmg
program
    .command('createDist')
    .description('Create distributables (.zip/.dmg)')
    .action(createDistributables);
// Upload to sourceforge
program
    .command('upload')
    .description('Upload to Sourceforge')
    .action(function() {
        deployToSourceforge(buildConf.deployDir, packageInfo.version)
        .then(function(files) {
            console.log('UPLOAD DONE');
            console.log('Updating README.md');
            updateReadme(files);
        });
    });
program
    .command('run')
    .description('Run app')
    .action(runApp);

// TEST Windows installer
program
    .command('winInst')
    .description('Windows installer')
    .action(createWindowsInstaller);

program.parse(process.argv);


function runApp() {
    var nw = new NwBuilder(buildConf.nwbuild);
    // Enable output to console
    nw.on('stdout', function(data) {process.stdout.write(data.toString()); });
    nw.on('stderr', function(data) {process.stdout.write(data.toString()); });
    return nw.run();
}

/**
 * Bundle App with node-webkit for different platforms
 * @return {promise}
 */
function build() {
    var nw = new NwBuilder(buildConf.nwbuild);
    console.log('BUILD...');
    // Log stuff you want
    nw.on('error',  console.log);

    // Build returns a promise
    return nw.build().then(function () {
        console.log('Build done.');
    }).catch(function (error) {
        console.log('BUILD PROCESS FAILED');
        console.error(error);
    });
}

/**
 * Create installer (.dmg/.exe/.zip) for different platforms
 * Mac can build for all three platforms. Install makensis (brew install makensis)
 * and wine first.
 *
 * @return {promise}
 */
function createDistributables() {
    return new Promise(function(resolve, reject) {
        var deploymentPath = buildConf.deployDir;
        var version = packageInfo.version;
        // Zip files for deployment to sourceforge
        if(! fs.existsSync(deploymentPath)){
            fs.mkdirSync(deploymentPath);
        }
        console.log('Start packaging for distribution ...');
        async.map(buildConf.nwbuild.platforms, function(platform, done) {
            var path = './bin/pullover/' + platform;
            // DMG?
            if(platform === 'osx') {
                createDMG().then(done);
                return;
            }
            // Windows installer?
            else if(platform === 'win') {
                createWindowsInstaller().then(done);
                return;
            }
            // Zip everything else
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
                done();
            });
            archive.on('error', function(err){
                throw err;
            });
            archive.pipe(output);
            archive.bulk([
                { expand: true, cwd: path, src: ['**'], dest: '.'}
            ]);
            archive.finalize();
        }, function(err) {
            // All zipped
            console.log('ALL DONE');
            resolve();
        });
    }).catch(function (error) {
        console.log('DIST CREATION PROCESS FAILED');
        console.error(error);
        console.log(error.stack);
    });
}




/**
 * Upload files in localDir to remote dir
 * deployToSourceforge('./bin/deployZip', '0.x.x', options);
 *
 * @param  {string} localDir  './some/Dir'
 * @param  {string} remoteDir 'dirName' only first level supported
 * @param  {object} options   Connection info
 * @return {promise}
 */
function deployToSourceforge(localDir, remoteDir) {
    var conn = new Connection();
    var files;
    return new Promise(function(resolve, reject) {
        remoteDir = '/home/pfs/p/'+buildConf.sourceforge.project+'/' + remoteDir;
        conn.on('ready', function() {
            console.log('Connection :: ready');
            // Init SFTP
            conn.sftp(function(err, sftp) {
                if (err) console.log(err);
                // Create dir and ignore error (dir already exists)
                sftp.mkdir(remoteDir, function(err) {
                    if (err) console.log('Dir already exists', err);
                    else console.log('Dir created');
                    // Upload files
                    files = fs.readdirSync(localDir);
                    async.eachSeries(files, function(file, callback) {
                        console.log('Uploading file: ', localDir + '/' + file);
                        sftp.fastPut(localDir + '/' + file, remoteDir + '/' + file, callback);
                    }, function(err) {
                        if (err) console.log('Upload error:', err);
                        console.log('Upload done');
                        sftp.end();
                        resolve(files);
                    });
                });
            });
        }).connect(buildConf.sourceforge);
    }).then(function(result) {
        conn.end();
        return result;
    });
}

/**
 * Update readme with links to latest release downloads
 * @param  {array} files Filenames
 * @return {promise}
 */
function updateReadme(files) {
    return new Promise(function(resolve, reject) {
        if(files === undefined || files.length === 0) return;
        var downloads = [];
        // URLs: https://sourceforge.net/projects/pullover/files/0.1.2/Pullover_0.1.2_win.zip/download
        //       https://sourceforge.net/projects/[PROJECT]/files/[VERSION]/[FILENAME]/download
        var baseURL = "https://sourceforge.net/projects/" +
                        buildConf.sourceforge.project +
                        "/files/" +
                        packageInfo.version + '/';

        function getPlatformName(file) {
            if(/_win/.test(file)) return "Windows";
            else if (/_osx/.test(file)) return "Mac OS 10.8+";
            else if (/_linux32/.test(file)) return "Linux x32";
            else if (/_linux64/.test(file)) return "Linux x64";
            else return "Unkown";
        }

        // Build downloads array
        for(i = 0; i < files.length; i++) {
            var file = files[i];
            var download = {
                fileName: file,
                url: baseURL + file + '/download',
                platformName: getPlatformName(file)
            };
            downloads.push(download);
        }

        // Template
        var template = swig.compileFile('./res/README.md.tpl');
        var templateVars = {
            downloads: downloads.reverse(),
            version: packageInfo.version
        };
        // Write new readme
        fs.writeFile('./README.md', template(templateVars), function(err) {
            if(err) reject(err);
            resolve();
        });
    });
}

/**
 * Create a Mac .dmg
 * @return {promise}
 */
function createDMG() {
    return new Promise(function(resolve, reject) {
        var targetPath = buildConf.deployDir + '/Pullover.dmg';
        if(fs.existsSync(targetPath)){
            console.log(targetPath + ' already existed. Deleting it.');
            fs.unlinkSync(targetPath);
        }
        var ee = appdmg('config/dmgConf.json', targetPath);
        ee.on('finish', function () {
            console.log('Pullover.dmg done. ' + Math.floor(fs.statSync(targetPath).size / 1024 / 1024) + ' MB');
            resolve();
        });

        ee.on('error', function (err) {
            console.log('ERROR creating DMG', err);
            reject(err);
        });
    });
}

/**
 * Create a windows installer,
 * wine and makensis needed
 * @return {promise}
 */
function createWindowsInstaller() {
    return new Promise(function(resolve, reject) {
        var buildDir = './bin/tmp';
        var filename = 'Pullover_' + packageInfo.version + '_Installer.exe';
        if(fs.existsSync(buildDir)){
            // Clear tmp dir
            del([buildDir], createWindowsInstaller);
            return;
        } else {
            fs.mkdirSync(buildDir);
        }

        // Create installer template
        var template = swig.compileFile('./res/windowsInstaller/windowsInstaller.nsis.tpl');
        var templateVars = {
            name: packageInfo.name,
            prettyName: 'Pullover',
            version: packageInfo.version,
            src: "../pullover/win",
            dest: "../deploy/" + filename,
            icon: "../../res/icon.ico",
            setupIcon: "../../res/icon.ico",
            banner: "../../res/windowsInstaller/winInst_header.bmp"
        };
        // Copy icon to win source
        if(! fs.existsSync('./bin/pullover/win/icon.ico')){
            fs.writeFileSync('./bin/pullover/win/icon.ico', fs.readFileSync('./res/icon.ico'));
        }

        // Copy installer files
        fs.copyRecursive('./res/windowsInstaller', buildDir, function(err) {
            // Write installer instructions
            fs.writeFile('./bin/tmp/installer.nsis', template(templateVars), function(err) {
                if(err) reject(err);
                // Note: NSIS have to be added to PATH!
                var nsis = childProcess.spawn('makensis', ['./bin/tmp/installer.nsis']);
                //nsis.stdout.pipe(process.stdout);
                nsis.stdout.on('data', function() { process.stdout.write('.')});
                nsis.stderr.pipe(process.stderr);
                nsis.on('close', function () {
                    console.log("\nWindows installer done");
                    // Clear tmp and return
                    del([buildDir], resolve);
                });
            });
        });
    });
}
