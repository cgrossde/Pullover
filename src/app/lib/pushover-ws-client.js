/**
 * Opens a web socket to pushover service for
 * live notification updates
 *
 * Emits the following events:
 *  - error: If the connection fails or the command is not recognized
 *  - close: Once the connection got closed
 *  - notification: For new notifications
 *  - loginFailed: If the endpoint returns an error
 *  - requestedReconnect: If the endpoint requests a reconnect
 *  - keepAlive: For every keep alive message
 *  - timeout: If we receive no reaction within 90 sek
 */

'use strict'
import _ from 'lodash'
import os from 'os'
import WebSocket from 'ws'
import { EventEmitter } from 'events'

import Debug from '../lib/debug'
import packageInfo from '../../package.json'

const userAgent = 'Pullover/' + packageInfo.version + ' (' + os.platform() + ' '
  + os.arch() + ' ' + os.release() + ')'
var debug = Debug('PushoverWSClient')


class OpenClientWS extends EventEmitter {

  constructor(options) {
    // Init eventemitter
    super()
    // Setup options
    this.options = _.defaults(options, {
      userSecret: null,
      deviceId: null,
      webSocketEndpoint: 'wss://client.pushover.net/push:443'
    })

    this.socket = null
    // If we receive no interaction within 70 sek
    // => TIMEOUT
    this.timeoutInterval = null
    this.timeoutSpan = 1000 * 70
    this.lastInteraction = null
    // Otherwise we run into a loop with this.socket.on('error', handleSocketError)
    this.handleSocketError = this.handleSocketError.bind(this)
  }

  connect() {
    try {
      this.socket = new WebSocket(this.options.webSocketEndpoint)
    } catch (e) {
      debug.log('Caught WS error on connect', e)
      this.handleSocketError(e)
      return
    }
    // Timeout check
    this.lastInteraction = new Date()
    this.timeoutInterval = setInterval(this.checkTimeout.bind(this), this.timeoutSpan)
    // Login once socket opened
    this.socket.on('open', () => {
      debug.log('Connected')
      try {
        this.socket.send('login:' + this.options.deviceId + ':' + this.options.userSecret, (err) => {
          if (err) {
            debug.log('Callback returned WS error on send', err)
            this.handleSocketError(err)
          }
        })
      } catch (e) {
        debug.log('Caught WS error on send', e)
        this.handleSocketError(e)
      }
    })
    // Handle incoming data
    this.socket.on('message', (data) => {
      let command
      try {
        command = data.toString('utf8')
      }
      catch (err) {
        const error = new Error('Error parsing incoming data from websocket')
        error.name = 'WebsocketError'
        error.cause = err
        this.emit('error', error)
        debug.log(error)
        return
      }
      this.parseCommand(command)
    })
    // Notify of close
    this.socket.on('close', () => {
      this.emit('close')
      debug.log('Socket closed')
    })
    // Notify of error
    this.socket.on('error', this.handleSocketError)
  }

  checkTimeout() {
    const now = new Date()
    const diff = now.getTime() - this.lastInteraction.getTime()
    if (diff + 100 > this.timeoutSpan) {
      debug.log('Socket timed out')
      this.emit('timeout')
    }
  }

  handleSocketError(err) {
    this.emit('error', err)
    debug.log('Socket error: ', err)
  }

  disconnect() {
    if (this.socket !== null) {
      this.socket.close()
      this.socket = null
    }
    clearInterval(this.timeoutInterval)
  }

  parseCommand(command) {
    this.lastInteraction = new Date()
    // New messages
    if (command === '!') {
      debug.log('notification')
      this.emit('notification')
    }
    // Login possibly denied
    else if (command === 'E') {
      debug.log('Login failed')
      this.emit('loginFailed')
    }
    // Reconnect
    else if (command === 'R') {
      debug.log('Endpoint requested reconnect')
      this.emit('requestedReconnect')
    }
    // Keep alive
    else if (command === '#') {
      this.emit('keepAlive')
    }
    else {
      debug.log('Unkown command', command)
      var error = new Error('Received unknown command')
      error.name = 'WebsocketError'
      error.cause = command
      this.emit('error', error)
    }
  }

  getStatus() {
    if (this.socket !== null) {
      return this.socket.readyState
    }
    return WebSocket.CLOSED
  }
}

export default OpenClientWS
