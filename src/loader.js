'use strict';

/**
 * @ngdoc interface
 * @name angular.Module
 * @description
 *
 * Interface for configuring angular {@link angular.module modules}.
 * @return {function(string,Array.<string>=,Function=):angular.Module}
 */

function setupModuleLoader() {

  function ensure(obj, name, factory) {
    return obj[name] || (obj[name] = factory());
  }

  /** @type {Object.<string, ?angular.Module>} */
  var modules = {};

  /**
   * @ngdoc function
   * @name angular.module
   * @description
   *
   * The `angular.module` is a global place for creating and registering Angular modules. All
   * modules (angular core or 3rd party) that should be available to an application must be
   * registered using this mechanism.
   *
   * Modules provide configuration information for service creation view the injector. The
   * configuration is broken down into two phases. A service configuration and injector creation.
   *
   * 1. First the config phase is executed. At this point all of the providers are registered,
   *    but no instances are yet created. The configuration phase also allows the retrieval of
   *    existing providers so that they can be further configured. At this point it is guranteed
   *    that no service instance is created.
   * 2. Second, the injector is created. Once the injector instance is created it can be used to
   *    retrieve service instances.
   *
   * # Module
   *
   * A module is a collocation of services, directives, filters, and configure information. Module
   * is used to configure the {@link AUTO.$injector $injector}.
   *
   * <pre>
   * // Create a new module
   * var myModule = angular.module('myModule', []);
   *
   * // register a new service
   * myModule.value('appName', 'MyCoolApp');
   *
   * // configure existing services inside initialization blocks.
   * myModule.config(function($locationProvider) {
   *   // Configure existing providers
   *   $locationProvider.hashPrefix('!');
   * });
   * </pre>
   *
   * Then you can create an injector and load your modules like this:
   *
   * <pre>
   * var injector = angular.injector(['ng', 'MyModule'])
   * </pre>
   *
   * However it's more likely that you'll just use
   * {@link ng.directive:ngApp ngApp} or
   * {@link angular.bootstrap} to simplify this process for you.
   *
   * @param {string} name The name of the module to create or retrieve.
   * @param {Array.<string>=} requires If specified then new module is being created. If unspecified then the
   *        the module is being retrieved for further configuration.
   * @param {Function=} configFn Option configuration function for the module. Same as
   *        {@link angular.Module#config Module#config()}.
   * @returns {angular.Module} new module with the {@link angular.Module} api.
   */
  return function module(name, requires, configFn) {
    if (requires && modules.hasOwnProperty(name)) {
      modules[name] = null;
    }
    return ensure(modules, name, function() {
      if (!requires) {
        throw Error('No module: ' + name);
      }

      /** @type {!Array.<Array.<*>>} */
      var invokeQueue = [];

      /** @type {!Array.<Function>} */
      var runBlocks = [];

      /** @type {angular.Module} */
      var moduleInstance = {
        // Private state
        _invokeQueue: invokeQueue,
        _runBlocks: runBlocks,

        /**
         * @ngdoc property
         * @name angular.Module#requires
         * @propertyOf angular.Module
         * @type {!Array.<string>} List of module names which must be loaded before this module.
         * @description
         * Holds the list of modules which the injector will load before the current module is loaded.
         */
        requires: requires,

        /**
         * @ngdoc property
         * @name angular.Module#name
         * @propertyOf angular.Module
         * @type {string} Name of the module.
         * @description
         */
        name: name,


        /**
         * @ngdoc method
         * @name angular.Module#provider
         * @methodOf angular.Module
         * @param {string} name service name
         * @param {!Function} providerType Construction function for creating new instance of the service.
         * @returns {!Object}
         * @description
         * See {@link AUTO.$provide#provider $provide.provider()}.
         */
        provider: invokeLater('$provide', 'provider'),

        /**
         * @ngdoc method
         * @name angular.Module#factory
         * @methodOf angular.Module
         * @param {string} name service name
         * @param {!Function} providerFunction Function for creating new instance of the service.
         * @returns {!Object}
         * @description
         * See {@link AUTO.$provide#factory $provide.factory()}.
         */
        factory: invokeLater('$provide', 'factory'),

        /**
         * @ngdoc method
         * @name angular.Module#service
         * @methodOf angular.Module
         * @param {string} name service name
         * @param {!Function} constructor A constructor function that will be instantiated.
         * @returns {!Object}
         * @description
         * See {@link AUTO.$provide#service $provide.service()}.
         */
        service: invokeLater('$provide', 'service'),

        /**
         * @ngdoc method
         * @name angular.Module#value
         * @methodOf angular.Module
         * @param {string|Object} name service name
         * @param {*} object Service instance object.
         * @returns {!Object}
         * @description
         * See {@link AUTO.$provide#value $provide.value()}.
         */
        value: invokeLater('$provide', 'value'),

        /**
         * @ngdoc method
         * @name angular.Module#constant
         * @methodOf angular.Module
         * @param {string} name constant name
         * @param {*} object Constant value.
         * @returns {!Object}
         * @description
         * Because the constant are fixed, they get applied before other provide methods.
         * See {@link AUTO.$provide#constant $provide.constant()}.
         */
        constant: invokeLater('$provide', 'constant', 'unshift'),

        /**
         * @ngdoc method
         * @name angular.Module#filter
         * @methodOf angular.Module
         * @param {string} name Filter name.
         * @param {!Function} filterFactory Factory function for creating new instance of filter.
         * @returns {!Object}
         * @description
         * See {@link ng.$filterProvider#register $filterProvider.register()}.
         */
        filter: invokeLater('$filterProvider', 'register'),

        /**
         * @ngdoc method
         * @name angular.Module#controller
         * @methodOf angular.Module
         * @param {string} name Controller name.
         * @param {!Function} constructor Controller constructor function.
         * @returns {!Object}
         * @description
         * See {@link ng.$controllerProvider#register $controllerProvider.register()}.
         */
        controller: invokeLater('$controllerProvider', 'register'),

        /**
         * @ngdoc method
         * @name angular.Module#directive
         * @methodOf angular.Module
         * @param {string} name directive name
         * @param {!Function} directiveFactory Factory function for creating new instance of
         * @returns {!Object}
         * directives.
         * @description
         * See {@link ng.$compileProvider#directive $compileProvider.directive()}.
         */
        directive: invokeLater('$compileProvider', 'directive'),

        /**
         * @ngdoc method
         * @name angular.Module#config
         * @methodOf angular.Module
         * @param {!Function} configFn Execute this function on module load. Useful for service
         *    configuration.
         * @returns {!Object}
         * @description
         * Use this method to register work which needs to be performed on module loading.
         */
        config: invokeLater('$injector', 'invoke'),

        /**
         * @ngdoc method
         * @name angular.Module#run
         * @methodOf angular.Module
         * @param {!Function} initializationFn Execute this function after injector creation.
         *    Useful for application initialization.
         * @returns {!Object}
         * @description
         * Use this method to register work which needs to be performed when the injector with
         * with the current module is finished loading.
         */
        run: function(initializationFn) {
          runBlocks.push(initializationFn);
          return moduleInstance;
        }
      };

      if (configFn) {
        moduleInstance.config(configFn);
      }

      return  moduleInstance;

      /**
       * @param {string} provider
       * @param {string} method
       * @param {string=} insertMethod
       * @returns {function(...): angular.Module}
       */
      function invokeLater(provider, method, insertMethod) {
        return function() {
          // FIXME(rado): figure out a way to make JS compiler understand that
          //     array[string] can return a function too.
          // invokeQueue[insertMethod || 'push']([provider, method, arguments]);
          invokeQueue.push([provider, method, arguments]);
          return moduleInstance;
        };
      }
    });
  };
}

// TODO(misko): unwrap me so that we don't have to call this.
angular.module = setupModuleLoader();