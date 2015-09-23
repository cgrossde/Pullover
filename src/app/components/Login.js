import React from 'react'
import { Row, Col } from 'react-bootstrap'

import { openExternalLink } from '../nw/Window'
import Spinner from './Spinner'
import pushover from '../services/Pushover'
import store from '../services/Store'
import { setUserData } from '../actions/Pushover'

const Login = React.createClass({
  displayName: 'Login',

  getInitialState() {
    return {
      spinner: false,
      error: false
    }
  },

  render() {
    const formGroupClass = (this.state.error) ? 'form-group has-error' : 'form-group'
    const infoClass = (this.state.error) ? 'text-danger' : 'text-muted'
    const infoText = (this.state.error) ? this.state.error : 'You will need to do this only once.'

    return (
      <div>
        <Spinner active={this.state.spinner} />
        <Row>
          <Col md={8} mdOffset={2}>
            <h1 className="center-block">Login to Pushover</h1>
            <p className={infoClass}>{infoText}</p>
            <form className="form-horizontal" role="form">
              <div className={formGroupClass}>
                <Col xs={8} xsOffset={2}>
                  <label htmlFor="email" className="control-label hide">Email</label>
                  <input type="email" className="form-control" id="email"
                    placeholder="Email" ref="email" />
                </Col>
              </div>
              <div className={formGroupClass}>
                <Col xs={8} xsOffset={2}>
                  <label htmlFor="password" className="control-label hide">Password</label>
                  <input type="password" className="form-control" id="password"
                    placeholder="Password" ref="password" />
                </Col>
              </div>
              <div className="form-group">
                <Col xs={8} xsOffset={2}>
                  <button type="submit" className="btn btn-primary"
                    onClick={this.handleSubmit}>Login</button>
                </Col>
              </div>
            </form>
            <span className="text-primary">
              <a href="https://pushover.net/login" alt="Create Account"
                onClick={openExternalLink}>No account yet? Click here to create one.</a>
            </span>
          </Col>
        </Row>
      </div>
    )
  },

  handleSubmit(e) {
    e.preventDefault()
    // Display loading overlay
    this.setState({ spinner: true })
    // Get login parameters
    const email = React.findDOMNode(this.refs.email).value.trim()
    const password = React.findDOMNode(this.refs.password).value.trim()
    // Delete password, we don't want/need to keep it
    React.findDOMNode(this.refs.password).value = ''
    // Try login
    pushover.login({ email, password })
      .then(this.loginSuccessful)
      .catch(this.loginFailed)
  },

  loginFailed(error) {
    console.log('LOGIN-ERR', error)
    this.setState({
      error: error.message,
      spinner: false
    })
  },

  loginSuccessful(response) {
    const email = React.findDOMNode(this.refs.email).value.trim()
    store.dispatch(setUserData({
      userKey: response.id,
      userEmail: email,
      userSecret: response.secret
    }))
    // No need to transition because isLoggedIn is a state monitored by redux
    // Once true the deviceRegistration will be shown automatically by App.js
  }
})

export default Login
