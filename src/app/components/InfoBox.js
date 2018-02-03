import React from 'react'

import './InfoBox.scss'

class InfoBox extends React.Component {
  constructor() {
    super()
    this.triggerCloseIfClickedOutsideOfContent = this.triggerCloseIfClickedOutsideOfContent.bind(this)
  }

  static get defaultProps() {
    return {
      title: '',
      active: false
    }
  }

  render() {
    const title = (this.props.title) ? (<h2>{this.props.title}</h2>) : ''
    const infobox = (
      <div className="infobox" onClick={this.triggerCloseIfClickedOutsideOfContent}>
        <div className="infobox-content">
          <span className="infobox-close glyphicon glyphicon-remove" onClick={this.props.close}/>
          {title}
          {this.props.children}
        </div>
      </div>
    )
    return (this.props.active) ? infobox : null
  }

  triggerCloseIfClickedOutsideOfContent(event) {
    if (event.target === event.currentTarget) {
      this.props.close(event)
    }
  }
}

export default InfoBox
