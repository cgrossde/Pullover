import React from 'react'
import { Col, Row } from 'react-bootstrap'

import Spinner from './Spinner'
import InfoBox from './InfoBox'
import Debug from '../lib/debug'
import Analytics from '../services/Analytics'
import store from '../services/Store'
import pushover from '../services/Pushover'
import { externalLinkHandler, showWindow } from '../nw/Window'
import { setUserData } from '../actions/Pushover'
import { maxLoginFailsReached, resetMaxLoginFails } from '../services/ConnectionManager'

import './Login.scss'

const debug = Debug('Login')

class Login extends React.Component {
  constructor() {
    super()
    this.state = {
      spinner: false,
      error: false,
      email: '',
      password: ''
    }

    this.closeMaxLoginFailInfo = this.closeMaxLoginFailInfo.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onChangeEmail = this.onChangeEmail.bind(this)
    this.onChangePassword = this.onChangePassword.bind(this)
  }

  componentDidMount() {
    Analytics.page('Login')
  }

  render() {
    const formGroupClass = (this.state.error) ? 'form-group has-error' : 'form-group'
    const infoClass = (this.state.error) ? 'text-danger' : 'text-muted'
    const infoText = (this.state.error) ? this.state.error : 'You will need to do this only once.'
    let showMaxLoginFailInfo = maxLoginFailsReached()

    return (
      <div className="login">
        <Spinner active={this.state.spinner}/>
        <Row>
          <Col md={8} mdOffset={2}>
            <h1 className="center-block">Login to Pushover</h1>
            <p className={infoClass}>{infoText}</p>
            <form className="form-horizontal" role="form">
              <div className={formGroupClass}>
                <Col xs={8} xsOffset={2}>
                  <label htmlFor="email" className="control-label hide">Email</label>
                  <input type="email" className="form-control" id="email" value={this.state.email}
                         placeholder="Email" onChange={this.onChangeEmail}/>
                </Col>
              </div>
              <div className={formGroupClass}>
                <Col xs={8} xsOffset={2}>
                  <label htmlFor="password" className="control-label hide">Password</label>
                  <input type="password" className="form-control" id="password" value={this.state.password}
                         placeholder="Password" onChange={this.onChangePassword}/>
                </Col>
              </div>
              <div className="form-group">
                <Col xs={8} xsOffset={2}>
                  <button type="submit" className="btn btn-primary"
                          onClick={this.handleSubmit}>Login
                  </button>
                </Col>
              </div>
            </form>
            <span className="text-primary">
              <a href="https://pushover.net/login" alt="Create Account"
                 onClick={externalLinkHandler}>No account yet? Click here to create one.</a>
            </span>
          </Col>
        </Row>
        <InfoBox active={showMaxLoginFailInfo} close={this.closeMaxLoginFailInfo}
                 title="Invalid Credentials">
          Three login attempts failed. Maybe you removed this device from your pushover account?
          <br/>Please login again.
        </InfoBox>
      </div>
    )
  }

  onChangePassword(event) {
    this.setState({ password: event.target.value })
  }

  onChangeEmail(event) {
    this.setState({ email: event.target.value })
  }

  closeMaxLoginFailInfo() {
    resetMaxLoginFails()
    this.forceUpdate()
  }

  handleSubmit(e) {
    e.preventDefault()
    // Display loading overlay
    this.setState({ spinner: true })
    // Get login parameters
    const email = this.state.email
    const password = this.state.password
    // Try login
    pushover.login({ email, password })
      .then(this.loginSuccessful.bind(this))
      .catch(this.loginFailed.bind(this))
  }

  loginFailed(error) {
    debug.log('LOGIN-ERR', error)
    this.setState({
      error: error.message,
      spinner: false
    })
  }

  loginSuccessful(response) {
    Analytics.event('App', 'LoginSuccessful')
    const email = this.state.email.trim()
    store.dispatch(setUserData({
      userKey: response.id,
      userEmail: email,
      userSecret: response.secret
    }))
    // No need to transition because isLoggedIn is a state monitored by redux
    // Once true the deviceRegistration will be shown automatically by App.js
  }

  componentDidMount() {
    showWindow()
  }
}

export default Login
