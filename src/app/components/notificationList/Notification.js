import React from 'react'
import moment from 'moment'
import Debug from '../../lib/debug'
var debug = Debug('Notification')
import './Notification.scss'

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

const Notification = React.createClass({
  displayName: 'Notification',

  getDefaultProps() {
    return {
      notification: null,
    }
  },

  render() {
    const notification = this.props.notification
    if (notification === null)
      return
    const title = notification.title || notification.app
    // Some notifications are with, some without the URL part
    // TODO: Check why
    if (notification.icon && ! notification.icon.match(/https:\/\//)) {
      notification.icon = 'https://api.pushover.net/icons/' + notification.icon + '.png'
    }
    const image = (notification.icon) ? (<img className="notification-icon" src={notification.icon} />) : null
    return (
      <div className={this.getNotificationClassName(notification)}>
        {image}
        <div className="notification-content">
          <span className="notification-date" data-overlay={this.formatOverlay(notification.date)}>{this.formatDate(notification.date)}</span>
          <b>{title}</b><br />
          <p dangerouslySetInnerHTML={this.createMessageMarkup(notification.message)} />
        </div>
      </div>
    )
  },

  getNotificationClassName(notification) {
    let classNames = 'notification'
    if (notification.priority >= 1)
      classNames += ' highPriority'
    else if (notification.priority === -2)
      classNames += ' lowestPriority'
    return classNames
  },

  createMessageMarkup(message) {
    // TODO: Maybe do some sanitizing?
    return { __html: message }
  },

  // Short date / time since notification
  formatDate(timestamp) {
    const date = this.parseDate(timestamp)
    if (! date)
      return ''
    return date.fromNow()
  },

  // Full date and time
  formatOverlay(timestamp) {
    const date = this.parseDate(timestamp)
    if (! date)
      return ''
    return date.format('YYYY-MM-DD HH:mm:ss')
  },

  parseDate(timestamp) {
    const date = moment(timestamp * 1000, 'x')
    if (date.isValid())
      return date
    return false
  }
})

export default Notification
