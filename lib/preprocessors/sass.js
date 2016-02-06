/**
 * The internal "sass" library for the "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 *
 * @module module:grunt-drupal-bootstrap/sass
 */
(function (module) {
  "use strict";

  var _ = require('./../util/underscore');
  var bootstrap = require('../../');
  var bower = require('../bower');
  var grunt = require('grunt');
  var file = require('./../util/file');
  var path = require('path');
  var Preprocessor = require('./../preprocessor').Preprocessor;
  var Promise = require('grunt-promise').using('bluebird');

  /**
   * The SASS preprocessor.
   *
   * @type {Preprocessor}
   */
  var Sass = new Preprocessor({
    name: 'sass',
    npmPackage: 'node-sass',
    npmVersion: '3.4.2'
  });

  /**
   * Performs post install tasks for the preprocessor.
   *
   * @return {Promise}
   */
  Sass.postInstall = function (endpoint) {
    var endpointPath = bower.endpointPath(endpoint);
    return this.copyDirectories([
      {
        src: path.join('bower_components', endpointPath, 'assets', 'fonts', 'bootstrap'),
        dest: path.join(endpoint.name, 'fonts')
      },
      {
        src: path.join('bower_components', endpointPath, 'assets', 'javascripts', 'bootstrap'),
        dest: path.join(endpoint.name, 'js')
      },
      {
        src: path.join('bower_components', endpointPath, 'assets', 'stylesheets', 'bootstrap'),
        dest: path.join(endpoint.name, 'scss')
      }
    ]).return(endpoint);
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
  Sass.compile = function (src, dest, options) {
    var render = Promise.promisify(this.sass.render);
    options = _.merge({}, options, {
      file: src,
      outFile: dest
    });
    return render(options).catch(function (e) {
      return Promise.reject(this.error(e, src));
    }.bind(this));
  };

  module.exports = Sass;

})(module);
