import React from 'react'
import Promise from 'promise'
import Window from '../../nw/Window'
import Settings from '../../services/Settings'
import { InfiniteLoader, VirtualScroll, AutoSizer } from 'react-virtualized'
import NotificationDB from '../../services/NotificationDB'
import {Row, Col, Table} from 'react-bootstrap'
import Debug from '../../lib/debug'
var debug = Debug('NotificationList')

import './NotificationList.scss'

const NotificationList = React.createClass({
  displayName: 'NotificationList',

  getInitialState() {
    return {
      list: [{
        title: 'None',
        placeholder: true
      }],
      rowCount: -1
    }
  },

  isRowLoaded({index}) {
    const list = this.state.list
    return !!list[index]
  },

  loadMoreRows({startIndex, stopIndex}) {
    // Refetch first list item to overwrite placeholder
    if (startIndex === 1)
      startIndex = 0
    debug.log('Get ', startIndex, 'to', stopIndex)
    return new Promise((resolve, reject) =>  {
      // Call to DB
      const notificationDB = NotificationDB.getDBInstance()
      notificationDB.find({}).sort({date: 1}).skip(startIndex).limit(stopIndex - startIndex + 1).exec(function(err, docs) {
        if(err)
          reject(err)
        var newList = this.state.list
        docs.forEach((notification) => {
          debug.log(notification)
          newList.push(notification)
        })
        this.setState({ list: newList })
        resolve()
      }.bind(this))
    })
  },

  totalRowCount() {
    // Return preliminary and trigger update of rowCount
    if (this.state.rowCount === -1) {
      NotificationDB
        .count()
        .then((rowCount) => {
          debug.log('Count DONE: ' + rowCount)
          this.setState({ rowCount })
        })
      return 1000
    }
    return this.state.rowCount
  },

  // Resize window
  componentWillMount() {
    Window.resizeTo(Settings.get('windowWidth'), 600)
  },

  // Revert to old size
  componentWillUnmount() {
    Window.resizeTo(Settings.get('windowWidth'), Settings.get('windowHeight'))
  },

  render() {
    const list = this.state.list
    return (
              <InfiniteLoader
                isRowLoaded={this.isRowLoaded}
                loadMoreRows={this.loadMoreRows}
                rowCount={this.totalRowCount()}
              >

                {({onRowsRendered, registerChild}) => (
                  <AutoSizer disableHeight>
                    {({ width }) => (
                      <VirtualScroll
                        ref={registerChild}
                        width={300}
                        height={450}
                        onRowsRendered={onRowsRendered}
                        overscanRowCount={10}
                        rowCount={list.length}
                        rowHeight={20}
                        rowRenderer={
                          ({ index }) => "#" + (list[index].title || list[index].message) // Could also be a DOM element
                        }
                      />
                    )}
                  </AutoSizer>
                )}
              </InfiniteLoader>
    )
  }
})

export default NotificationList
