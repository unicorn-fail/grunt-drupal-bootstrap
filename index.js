/**
 * The "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 */
(function (exports) {
  "use strict";

  var _ = require('./lib/util/underscore');

  var bower = require('./lib/bower');
  var cwd = process.cwd();
  var endpointParser = require('bower-endpoint-parser');
  var file = require('./lib/util/file');
  var grunt = require('grunt');
  var path = require('path');
  var preprocessor = require('./lib/preprocessor');
  var Promise = require('grunt-promise').using('bluebird');

  /**
   * @module module:grunt-drupal-bootstrap
   */
  var bootstrap = exports;

  /**
   * Contains configuration settings provided in the "drupal-bootstrap" property
   * from a theme's package.json file.
   *
   * Don't use this property directly, you should use bootstrap.getConfig() and
   * bootstrap.setConfig() respectively.
   *
   * @private

   * @type {Object}
   */
  bootstrap.config = {};

  /**
   * The current grunt task instance.
   *
   * @type {grunt.task.current}
   */
  bootstrap.task = null;

  /**
   * Contains loaded preprocessors.
   *
   * @private
   *
   * @type {Object}
   */
  bootstrap.preprocessors = {};

  /**
   * Performs an Promise based asynchronous exec child process.
   *
   * @param {string} cmd
   *   The command to execute.
   * @param {Array} [args]
   *   An array of arguments to use.
   * @param {Object} [options]
   *   An object of options to pass to child_process.exec.
   */
  bootstrap.spawn = function (cmd, args, options) {
    options = _.extend({stdio: 'inherit'}, options || {});
    grunt.log.debug([].concat([cmd], args).join(' '));
    return new Promise(function (resolve, reject) {
      require('child_process').spawn(cmd, args || [], options)
        .on('close', function (code) {
          if (code !== 0) reject(code);
          resolve();
        });
    }).catch(function (e) {
      grunt.fail.fatal(new Error(e));
    });
  };

  /**
   * Installs the Bootstrap assets and preprocessor dependencies.
   *
   * @returns {Promise}
   */
  bootstrap.install = function () {
    var preprocessor = bootstrap.getPreprocessor();
    return preprocessor.install()
      .then(bower.install.bind(bower))
      .map(preprocessor.postInstall.bind(preprocessor))
      .then(function (endpoints) {
        return bootstrap.removeBowerComponents()
          .return(Promise.resolve(_.filter(endpoints)));
      })
      .map(function (endpoint) {
        var e = _.clone(endpoint);
        delete e.name;
        return endpointParser.compose(e);
      })
      .then(function (endpoints) {
        if (endpoints.length) grunt.log.writeln().writeln('Successfully installed: ' + endpoints.join(', '));
      });
  };

  bootstrap.removeBowerComponents = function () {
    return file.exists('bower_components').then(function (exists) {
      if (exists) return file.remove('bower_components');
      return Promise.resolve();
    });
  };

  /**
   * Retrieves a preprocessor instance.
   *
   * @param {String} [name]
   *   The name of the preprocessor to load.
   *
   * @returns {Preprocessor}
   */
  bootstrap.getPreprocessor = function (name) {
    if (!name && this.preprocessor) return this.preprocessor;
    var preprocessor = name ? require('./lib/preprocessors/' + name) : require('./lib/preprocessor').none;
    if (!preprocessor.installed) {
      preprocessor.install();
    }
    if (['less', 'sass'].indexOf(preprocessor.name) === -1) {
      grunt.fail.fatal("Your theme's package.json file must contain a valid `drupal-bootstrap.preprocessor` type; either `less` or `sass`.");
    }
    return this.preprocessor = preprocessor;
  };

  /**
   * Wraps a grunt.registerPromise to inject the necessary initTask invocation.
   *
   * @param {string} name
   *   The name of the Grunt task to register.
   * @param {string|function} [info]
   *   (Optional) Descriptive text explaining what the task does. Shows up on
   *   `--help`. You may omit this argument and replace it with `fn` instead.
   * @param {function} [fn]
   *   (Required) The task function. Remember not to pass in your Promise
   *   function directly. Promise resolvers are immediately invoked when they
   *   are created. You should wrap the Promise with an anonymous task function
   *   instead.
   *
   * @returns {Function<Promise>|Object<Promise>}
   */
  bootstrap.registerPromise = function (name, info, fn) {
    var self = this;
    if (!fn) {
      fn = info;
      info = null;
    }
    if (typeof fn !== 'function') {
      grunt.fail.fatal(new Error('The "fn" argument for grunt.registerPromise or grunt.registerMultiPromise must be a function.'));
    }
    return grunt.registerPromise.apply(grunt.task, [name, info, function () {
      self.initTask(this);
      return fn.apply(this, this.args).finally(self.shutDown.bind(self));
    }]);
  };

  /**
   * Wraps a grunt.registerPromise to inject the necessary initTask invocation.
   *
   * @param {string} name
   *   The name of the Grunt task to register.
   * @param {string|function} [info]
   *   (Optional) Descriptive text explaining what the task does. Shows up on
   *   `--help`. You may omit this argument and replace it with `fn` instead.
   * @param {function} [fn]
   *   (Required) The task function. Remember not to pass in your Promise
   *   function directly. Promise resolvers are immediately invoked when they
   *   are created. You should wrap the Promise with an anonymous task function
   *   instead.
   *
   * @returns {Function<Promise>|Object<Promise>}
   */
  bootstrap.registerMultiPromise = function (name, info, fn) {
    var self = this;
    if (!fn) {
      fn = info;
      info = null;
    }
    if (typeof fn !== 'function') {
      grunt.fail.fatal(new Error('The "fn" argument for grunt.registerPromise or grunt.registerMultiPromise must be a function.'));
    }
    return grunt.registerMultiPromise.apply(grunt.task, [name, info, function () {
      self.initTask(this);
      return fn.apply(this, this.args).finally(self.shutDown.bind(self));
    }]);
  };

  bootstrap.init = function (config) {
    this.debug = !!grunt.option('debug');
    this.force = !!grunt.option('force');
    this.verbose = !!grunt.option('verbose');
    this.pkg = grunt.file.readJSON('package.json') || {};

    // Merge configuration from "drupal-bootstrap" property from the
    // theme's package.json file.
    this.config = _.merge(this.config, this.pkg['drupal-bootstrap'], config);
    this.originalConfig = _.clone(this.config);

    // Retrieve the preprocessor.
    // @todo this should be moved out of the default config and into compiling
    // so individual sources can be compiled as needed.
    if (!this.config.preprocessor) this.config.preprocessor = 'less';
    var preprocessor = this.getPreprocessor(this.config.preprocessor);

    // Retrieve the library package and version.
    // @todo this should be an array/object to allow multiple packages.
    if (!this.config.package) this.config.package = 'bootstrap' + (preprocessor.name === 'sass' ? '-sass' : '');
    if (!this.config.version) this.config.version = '^3.0.0';

    // Initialize bower.
    bower.init();
  };

  bootstrap.getConfig = function (name, defaultValue) {
    return _(this.config).getNested(name, defaultValue);
  };

  bootstrap.setConfig = function (name, value) {
    _(this.config).setNested(name, value);
    return value;
  };

  bootstrap.initTask = function (currentTask) {
    return this.task = currentTask;
  };

  /**
   * Performs cleanup operations after a task has finished.
   */
  bootstrap.shutDown = function () {
    // If this is a test, don't save config back to this project's package.json.
    if (grunt.option('is-test')) return;

    var config = _.deepClean(this.config);
    if (JSON.stringify(this.originalConfig) === JSON.stringify(config)) return Promise.resolve();

    this.pkg['drupal-bootstrap'] = this.originalConfig = config;
    return file.writeJSON(path.join(cwd, 'package.json'), this.pkg);
  };

  // Initialize the module.
  bootstrap.init();

})(module.exports);
