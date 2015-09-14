import React, { Component } from 'react'
import { Link } from 'react-router'
import { hideWindow } from '../nw/Window'

import './Navbar.scss'

export default class Navbar extends Component {
  displayName: 'Navbar'

  render() {
    return (
      <div className="navbar">
        <img className="logo" src="images/logo.png"/>
        <div className="close-button" data-toggle="tooltip" data-placement="bottom" title="Send to tray">
          <span className="glyphicon glyphicon-remove" onClick={hideWindow}></span>
        </div>
        <div className="settings-button">
          <span className="glyphicon glyphicon-cog"></span>
        </div>
        <div className="about-button">
          <Link to="/about"><span className="glyphicon glyphicon-about-sign"></span></Link>
        </div>
        <div className="status-button">
          <Link to="/status"><span className="glyphicon glyphicon-flash"></span></Link>
        </div>
      </div>
    )
  }

}
