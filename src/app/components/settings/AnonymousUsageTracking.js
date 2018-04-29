import React from 'react'
import { Col, Input, Row } from 'react-bootstrap'
import Settings from '../../services/Settings'
import InfoBox from '../InfoBox'
import { externalLinkHandler } from '../../nw/Window'

export default class AnonymousUsageTracking extends React.Component {
  constructor() {
    super()
    this.state = {
      showInfoBox: false,
    }
    this.hideInfoBox = this.hideInfoBox.bind(this)
    this.showInfoBox = this.showInfoBox.bind(this)
  }

  hideInfoBox() {
    this.setState({ showInfoBox: false })
  }

  showInfoBox() {
    this.setState({ showInfoBox: true })
  }

  render() {
    return (
      <Row>
        <Col xs={8}>
          <b>Analytics</b> <span onClick={this.showInfoBox}
                                 className="infoboxIcon glyphicon glyphicon-question-sign"/>
          <InfoBox active={this.state.showInfoBox} close={this.hideInfoBox}
                   title="Analytics">
            Send anonymous usage data. This allows the developer to improve the app and be notified about common bugs.
            No personal information is sent. A detailed list of what information is collected when can be found
            &nbsp;<a className="github-issue-link"
                     href="https://github.com/cgrossde/Pullover/wiki/Analytics"
                     onClick={externalLinkHandler}>here</a>.
          </InfoBox>
        </Col>
        <Col xs={4}>
          <div className="form-group">
            <input type="checkbox" readOnly checked={this.props.collectAnonymousData}
                   onClick={this.props.toggleAnalytics}/>
            <span className="glyphicon glyphicon-remove form-control-feedback"/>
          </div>
        </Col>
      </Row>
    )
  }

  updateMaxNotificationQueue(event) {
    // Only update if a number, greater zero and different
    // from the current state
    const newMaxNotificationAmount = parseInt(event.target.value)
    if (!isNaN(newMaxNotificationAmount) && newMaxNotificationAmount > 0) {
      Settings.set('maxNotificationAmount', newMaxNotificationAmount)
      this.setState({ maxNotificationAmount: newMaxNotificationAmount })
    }
    // Allow an empty field for usability
    else {
      this.setState({ maxNotificationAmount: event.target.value })
    }
  }
}