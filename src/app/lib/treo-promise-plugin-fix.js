var denodeify = require('promise').denodeify;

/**
 * Expose `plugin()`.
 */

module.exports = plugin;

/**
 * Methods for patch.
 */

var dbMethods = [
  ['drop', 1],
  ['close', 1]
];

var storeMethods = [
  ['put', 3],
  ['get', 2],
  ['del', 2],
  ['count', 1],
  ['clear', 1],
  ['batch', 2],
  ['all', 1],
];

var indexMethods = [
  ['get', 2],
  ['count', 2],
];

/**
 * Denodeify each db's method and add promises support with
 * https://github.com/jakearchibald/es6-promise
 */

function plugin() {
  return function(db) {
    patch(db, dbMethods);

    Object.keys(db.stores).forEach(function(storeName) {
      var store = db.store(storeName);
      patch(store, storeMethods);

      Object.keys(store.indexes).forEach(function(indexName) {
        var index = store.index(indexName, indexMethods);
        patch(index, indexMethods);
      });
    });
  };
}

/**
 * Patch `methods` from `object` with `denodeify`.
 *
 * @param {Object} object
 * @param {Array} methods
 */

function patch(object, methods) {
  methods.forEach(function(m) {
    object[m[0]] = denodeify(object[m[0]]);
  });
}
