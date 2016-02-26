import React from 'react'

import './Spinner.scss'

const Spinner = React.createClass({
  displayName: 'Spinner',

  render() {
    var spinner = (
      <div className="spinner">
        <img className="spinner-image" src="images/spinner.gif" alt="Loading..."/>
      </div>
    )
    return (this.props.active) ? spinner : null
  }
})

export default Spinner
