import React, { Component } from 'react'
import Navbar from './Navbar'

import './App.scss'

export default class App extends Component {
  displayName: 'App'
  render() {
    return (
      <div>
        <Navbar />
        <div className="appContainer">
          {this.props.children}
        </div>
      </div>
    )
  }
}
