import React from 'react'
import { Row, Col, Button } from 'react-bootstrap'

import Debug from '../lib/debug'
import Paths from '../services/Paths'
import packageInfo from '../../package.json'
import { externalLinkHandler } from '../nw/Window'
import { getCachedRemotePackageInfo } from '../services/UpdateCheck'

const debug = Debug('ShowUpdate')

const ShowUpdate = React.createClass({
  displayName: 'ShowUpdate',

  getInitialState() {
    return {
      remotePackageInfo: null
    }
  },

  render() {
    if(this.state.remotePackageInfo === null)
      return (<h1>No Updates</h1>)
    const releaseLink = "https://github.com/cgrossde/Pullover/releases/tag/" + this.state.remotePackageInfo.version
    return (
      <Row>
        <Col md={8} mdOffset={2}>
          <h1 className="center-block">Update available</h1>
          <p>
            Your version is <b>{packageInfo.version}</b><br/>
            New version is <b>{this.state.remotePackageInfo.version}</b>
            <br/>
            <br/>
            <a href={releaseLink} className="btn btn-success" onClick={externalLinkHandler}>Download now!</a>
          </p>
        </Col>
      </Row>
    )
  },

  componentDidMount() {
    this.setState({ remotePackageInfo: getCachedRemotePackageInfo() })
  }
})

export default ShowUpdate
