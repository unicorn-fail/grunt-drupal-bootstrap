/**
 * The internal "less" library for the "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 *
 * @module module:grunt-drupal-bootstrap/less
 */
(function (module) {
  "use strict";

  var _ = require('./../util/underscore');
  var bower = require('../bower');
  var grunt = require('grunt');
  var path = require('path');
  var Promise = require('grunt-promise').load('bluebird');
  var Preprocessor = require('./../preprocessor').Preprocessor;

  /**
   * The LESS preprocessor.
   *
   * @type {Preprocessor}
   */
  var Less = new Preprocessor({
    name: 'less',
    npmPackage: 'less',
    npmVersion: '2.5.3'
  });

  /**
   * Performs post install tasks for the preprocessor.
   *
   * @return {Promise}
   */
  Less.postInstall = function (endpoint) {
    var endpointPath = bower.endpointPath(endpoint);
    return this.copyDirectories([
      {
        src: path.join('bower_components', endpointPath, 'fonts'),
        dest: path.join(endpoint.name, 'fonts')
      },
      {
        src: path.join('bower_components', endpointPath, 'js'),
        dest: path.join(endpoint.name, 'js')
      },
      {
        src: path.join('bower_components', endpointPath, 'less'),
        dest: path.join(endpoint.name, 'less')
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
  Less.compile = function (src, dest, options) {
    options = _.assign({filename: src}, options);
    options.paths = options.paths || [path.dirname(src)];

    if (_.isFunction(options.paths)) {
      try {
        options.paths = options.paths(src);
      } catch (e) {
        grunt.fail.warn(this.wrapError(e, 'Generating @import paths failed.'));
      }
    }

    if (options.sourceMap && !options.sourceMapFileInline && !options.sourceMapFilename) {
      options.sourceMapFilename = dest + '.map';
    }

    if (_.isFunction(options.sourceMapBasepath)) {
      try {
        options.sourceMapBasepath = options.sourceMapBasepath(src);
      } catch (e) {
        grunt.fail.warn(this.wrapError(e, 'Generating sourceMapBasepath failed.'));
      }
    }

    if (_.isBoolean(options.sourceMap) && options.sourceMap) {
      options.sourceMap = {
        sourceMapBasepath: options.sourceMapBasepath,
        sourceMapFilename: options.sourceMapFilename,
        sourceMapInputFilename: options.sourceMapInputFilename,
        sourceMapFullFilename: options.sourceMapFullFilename,
        sourceMapURL: options.sourceMapURL,
        sourceMapRootpath: options.sourceMapRootpath,
        outputSourceFiles: options.outputSourceFiles,
        sourceMapFileInline: options.sourceMapFileInline
      };
    }

    var srcCode = grunt.file.read(src);

    // Equivalent to --modify-vars option.
    // Properties under options.modifyVars are appended as less variables
    // to override global variables.
    var modifyVarsOutput = this.parseVariableOptions(options.modifyVars);
    if (modifyVarsOutput) {
      srcCode += '\n' + modifyVarsOutput;
    }

    // Load custom functions
    if (options.customFunctions) {
      Object.keys(options.customFunctions).forEach(function (name) {
        this.less.functions.functionRegistry.add(name.toLowerCase(), function () {
          var args = [].slice.call(arguments);
          args.unshift(this.less);
          var res = options.customFunctions[name].apply(this, args);
          return _.isObject(res) ? res : new this.less.tree.Anonymous(res);
        }.bind(this));
      }.bind(this));
    }
    var render = Promise.promisify(this.less.render);
    return render.call(this.less, srcCode, options).catch(function (err) {
      return Promise.reject(this.lessError(err, src));
    }.bind(this));
  };

  Less.parseVariableOptions = function (options) {
    var pairs = _.pairs(options);
    var output = '';
    pairs.forEach(function (pair) {
      output += '@' + pair[0] + ':' + pair[1] + ';';
    });
    return output;
  };

  module.exports = Less;


})(module);
