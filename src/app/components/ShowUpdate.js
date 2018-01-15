import React from 'react'
import { Col, Row } from 'react-bootstrap'

import { externalLinkHandler } from '../nw/Window'
import { getCachedRemotePackageInfo } from '../services/UpdateCheck'

class ShowUpdate extends React.Component {
  getInitialState() {
    return {
      remotePackageInfo: null
    }
  }

  render() {
    if (this.state.remotePackageInfo === null)
      return (<h1>No Updates</h1>)
    const releaseLink = 'https://github.com/cgrossde/Pullover/releases/tag/' + this.state.remotePackageInfo.version
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
  }

  componentDidMount() {
    this.setState({ remotePackageInfo: getCachedRemotePackageInfo() })
  }
}

export default ShowUpdate
