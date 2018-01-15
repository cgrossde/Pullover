import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { Col, Row, Table } from 'react-bootstrap'

import store from '../services/Store'
import { logout } from '../actions/Pushover'
import { pushoverStatusSelector } from '../selectors/PushoverSelectors'

class Status extends React.Component {
  constructor() {
    super()
    this.state = {
      refreshInterval: null
    }
  }

  componentDidMount() {
    // Rerender every 30 sec to update time since last sync
    const refreshInterval = setInterval(this.render.bind(this), 1000*30)
    this.setState({
      refreshInterval: refreshInterval
    })
  }

  componentWillUnmount() {
    clearInterval(this.state.refreshInterval)
  }

  render() {
    let lastSync = 'never'
    let lastSyncClass = 'text-danger'
    if (this.props.latestSyncDate !== null) {
      lastSync = moment(parseInt(this.props.latestSyncDate))
      const date15minAgo = moment().subtract(15, 'minutes')
      lastSyncClass = (lastSync.isBefore(date15minAgo)) ? 'text-danger' : 'text-info'
      lastSync = lastSync.fromNow()
    }

    let connectionClass = (this.props.connectionStatus === 'ONLINE') ? 'text-success' : 'text-danger'
    return (
      <Row>
        <Col md={8} mdOffset={2}>
          <h1 className="center-block">Status</h1>
          <Row>
            <Col xs={10} xsOffset={1}>
              <Table>
                <tbody>
                  <tr>
                    <th>User</th>
                    <td>
                      <span className="text-info">{this.props.userEmail}</span> (<a href="#" onClick={this.logout} alt="Logout">Logout</a>)
                    </td>
                  </tr>
                  <tr>
                    <th>Device registered</th>
                    <td>
                      <span className="text-info">{this.props.deviceName}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Last sync</th>
                    <td><span className={lastSyncClass}>{lastSync}</span></td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td><span className={connectionClass}>{this.props.connectionStatus}</span></td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }

  logout() {
    store.dispatch(logout())
  }
}

export default connect(pushoverStatusSelector)(Status)
