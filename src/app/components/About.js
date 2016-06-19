import React from 'react'
import { Row, Col, Table } from 'react-bootstrap'
import { externalLinkHandler } from '../nw/Window'
import packageInfo from '../../package.json'
import { check } from '../services/UpdateCheck'
import NotificationDB from '../services/NotificationDB'

const About = React.createClass({
  displayName: 'About',

  getInitialState() {
    return {
      count: 0
    }
  },

  render() {
    return (
      <Row>
        <Col md={8} mdOffset={2}>
          <h1 className="center-block">About Pullover</h1>
          <span>The unofficial Pushover desktop client</span>
          <Row>
            <Col xs={10} xsOffset={1}>
              <Table>
                <tbody>
                  <tr>
                    <th>Version</th>
                    <td className="info-version">{packageInfo.version}</td>
                  </tr>
                  <tr>
                    <th>Homepage</th>
                    <td>
                      <a className="github-link" href="https://github.com/cgrossde/Pullover"
                        onClick={externalLinkHandler}>Github cgrossde/pullover</a>
                    </td>
                  </tr>
                  <tr>
                    <th>Found a bug?</th>
                    <td><a className="github-issue-link"
                      href="https://github.com/cgrossde/Pullover/issues"
                      onClick={externalLinkHandler}>Report it here</a></td>
                  </tr>
                  <tr>
                    <th>Messages received</th>
                    <td className="messages-received">{this.state.count}</td>
                  </tr>
                </tbody>
              </Table>

              <a className="link" onClick={check}>Check for updates</a>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  },

  componentDidMount() {
    // Get count and keep it updated
    NotificationDB
      .count()
      .then((count) => {
        this.setState({ count })
      })
    NotificationDB.on('newCount', this.updateCount)
  },

  updateCount(count) {
    this.setState({ count })
  },

  componentWillUnmount() {
    NotificationDB.removeListener('newCount', this.updateCount)
  }
})


export default About
