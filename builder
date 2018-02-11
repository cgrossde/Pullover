#!/usr/bin/env node
'use strict'
const fs = require('fs.extra')
const del = require('del')
const swig = require('swig')
const async = require('async')
const appdmg = require('appdmg')
const program = require('commander')
const Promise = require('promise')
const archiver = require('archiver')
const NwBuilder = require('nw-builder')
const Connection = require('ssh2')
const packageInfo = require('./src/package')
const childProcess = require('child_process')
const commanderTabTab = require('commander-tabtab')
const builderPackageInfo = require('./package')

const buildConf = require('./config/buildConf')

// Console app
program._name = './builder'
program.version(builderPackageInfo.version)
// build
program
  .command('build')
  .description('Build binaries')
  .action(build)
// Create distributables .zip / .dmg
program
  .command('createDist')
  .description('Create distributables (.zip/.dmg)')
  .action(createDistributables)
// Upload to sourceforge
program
  .command('upload')
  .description('Upload to Sourceforge')
  .action(() => {
    deployToSourceforge(buildConf.deployDir, packageInfo.version)
      .then(files => {
        console.log('UPLOAD DONE')
        console.log('Updating README.md')
        updateReadme(files)
      })
  })

// Update README
program
  .command('updateReadme')
  .description('Update README from template.')
  .action(() => {
    const files = [
      'Pullover_' + packageInfo.version + '.dmg',
      'Pullover_' + packageInfo.version + '_Installer.exe',
      'Pullover_' + packageInfo.version + '_linux32.zip',
      'Pullover_' + packageInfo.version + '_linux64.zip'
    ]
    updateReadme(files)
  })

program
  .command('run')
  .description('Run app')
  .action(runApp)

// Display info on how to enable tabcompletion
program.on('--help', () => {
  console.log('')
  console.log('  Tab-Completion:')
  console.log('')
  console.log('    To enable tab completion execute: source <(./builder completion)')
  console.log('    For permanent tab completion add the output of "./builder completion"')
  console.log('    to your .bashrc/.zshrc: ./builder completion >> ~/.zshrc')
  console.log('')
})

// Show help if invoked without cli options/command
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// Tab completion
commanderTabTab.init(program, './builder')

program.parse(process.argv)

// Show help if command didn't match
if (typeof program.args[0] !== 'object') {
  program.outputHelp()
}

function runApp() {
  const nw = new NwBuilder(buildConf.nwbuild)
  // Enable output to console
  nw.on('stdout', data => {
    process.stdout.write(data.toString())
  })
  nw.on('stderr', data => {
    process.stdout.write(data.toString())
  })
  nw.on('log', console.log)
  nw.run().catch((err) => {
    if (err.code === 'ENOTFOUND') {
      console.log('nwBuilder failed because there was no internet connection')
      console.log('Trying to run it manually with a cached version...')
      const nwjsPath = './cache/' + buildConf.nwbuild.version + '-sdk/osx64/nwjs.app/Contents/MacOS/nwjs'
      const nwjs = childProcess.spawn(nwjsPath, ['./dist'])
      nwjs.stdout.pipe(process.stdout)
      nwjs.stderr.pipe(process.stderr)
    }
  })

}

/**
 * Bundle App with node-webkit for different platforms
 * @return {promise}
 */
function build() {
  return new Promise((resolve, reject) => {
    const nw = new NwBuilder(buildConf.nwbuild)
    console.log('BUILD...')
    // Log stuff you want
    nw.on('log', console.log)

    /**
     * @todo  Still needed?
     */
    // Delete src/node_modules/ws/build to make it cross platform (there are fallbacks)
    del(['src/node_modules/ws/build']).then(() => {
      // Build returns a promise
      nw.build().then(() => {
        console.log('Build done.')
        resolve()
      }).catch(error => {
        console.log('BUILD PROCESS FAILED')
        console.error(error)
        reject()
      })
    })
  })
}

/**
 * Create installer (.dmg/.exe/.zip) for different platforms
 * Mac can build for all three platforms. Install makensis (brew install makensis)
 * and wine first.
 *
 * @return {promise}
 */
