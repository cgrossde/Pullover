import React from 'react'
import { Col, Input, Row } from 'react-bootstrap'
import Settings from '../../services/Settings'
import InfoBox from '../InfoBox'

export default class MaxNotificationQueue extends React.Component {
  constructor() {
    super()
    this.state = {
      infoMaxNotificationQueue: false,
      maxNotificationAmount: Settings.get('maxNotificationAmount')
    }
    this.hideInfoMaxNotificationQueue = this.hideInfoMaxNotificationQueue.bind(this)
    this.showInfoMaxNotificationQueue = this.showInfoMaxNotificationQueue.bind(this)
    this.updateMaxNotificationQueue = this.updateMaxNotificationQueue.bind(this)
  }

  hideInfoMaxNotificationQueue() {
    this.setState({ infoMaxNotificationQueue: false })
  }

  showInfoMaxNotificationQueue() {
    this.setState({ infoMaxNotificationQueue: true })
  }

  render() {
    const formMaxNotificationClasses = (this.state.maxNotificationAmount === '')
      ? 'form-group has-feedback has-error' : 'form-group'
    return (
      <Row>
        <Col xs={8}>
          <b>Max. notifications queue</b> <span onClick={this.showInfoMaxNotificationQueue}
                                                className="infoboxIcon glyphicon glyphicon-question-sign"/>
          <InfoBox active={this.state.infoMaxNotificationQueue} close={this.hideInfoMaxNotificationQueue}
                   title="Max. notifications queue">
            If you don't use this computer very often, there is a chance that a lot of notifications queue up.
            With this setting you can limit the number of notifications shown. <br/>
            If you set a value of <code>10</code> and <code>50</code> notifications are due to be shown on this device,
            Pullover will only show the <b><code>10</code> most recent</b> notifications.<br/>
            <b>Default: </b><code>20</code>
          </InfoBox>
        </Col>
        <Col xs={4}>
          <div className={formMaxNotificationClasses}>
            <input type="input" maxLength="2" className="form-control smallInput"
                   value={this.state.maxNotificationAmount}
                   onChange={this.updateMaxNotificationQueue}/>
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