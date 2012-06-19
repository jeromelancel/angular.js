'use strict';

goog.require('angular.coreModule');
goog.require('angular.core.$log');

goog.provide('angular.core.$exceptionHandler');

angular.coreModule.provider('$exceptionHandler', $ExceptionHandlerProvider);

/**
 * @ngdoc function
 * @name ng.$exceptionHandler
 * @requires $log
 * @constructor
 *
 * @description
 * Any uncaught exception in angular expressions is delegated to this service.
 * The default implementation simply delegates to `$log.error` which logs it into
 * the browser console.
 *
 * In unit tests, if `angular-mocks.js` is loaded, this service is overridden by
 * {@link ngMock.$exceptionHandler mock $exceptionHandler}
 */
function $ExceptionHandlerProvider() {
  /**
   * @type {Array}
   */
  this.$get = ['$log', function($log){
    /**
     * @param {Error} exception Exception associated with the error.
     * @param {string=} cause optional information about the context in which
     *       the error was thrown.
     */
    return function(exception, cause) {
      $log.error.apply($log, arguments);
    };
  }];
}