function createDistributables() {
  return new Promise((resolve, reject) => {
    const deploymentPath = buildConf.deployDir
    const version = packageInfo.version
    // Clear deploy folder
    del.sync(buildConf.deployDir)
    // Create deploy folder
    fs.mkdirSync(deploymentPath)
    console.log('Start packaging for distribution ...')
    async.map(buildConf.nwbuild.platforms, (platform, done) => {
      const path = './bin/pullover/' + platform
      // DMG?
      if (platform === 'osx64') {
        createDMG().then(done)
        return
      }
      // Windows installer?
      else if (platform === 'win32') {
        createWindowsInstaller().then(done)
        return
      }
      // Zip everything else
      const zipName = 'Pullover_' + version + '_' + platform + '.zip'

      const zipPath = deploymentPath + '/' + zipName
      if (fs.existsSync(zipPath)) {
        console.log(zipPath + ' already existed. Deleting it.')
        fs.unlinkSync(zipPath)
      }
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip')
      output.on('close', () => {
        console.log(zipName + ' done. ' + Math.floor(archive.pointer() / 1024 / 1024) + ' MB')
        done()
      })
      archive.on('error', err => {
        throw err
      })
      archive.pipe(output)
      archive.bulk([
        { expand: true, cwd: path, src: ['**'], dest: '.' }
      ])
      archive.finalize()
    }, err => {
      // All zipped
      console.log('ALL DONE, errors: ', err)
      resolve()
    })
  }).catch(error => {
    console.log('DIST CREATION PROCESS FAILED')
    console.error(error)
    console.log(error.stack)
  })
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
  console.log('Upload', localDir, remoteDir)
  const conn = new Connection()
  let files
  return new Promise((resolve, reject) => {
    remoteDir = '/home/pfs/p/' + buildConf.sourceforge.project + '/' + remoteDir
    conn.on('ready', () => {
      console.log('Connection :: ready')
      // Init SFTP
      conn.sftp((err, sftp) => {
        if (err) console.log(err)
        // Create dir and ignore error (dir already exists)
        sftp.mkdir(remoteDir, err => {
          if (err) console.log('Dir already exists', err)
          else console.log('Dir created')

          // Upload files
          files = fs.readdirSync(localDir)
          async.eachSeries(files, (file, callback) => {
            console.log('Uploading file: ', localDir + '/' + file)
            sftp.fastPut(localDir + '/' + file, remoteDir + '/' + file, callback)
          }, err => {
            if (err) console.log('Upload error:', err)
            console.log('Upload done')
            sftp.end()
            resolve(files)
          })
        })
      })
    }).connect(buildConf.sourceforge.sftp)
  }).then(result => {
    conn.end()
    return result
  })
}

/**
 * Update readme with links to latest release downloads
 * @param  {array} files Filenames
 * @return {promise}
 */
function updateReadme(files) {
  return new Promise((resolve, reject) => {
    if (files === undefined || files.length === 0) return
    const downloads = []
    // URLs: https://sourceforge.net/projects/pullover/files/0.1.2/Pullover_0.1.2_win.zip/download
    //       https://sourceforge.net/projects/[PROJECT]/files/[VERSION]/[FILENAME]/download
    const baseURL = 'https://sourceforge.net/projects/' +
      buildConf.sourceforge.project +
      '/files/' +
      packageInfo.version + '/'

    function getPlatformName(file) {
      if (/\.exe/.test(file)) return 'Windows x32'
      else if (/\.dmg/.test(file)) return 'Mac OS 10.8+ x64'
      else if (/_linux32/.test(file)) return 'Linux x32'
      else if (/_linux64/.test(file)) return 'Linux x64'
      else return 'Unkown'
    }

    // Build downloads array
    for (let i = 0; i < files.length; i++) {
      var file = files[i]
      const download = {
        fileName: file,
        url: baseURL + file + '/download',
        platformName: getPlatformName(file)
      }
      downloads.push(download)
    }

    // Template
    const template = swig.compileFile('./res/README.md.tpl')
    const templateVars = {
      downloads: downloads.reverse(),
      version: packageInfo.version
    }
    // Write new readme
    fs.writeFile('./README.md', template(templateVars), err => {
      if (err) reject(err)
      resolve()
    })
  })
}

