/**
 * The internal "preprocessor" library for the "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 *
 * @module module:grunt-drupal-bootstrap/preprocessor
 */
(function (exports) {
  "use strict";

  var _ = require('./util/underscore');
  var bootstrap = require('../');
  var file = require('./util/file');
  var grunt = require('grunt');
  var path = require('path');
  var Promise = require('grunt-promise').using('bluebird');

  /**
   * A base preprocessor object for grunt-drupal-bootstrap.
   *
   * @param {Object} [config]
   *
   * @constructor
   */
  var Preprocessor = function (config) {

    /**
     * Whether or not the preprocessor has been initialized.
     *
     * @type {boolean}
     */
    this.initialized = false;

    /**
     * States whether or not the NPM module is installed.
     *
     * @type {boolean}
     */
    this.installed = false;

    /**
     * Machine name of the preprocessor. This will also be the property name
     * for the NPM module that is loaded (e.g. this.less or this.sass).
     *
     * @type {string}
     */
    this.name = '';

    /**
     * Machine name of the NPM package to install/use.
     *
     * @type {string}
     */
    this.npmPackage = '';

    /**
     * The version of the NPM package to install/use.
     *
     * @type {string}
     */
    this.npmVersion = '';

    // Initialize the preprocessor.
    this.init(config);
  };

  /**
   * Compiles the stylesheets.
   *
   * @param {string} src
   *   The source file.
   * @param {string} dest
   *   The destination file.
   * @param {Object} options
   *   An object of options to pass to the preprocessor.
   *
   * @return {Promise}
   */
  Preprocessor.prototype.compile = function (src, dest, options) {
    return Promise.resolve();
  };

  /**
   * Copies directories.
   *
   * @param {[{ src: String, dest: String]} dirs
   *   Expects an array of objects with "src" and "dest" properties.
   */
  Preprocessor.prototype.copyDirectories = function (dirs) {
    return Promise.mapSeries(dirs, function (dir) {
      return file.exists(dir.dest).then(function (exists) {
        if (!bootstrap.force && exists) {
          return file.remove(dir.dest).then(function () {
            return file.copy(dir.src, dir.dest);
          });
        }
        return file.copy(dir.src, dir.dest);
      });
    });
  };

  /**
   * Initializes the preprocessor.
   *
   * @param {Object} [config]
   *   Configuration for the preprocessor.
   */
  Preprocessor.prototype.init = function (config) {
    // Only initialize once.
    if (!this.initialized) {
      this.initialized = true;

      // Extend the instance with options.
      if (config) _.extend(this, config);

      // Attempt to load the preprocessor's NPM module.
      try {
        this.installed = !!(this[this.name] = require(this.npmPackage));
      }
      catch (e) {
      }
    }
  };

  /**
   * Installs the preprocessor's NPM package dependencies.
   */
  Preprocessor.prototype.install = function () {
    // Immediately return if already installed.
    if (!bootstrap.force && this.installed) return Promise.resolve();

    // Ensure an NPM package name was specified.
    if (!this.npmPackage) return grunt.log.debug('The "' + this.name + ' " preprocessor did not specify an NPM package to install.');

    grunt.log.header('Installing "' + this.name + '" preprocessor');

    // Determine the args.
    var args = ['install', '--loglevel=error'];
    args.push(this.npmVersion ? this.npmPackage + '@^' + this.npmVersion.replace(/^[#^~]/, '') : this.npmPackage);
    return bootstrap.spawn('npm', args);
  };

  /**
   * Performs post install tasks for the preprocessor.
   *
   * @return {Promise}
   */
  Preprocessor.prototype.postInstall = Promise.resolve;


  Preprocessor.prototype.formatError = function (e) {
    var pos = '[' + e.line + ':' + e.column + ']';
    if (!e.filename) {
      var parts = e.file.split(path.sep);
      e.filename = parts.pop();
    }
    return (e.filename + ':').yellow + grunt.util.linefeed +
      (pos + ' ' + e.message).red;
  };

  Preprocessor.prototype.error = function (e, file) {
    grunt.log.error(this.formatError(e));
    grunt.fail.warn('Error compiling ' + file);
    throw e;
  };

  Preprocessor.prototype.wrapError = function (e, message) {
    var err = new Error(message);
    err.origError = e;
    return err;
  };

  /**
   * @type {Preprocessor}
   */
  exports.Preprocessor = Preprocessor;

  exports.none = new Preprocessor();

})(module.exports);
