import React from 'react'
import { Col, Input, Row } from 'react-bootstrap'

import Window, { resizeApp, showItemInFolder } from '../../nw/Window'
import Settings from '../../services/Settings'
import AnonymousUsageTracking from './AnonymousUsageTracking'
import MaxNotificationQueue from './MaxNotificationQueue'
import NotificationSounds from './NotificationSounds'

import Debug from '../../lib/debug'
import './Settings.scss'
import Analytics from '../../services/Analytics'

var debug = Debug('SettingsComponent')

class SettingsComponent extends React.Component {
  constructor() {
    super()
    this.state = Settings.getAll()
    // Bind to make clicks work
    this.toggleRunOnStartup = this.toggleRunOnStartup.bind(this)
    this.updateDefaultSound = this.updateDefaultSound.bind(this)
    this.updateState = this.updateState.bind(this)
    this.toggleAnalytics = this.toggleAnalytics.bind(this)
  }

  // Subscribe to Settings changes
  componentDidMount() {
    Analytics.page('Settings')
    Settings.on('change', this.updateState)
    // Resize window
    resizeApp(Settings.get('windowWidth'), 360)
  }

  // Unsubscribe before unmounting component
  componentWillUnmount() {
    Settings.removeListener('change', this.updateState)
    // Revert to old size
    resizeApp(Settings.get('windowWidth'), Settings.get('windowHeight'))
  }

  // Update state
  updateState(event) {
    const partialUpdate = {}
    partialUpdate[event.key] = event.value
    this.setState(partialUpdate)
  }

  render() {
    let runOnStartup = ''
    if (Settings.runOnStartupSupported()) {
      runOnStartup = (
        <div>
          <Row>
            <Col xs={8}>
              <b className="link" onClick={this.toggleRunOnStartup}>Run on startup</b>
            </Col>
            <Col xs={4}>
              <input type="checkbox" readOnly checked={this.state.runOnStartup} onClick={this.toggleRunOnStartup}/>
            </Col>
          </Row>
          <hr/>
        </div>
      )
    }

    return (
      <div>
        <Row>
          <Col md={8} mdOffset={2}>
            <h1 className="center-block">Settings</h1>
            <Row className="Settings">
              <Col xs={10} xsOffset={1}>
                <hr/>
                {runOnStartup}
                <MaxNotificationQueue/>
                <hr/>
                <AnonymousUsageTracking collectAnonymousData={this.state.collectAnonymousData}
                                        toggleAnalytics={this.toggleAnalytics}/>
                <hr/>
                <NotificationSounds notificationSound={this.state.defaultSound}
                                    updateNotificationSound={this.updateDefaultSound}/>
                <hr/>
                <div className="text-center">
                  <span className="text-primary">
                    <a className="link" onClick={this.showDevTools}>Show dev tools</a>
                  </span> | <span className="text-primary">
                    <a className="link" onClick={this.showLogsFolder}>Open log file folder</a>
                  </span>
                </div>

              </Col>
            </Row>
          </Col>
        </Row>

      </div>
    )
  }

  toggleRunOnStartup() {
    Settings.set('runOnStartup', !this.state.runOnStartup)
  }

  updateDefaultSound(event) {
    const defaultSound = event.target.value
    Settings.set('defaultSound', defaultSound)
  }

  showLogsFolder() {
    showItemInFolder(debug.getLogFilePath())
  }

  showDevTools() {
    Window.showDevTools()
  }

  toggleAnalytics() {
    Settings.set('collectAnonymousData', !this.state.collectAnonymousData)
  }
}

export default SettingsComponent
