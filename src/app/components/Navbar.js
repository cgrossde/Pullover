import React from 'react'
import {Link} from 'react-router'
import {connect} from 'react-redux'
import {hideWindow} from '../nw/Window'

import './Navbar.scss'

const Navbar = React.createClass({
  displayName: 'Navbar',

  render() {
    const icon = (this.props.status === 'ONLINE') ? 'signal' : 'flash'
    const iconClass = 'glyphicon glyphicon-' + icon
    // Drag fix (top-fix + bottom-fix): https://github.com/nwjs/nw.js/issues/2375#issuecomment-73217446
    return (
      <div>
        <div id="top-fix"></div>
        <div className="titlebar">
          <img className="logo" src="images/logo.png"/>
          <div className="close-button" data-toggle="tooltip" data-placement="bottom" title="Send to tray">
            <span className="glyphicon glyphicon-remove" onClick={hideWindow}></span>
          </div>
          <div className="settings-button">
            <Link activeClassName="active" to="/settings"><span className="glyphicon glyphicon-cog"></span></Link>
          </div>
          <div className="about-button">
            <Link activeClassName="active" to="/about"><span className="glyphicon glyphicon-info-sign"></span></Link>
          </div>
          <div className="notifications-button">
            <Link activeClassName="active" to="/notifications"><span className="glyphicon glyphicon-list"></span></Link>
          </div>
          <div className="status-button">
            <Link activeClassName="active" to="/status"><span className={iconClass}></span></Link>
          </div>
        </div>
        <div id="bottom-fix"></div>
      </div>
    )
  }
})

function select(state) {
  return {
    status: state.pushover.connectionStatus
  }
}

export default connect(select)(Navbar)
