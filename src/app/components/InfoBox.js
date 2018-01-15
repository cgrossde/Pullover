import React from 'react'

import './InfoBox.scss'

class InfoBox extends React.Component {
  static defaultProps = {
    title: '',
    active: false
  }

  render() {
    const title = (this.props.title) ? (<h2>{this.props.title}</h2>) : ''
    const infobox = (
      <div className="infobox">
        <div className="infobox-content">
          <span className="infobox-close glyphicon glyphicon-remove" onClick={this.props.close}/>
          {title}
          {this.props.children}
        </div>
      </div>
    )
    return (this.props.active) ? infobox : null
  }
}

export default InfoBox
