import Rx from 'rx'

/**
 * RXJS EXTENSIONS
 */

/**
 * Executes a map function on the first element in the window, returns the rest as is
 * In other words: Executes mapFunction on all elements the Rx.throttle() function would
 * emit, emits all other elements unchanged
 */
Rx.Observable.prototype.throttleMap = function (windowDuration, mapFunction, scheduler) {
  Rx.Scheduler.isScheduler(scheduler) || (scheduler = Rx.Scheduler.default)
  var duration = +windowDuration || 0;
  if (duration <= 0) { throw new RangeError('windowDuration cannot be less or equal zero.') }
  var source = this;
  return new Rx.AnonymousObservable(function (o) {
    var lastOnNext = 0
    return source.subscribe(
      function (x) {
        var now = scheduler.now()
        if (lastOnNext === 0 || now - lastOnNext >= duration) {
          lastOnNext = now
          o.onNext(mapFunction(x))
        }
        else {
          o.onNext(x)
        }
      },function (e) { o.onError(e) }, function () { o.onCompleted() }
    );
  }, source);
};

/**
 * Limit the rate at wich elements are emitted. E.g. once every 500ms
 */
Rx.Observable.prototype.limitRate = function(emitRate, scheduler) {
  Rx.Scheduler.isScheduler(scheduler) || (scheduler = Rx.Scheduler.default)
  var emitRate = +emitRate || 0
  if (emitRate <= 0) { throw new RangeError('emitRate cannot be less or equal zero.') }
  var source = this
  return new Rx.AnonymousObservable(function (o) {
    // Create a simple queue which will process one item at a time and schedule
    // a `emitRate` ms wait time between each queue item
    const queue = []
    let running = false
    let disposable = null
    const end = function() {
      running = false
      disposable = null
    }
    const processQueueItem = function() {
      if(queue.length === 0)
        return end()
      // Emit next element
      o.onNext(queue.shift())
      // Schedule next emit
      disposable = scheduler.scheduleFuture(
        null,
        emitRate,
        processQueueItem.bind(this)
      )
    }
    const run = function() {
      if(running)
        return
      running = true
      processQueueItem()
    }
    return source.subscribe(
      (x) => {
        queue.push(x)
        if(! running)
          run()
      },
      (e) => {
        if(disposable !== null)
          disposable.dispose()
        o.onError(e)
      },
      () => {
        o.onCompleted()
      }
    )
  })
}

export default Rx