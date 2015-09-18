import React from 'react'
import Navbar from './Navbar'

import './App.scss'

const App = React.createClass({
  displayName: 'App',

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
})

export default App
