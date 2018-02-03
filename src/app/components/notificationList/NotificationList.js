import React from 'react'
import Promise from 'promise'
import { Alert } from 'react-bootstrap'
import Window from '../../nw/Window'
import Settings from '../../services/Settings'
import NotificationDB from '../../services/NotificationDB'
import Debug from '../../lib/debug'
import Notification from './Notification'

import './NotificationList.scss'

var debug = Debug('NotificationList')

class NotificationList extends React.Component {
  constructor() {
    super()
    this.windowHeight = 600
    this.windowWidth = 450
    this.notificationList = null
    this.stepSize = 100 // How many more notifications to load once scrolled to bottom
    this.scrollTop = 0

    this.state = {
      list: [],
      totalNotifications: 0,
      lastIndex: 0
    }

    this.loadMoreRows = this.loadMoreRows.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.determineTotalNotificationCount()
    this.loadMoreRows()
  }

  // Resize window
  componentWillMount() {
    this._isMounted = true
    Window.resizeTo(Settings.get('windowWidth'), this.windowHeight)
  }

  // Revert to old size
  componentWillUnmount() {
    this._isMounted = false
    Window.resizeTo(Settings.get('windowWidth'), Settings.get('windowHeight'))
  }

  componentWillUpdate() {
    // Cache scroll position before updating
    if (this.notificationList)
      this.scrollTop = this.notificationList.scrollTop
  }

  componentDidUpdate() {
    // Restore scroll position
    this.notificationList.scrollTop = this.scrollTop
  }

  loadMoreRows() {
    const startIndex = this.state.lastIndex
    const stopIndex = startIndex + this.stepSize
    return new Promise((resolve, reject) => {
      // Call to DB
      const notificationDB = NotificationDB.getDBInstance()
      notificationDB.find({}).sort({ date: -1 }).skip(startIndex).limit(stopIndex - startIndex + 1).exec(function (err, docs) {
        if (err)
          reject(err)
        var newList = this.state.list
        var index = startIndex
        docs.forEach((notification) => {
          newList[index] = notification
          index++
        })
        if (this._isMounted)
          this.setState({
            list: newList,
            lastIndex: stopIndex,
          })
        resolve()
      }.bind(this))
    })
  }

  determineTotalNotificationCount() {
    NotificationDB
      .count()
      .then((totalNotifications) => {
        this.setState({ totalNotifications })
      })
  }

  render() {
    const list = this.state.list
    let result, allNotificationsLoaded
    // No notifications?
    if (list.length === 0)
      result = (<Alert bsStyle="info">No notifications received</Alert>)
    else {
      result = list.map(notification => {
        return (<Notification notification={notification} key={notification._id}/>)
      })
      if (this.state.lastIndex >= this.state.totalNotifications)
        allNotificationsLoaded = (<Alert bsStyle="info">No more notifications</Alert>)
    }
    return (
      <div className="notificationList" ref={(input) => {
        this.notificationList = input
      }} onScroll={this.handleScroll}>
        {result}
        {allNotificationsLoaded}
      </div>
    )
  }

  handleScroll() {
    if (this.state.lastIndex >= this.state.totalNotifications) {
      return
    }
    const fireBeforeBottom = 400
    const scrollPosition = this.notificationList.scrollTop
    if (this.notificationList.scrollHeight - scrollPosition < window.innerHeight + fireBeforeBottom) {
      // Bottom reached, load more notifications
      this.loadMoreRows()
    }
  }
}

export default NotificationList
