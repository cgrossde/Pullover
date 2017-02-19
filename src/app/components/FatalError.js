import React from 'react'
import { Row, Col, Button } from 'react-bootstrap'

import Debug from '../lib/debug'
import packageInfo from '../../package.json'
import { externalLinkHandler, quitApp, showItemInFolder } from '../nw/Window'

import './FatalError.scss'

const debug = Debug('FatalError')

const FatalError = React.createClass({
  displayName: 'FatalError',

  render() {
    return (
      <div className="fatalError">
        <Row>
          <Col md={8} mdOffset={2}>
            <h1 className="center-block">Fatal error occured</h1>
            <p><b>Sorry, something unexpected happened.</b></p>
            <p className="text-center">
              Please report this bug <a href="https://github.com/cgrossde/Pullover/issues/new"
                                        onClick={externalLinkHandler}>here</a> together with the Pullover log file:<br/>
              <a className="link" onClick={this.showLogsFolder}><code>{debug.getLogFilePath()}</code><br/>
              Click to open the log file folder.<br/></a>
              Please also add the Pullover version({packageInfo.version}) and the operating system you were using.
            </p>
            It is recommended to restart Pullover now<br/>
            <Button bsStyle="danger" onClick={this.exit}>Exit Pullover</Button>
          </Col>
        </Row>
      </div>
    )
  },

  showLogsFolder() {
    showItemInFolder(debug.getLogFilePath())
  },

  exit() {
    quitApp()
    process.exit(1)
  }

})

export default FatalError
