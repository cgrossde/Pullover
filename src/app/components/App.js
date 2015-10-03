import React from 'react'
import { connect } from 'react-redux'

import './App.scss'
import Navbar from './Navbar'
import Login from './Login'
import DeviceRegistration from './DeviceRegistration'
import { pushoverStatusSelector } from '../selectors/PushoverSelectors'
import { connectToPushover } from '../services/ConnectionManager'

const App = React.createClass({
  displayName: 'App',

  render() {
    // Default: Show children which are managed by the router
    // and automatically set depending on the route
    // However should the user not be logged in or no
    // device is registered the corresponding form
    // will be shown always!
    let currentComponent = this.props.children
    const {isLoggedIn, isDeviceRegistered} = this.props

    // User logged in?
    if (! isLoggedIn) {
      currentComponent = ( <Login /> )
    }
    // Device registered?
    else if (! isDeviceRegistered) {
      currentComponent = ( <DeviceRegistration /> )
    }

    return (
      <div className="appContainer">
        <Navbar />
        <div className="contentContainer">
          {currentComponent}
        </div>
      </div>
    )
  },

  componentDidMount() {
    const {isLoggedIn, isDeviceRegistered} = this.props
    // Fetch new notifications on startup
    if (isLoggedIn && isDeviceRegistered) {
      connectToPushover()
    }
  }
})

// Connect to redux
export default connect(pushoverStatusSelector)(App)
