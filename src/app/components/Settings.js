import os from 'os'
import React from 'react'
import moment from 'moment'
import Autorun from 'autorun'
import { connect } from 'react-redux'
import { Row, Col, Table } from 'react-bootstrap'

import store from '../services/Store'
import {
  setDisplayTime,
  enableNativeNotifications,
  disableNativeNotifications,
  setMaxNotificationAmount
} from '../actions/Settings'

const Settings = React.createClass({
  displayName: 'Settings',

  render() {
    const runOnStartup
    if(Autorun.prototype.isPlatformSupported()) {
      const runOnStartupChecked = (this.props.runOnStartup) ? 'checked' : ''
      runOnStartup = (
        <tr>
          <th>Run on startup</th>
          <td>
            <input type="checkbox" {runOnStartupChecked}/>
          </td>
        </tr>
      )
    }

    return (
      <Row>
        <Col md={8} mdOffset={2}>
          <h1 className="center-block">Settings</h1>
          <Row>
            <Col xs={10} xsOffset={1}>
              <Table className="table">
                <tbody>
                  {runOnStartup}
                  <tr>
                    <th>Use notifications for Windows</th>
                    <td>
                      <input type="checkbox"/>
                    </td>
                  </tr>
                  <tr className='new-notifier-settings'>
                    <th>&nbsp;&nbsp;Display time (in sec)</th>
                    <td>
                      <input type="input" maxlength="2" className="form-control input-sm" />
                    </td>
                  </tr>
                  <tr clasSName='new-notifier-settings'>
                    <th>&nbsp;&nbsp;Maximum concurrent notifications</th>
                    <td>
                      <input type="input" maxlength="2" className="form-control input-sm" />
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <span className="text-primary">
                        Show dev tools
                      </span> | <span className="text-primary">
                        Open log file folder
                      </span>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }


})

// Which props should be injected from redux store?
function select(state) {
  return state.settings
}

export default connect(select)(Settings)
