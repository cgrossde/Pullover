import React from 'react'
import { Row, Col, Table } from 'react-bootstrap'
import { openExternalLink } from '../nw/Window'
import packageInfo from '../../package.json'

const About = React.createClass({
  displayName: 'About',

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
                        onClick={openExternalLink}>Github cgrossde/pullover</a>
                    </td>
                  </tr>
                  <tr>
                    <th>Found a bug?</th>
                    <td><a className="github-issue-link"
                      href="https://github.com/cgrossde/Pullover/issues"
                      onClick={openExternalLink}>Report it here</a></td>
                  </tr>
                  <tr>
                    <th>Messages received</th>
                    <td className="messages-received">none</td>
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

export default About
