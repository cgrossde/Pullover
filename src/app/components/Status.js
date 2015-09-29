import React from 'react'
import { connect } from 'react-redux'
import { Row, Col, Table } from 'react-bootstrap'

import store from '../services/Store'
import { logout } from '../actions/Pushover'
import { pushoverStatusSelector } from '../selectors/PushoverSelectors'

const Status = React.createClass({
  displayName: 'Status',

  render() {
    return (
      <Row>
        <Col md={8} mdOffset={2}>
          <h1 className="center-block">Status</h1>
          <Row>
            <Col xs={10} xsOffset={1}>
              <Table>
                <tbody>
                  <tr>
                    <th>Logged in</th>
                    <td>
                      {this.props.userEmail} (<a href="#" onClick={this.logout} alt="Logout">Logout</a>)
                    </td>
                  </tr>
                  <tr>
                    <th>Device registered</th>
                    <td>{this.props.deviceName}</td>
                  </tr>
                  <tr>
                    <th>Last sync</th>
                    <td></td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td></td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  },

  logout() {
    store.dispatch(logout())
  }
})

export default connect(pushoverStatusSelector)(Status)
