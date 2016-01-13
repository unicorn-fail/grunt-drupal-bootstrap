/**
 * The internal "bower" library for the "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 *
 * @module module:grunt-drupal-bootstrap/bower
 */
(function (exports) {
  "use strict";

  var _ = require('./util/underscore');
  var bootstrap = require('../');
  var bower = require('bower');
  var endpointParser = require('bower-endpoint-parser');
  var file = require('./util/file');
  var grunt = require('grunt');
  var inquirer = require('inquirer');
  var path = require('path');
  var Promise = require('grunt-promise').load('bluebird');

  /**
   * Bower configuration.
   *
   * @type {Object}
   */
  exports.config = {
    ignoredDependencies: ['jquery']
  };

  /**
   * Default Bower endpoints.
   *
   * @type {Array}
   */
  exports.endpoints = [exports.endpoint];

  /**
   * Default Bower options.
   *
   * @type {Object}
   */
  exports.options = {
    interactive: true,
    save: false
  };

  /**
   * Retrieves the info for a Bower project.
   *
   * @returns {Promise}
   */
  exports.getInfo = function () {
    if (this.info) return this.info;
    var endpoint = [].concat(this.endpoint)[0];
    return this.info = new Promise(function (resolve, reject) {
      bower.commands.info(endpoint, null, this.config)
        .on('end', resolve)
        .on('error', reject)
        .on('prompt', inquirer.prompt)
      ;
    }.bind(this));
  };

  /**
   * Retrieves the version for a Bower project.
   *
   * @returns {Promise}
   */
  exports.getVersion = function () {
    if (this.version) return this.version;
    return this.version = this.getInfo().get('version');
  };

  /**
   * Initializes the Bower module.
   *
   * Extracts valid Bower endpoints, config and options from the "drupal-bootstrap.libraries" property
   * from the theme's package.json file.
   */
  exports.init = function () {
    this.config = _.extend(this.config, bootstrap.getConfig('bower.config', {}));
    this.options = _.extend(this.options, bootstrap.getConfig('bower.options', {}));
    this.endpoints = [endpointParser.json2decomposed(bootstrap.getConfig('package'), bootstrap.getConfig('version'))];
  };

  exports.getEndpointPaths = function () {
    var self = this;
    return Promise.filter(self.endpoints, function (endpoint) {
      return file.exists(self.endpointPath(endpoint)).then(function (exists) {
        return bootstrap.force || exists;
      });
    });
  };

  /**
   * Installs Bower library endpoints.
   *
   * @return {Promise}
   */
  exports.install = function () {
    var self = this;
    return bootstrap.removeBowerComponents().return(_.clone(self.endpoints))
      .map(self.installEndpoint.bind(self)).then(function (endpoints) {
        return Promise.resolve(_.filter(endpoints));
      });
  };

  /**
   * Installs a specific Bower library endpoint.
   *
   * @param {object} endpoint
   *   An endpoint object, provided by endpointParser.
   *
   * @return {Promise}
   */
  exports.installEndpoint = function (endpoint) {
    var self = this;
    return file.exists(this.endpointPath(endpoint)).then(function (exists) {
      // If already installed, resolve to an empty array.
      if (!bootstrap.force && exists) return Promise.resolve([]);
      return new Promise(function (resolve, reject) {
        var header = _.clone(endpoint);
        delete header.name;
        grunt.log.header('Installing "' + endpointParser.compose(header) + '"');
        bower.commands.install([endpointParser.compose(endpoint)], self.options, self.config)
          .on('end', resolve)
          .on('error', reject)
          .on('log', self.log)
          .on('prompt', inquirer.prompt)
        ;
      });
    // Immediately fail if promise was rejected as this indicates an issue
    // with the Bower installer.
    }).catch(grunt.fail.error).then(function (installed) {
      if (!installed || !installed[endpoint.name]) return Promise.resolve();

      var meta = installed[endpoint.name].pkgMeta;
      bootstrap.setConfig('package', meta.name);
      bootstrap.setConfig('version', meta.version);

      // Resolve with the endpoint.
      return Promise.resolve(installed[endpoint.name].endpoint);
    });
  };

  exports.endpointPath = function (endpoint) {
    if (typeof endpoint === 'string') endpoint = endpointParser.decompose(endpoint);
    var name = endpoint.name || 'bootstrap';
    var targets = [].concat(bootstrap.getConfig('version'));
    return targets.length > 1 ? path.join(name, endpoint.target) : name;
  };

  exports.removeLibrary = function (endpoint) {
    return file.remove(this.endpointPath(endpoint));
  };

  exports.removeLibraries = function () {
    return Promise.map(this.endpoints, function (endpoint) {
      return this.removeLibrary(endpoint);
    }.bind(this));
  };

  /**
   * Logs messages from Bower to the screen.
   *
   * @param {object} result
   */
  exports.log = function (result) {
    if (result.level === 'action') {
      grunt[result.id === 'install' ? 'log' : 'verbose'].writeln([result.id.cyan, result.message.green].join(' '));
    }
    else {
      grunt.verbose.writeln([result.id.cyan, result.message.green].join(' '));
    }
  };

})(module.exports);
