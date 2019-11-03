import React from 'react'
import moment from 'moment'
import Debug from '../../lib/debug'
import { openExternalLink } from '../../nw/Window'
import './Notification.scss'

var debug = Debug('Notification')

/**
 * { message: 'Some notification',
  app: 'Some App',
  aid: 54318,
  icon: 'ddd',
  date: 1471201959,
  priority: 0,
  acked: 0,
  umid: 8364,
  title: 'some title',
  sound: 'po',
  originalId: 798,
  _id: 'y6QFIMpXV0wlP93a' }
 */

class Notification extends React.Component {
  constructor() {
    super()
  }

  static get defaultProps() {
    return {
      notification: null
    }
  }

  render() {
    const notification = this.props.notification
    if (notification === null)
      return
    const title = notification.title || notification.app
    // Some notifications are with, some without the URL part
    // TODO: Check why
    if (notification.icon && !notification.icon.match(/https:\/\//)) {
      notification.icon = 'https://api.pushover.net/icons/' + notification.icon + '.png'
    }
    let url = this.createUrlMarkup(notification.url)

    const image = (notification.icon) ? (<img className="notification-icon" src={notification.icon}/>) : null
    return (
      <div className={this.getNotificationClassName(notification)}>
        {image}
        <div className="notification-content">
          <span className="notification-date"
                data-overlay={this.formatOverlay(notification.date)}>{this.formatDate(notification.date)}</span>
          <b>{title}</b><br/>
          <p dangerouslySetInnerHTML={this.createMessageMarkup(notification.message)}/>
          {url}
        </div>
      </div>
    )
  }

  getNotificationClassName(notification) {
    let classNames = 'notification'
    if (notification.priority >= 1)
      classNames += ' highPriority'
    else if (notification.priority === -2)
      classNames += ' lowestPriority'
    return classNames
  }

  createMessageMarkup(message) {
    // TODO: Maybe do some sanitizing?
    return { __html: message.replace(/(?:\r\n|\r|\n)/g, '<br>') }
  }

  // Short date / time since notification
  formatDate(timestamp) {
    const date = this.parseDate(timestamp)
    if (!date)
      return ''
    return date.fromNow()
  }

  // Full date and time
  formatOverlay(timestamp) {
    const date = this.parseDate(timestamp)
    if (!date)
      return ''
    return date.format('YYYY-MM-DD HH:mm:ss')
  }

  parseDate(timestamp) {
    const date = moment(timestamp * 1000, 'x')
    if (date.isValid())
      return date
    return false
  }

  createUrlMarkup(url) {
    if (url) {
      const title = (url.length > 50) ? url.slice(0, 50) + '...' : url
      // Make sure URL has an http(s) prefix for openExternalLink
      if (!/^http/.test(url)) {
        url = 'http://' + url
      }
      const openUrl = () => openExternalLink(url)
      return (<div className='notification-url'>
        URL: <a href="javascript:void(0)" onClick={openUrl}>{title}</a>
      </div>)
    }
    return ''
  }
}

export default Notification
