import React, { Component } from 'react'
import { Link } from 'react-router'

import './Navbar.scss'

export default class Navbar extends Component {
  displayName: 'Navbar'

  render() {
    return (
      <div className="navbar">
        <img className="logo" src="images/logo.png"/>
        <div className="close-button" data-toggle="tooltip" data-placement="bottom" title="Send to tray">
          <span className="glyphicon glyphicon-remove"></span>
        </div>
        <div className="settings-button">
          <span className="glyphicon glyphicon-cog"></span>
        </div>
        <div className="info-button">
          <span className="glyphicon glyphicon-info-sign"></span>
        </div>
        <div className="status-button">
          <span className="glyphicon glyphicon-flash"></span>
        </div>
      </div>
    )
  }
}
