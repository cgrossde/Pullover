/**
 * Check for updates
 *
 * Also distinguish between pre-relases (branch develop) and stable releases
 */

import os from 'os'
import semver from 'semver'
import request from 'request'

import Debug from '../lib/debug'
import { showWindow } from '../nw/Window'
import packageInfo from '../../package.json'
import { transitionTo } from './Navigator'

const debug = Debug('UpdateCheck')
const stableRepoUrl = 'https://raw.githubusercontent.com/cgrossde/Pullover/master/src/package.json'
const developRepoUrl = 'https://raw.githubusercontent.com/cgrossde/Pullover/develop/src/package.json'
const userAgent = 'Pullover/' + packageInfo.version + ' (' + os.platform() + ' '
  + os.arch() + ' ' + os.release() + ')'
request.defaults({
  headers: { 'User-Agent': userAgent }
})

let remotePackageInfoCache = null

/**
 * Check for update and if found, show update info
 */
export function check() {
  debug.log('Check for update')
  fetchRemotePackageInfo((err, remotePackageInfo) => {
    if(err)
      return
    // Compare versions
    if (semver.gt(remotePackageInfo.version, packageInfo.version)) {
      debug.log('New version found: ', remotePackageInfo.version)
      // Transition to show new version
      transitionTo('/updateAvailable')
      showWindow()
    } else {
      debug.log('No update available', remotePackageInfo.version)
    }
  })
}

export function getCachedRemotePackageInfo() {
  return remotePackageInfoCache
}

/**
 * Get remotePackageInfo from cache or web
 *
 * @param callback
 * @returns {*}
 */
function fetchRemotePackageInfo(callback) {
  // Use caching, no need to make the same request twice
  if(remotePackageInfoCache !== null)
    return callback(null, remotePackageInfoCache)
  // Determine if stable or develop
  let repoUrl = stableRepoUrl
  if(packageInfo.version.match(/\-(alpha|beta|rc)\./) !== null)
    repoUrl = developRepoUrl
  // Run check and return promise
  request.get(repoUrl, (err, httpResponse, body) => {
    if (err)
      debug.log('Update check failed', err, err.stack)
    if (body !== undefined && body !== '') {
      var remotePackageInfo = JSON.parse(body)
      if (remotePackageInfo !== undefined) {
        remotePackageInfoCache = remotePackageInfo
        return callback(null, remotePackageInfo)
      }
    }
    return callback(new Error('Update check failed'), null)
  })
}