/**
 * Create a Mac .dmg
 * @return {promise}
 */
function createDMG() {
  return new Promise((resolve, reject) => {
    const targetPath = buildConf.deployDir + '/Pullover_' + packageInfo.version + '.dmg'
    if (fs.existsSync(targetPath)) {
      console.log(targetPath + ' already existed. Deleting it.')
      fs.unlinkSync(targetPath)
    }
    const ee = appdmg({ source: 'config/dmgConf.json', target: targetPath })
    ee.on('finish', () => {
      console.log('Pullover_' + packageInfo.version + '.dmg done. ' + Math.floor(fs.statSync(targetPath).size / 1024 / 1024) + ' MB')
      resolve()
    })
    // Debugging
    // ee.on('progress', console.log)
    ee.on('error', err => {
      console.log('ERROR creating DMG', err)
      reject(err)
    })
  })
}

/**
 * Create a windows installer,
 * wine and makensis needed
 * @return {promise}
 */
function createWindowsInstaller() {
  return new Promise((resolve, reject) => {
    const buildDir = './bin/tmp'
    const filename = 'Pullover_' + packageInfo.version + '_Installer.exe'
    if (fs.existsSync(buildDir)) {
      // Clear tmp dir
      del([buildDir], createWindowsInstaller)
      return
    } else {
      fs.mkdirSync(buildDir)
    }

    // Create installer template
    const template = swig.compileFile('./res/windowsInstaller/windowsInstaller.nsis.tpl')
    const templateVars = {
      name: packageInfo.name,
      prettyName: 'Pullover',
      version: packageInfo.version,
      src: '../pullover/win32',
      dest: '../deploy/' + filename,
      icon: '../../res/icon.ico',
      setupIcon: '../../res/icon.ico',
      banner: '../../res/windowsInstaller/winInst_header.bmp'
    }
    // Copy icon to win source
    if (!fs.existsSync('./bin/pullover/win32/icon.ico')) {
      fs.writeFileSync('./bin/pullover/win32/icon.ico', fs.readFileSync('./res/icon.ico'))
    }

    // Copy installer files
    fs.copyRecursive('./res/windowsInstaller', buildDir, err => {
      if (err) console.log(err)
      // Write installer instructions
      fs.writeFile('./bin/tmp/installer.nsis', template(templateVars), err => {
        if (err) reject(err)
        // Note: NSIS have to be added to PATH!
        const nsis = childProcess.spawn('makensis', ['./bin/tmp/installer.nsis'])
        //nsis.stdout.pipe(process.stdout);
        nsis.stdout.on('data', () => {
          process.stdout.write('.')
        })
        nsis.stderr.pipe(process.stderr)
        nsis.on('close', () => {
          console.log('\nWindows installer created')
          if (buildConf.codeSigning.win === true) {
            console.log('Codesigning windows installer')
            // Sign installer
            const signInstall = childProcess.spawn('signcode',
              ['-spc', 'res/cert.spc',
                '-v', 'res/cert.pvk',
                '-a', 'sha1', '-$', 'individual',
                '-i', 'https://github.com/cgrossde/Pullover',
                '-t', 'http://timestamp.verisign.com/scripts/timstamp.dll',
                '-tr', '10',
                'bin/deploy/' + filename
              ])
            signInstall.stdout.on('data', data => {
              process.stdout.write(data)
              // It's a hack -.-
              if (data.toString().indexOf('.pvk:') !== -1) {
                console.log('Entering password')
                signInstall.stdin.write(buildConf.certPassword + '\n')
              }

            })
            signInstall.stderr.pipe(process.stdout)
            signInstall.on('close', () => {
              console.log('Installer signed')
              // Clear tmp and return
              del([buildDir, 'bin/deploy/' + filename + '.bak'], resolve)
            })
          } else {
            // Clear tmp and return
            del([buildDir, 'bin/deploy/' + filename + '.bak'], resolve)
          }
        })
      })
    })
  })
}