/**
 * Development Gruntfile for the "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 */

module.exports = function (grunt) {
  'use strict';

  // Grunt initialization.
  // -----------------------------------------------------------------------
  grunt.initConfig({
    compile: {
      less: {
        options: {}, // less or node-sass plugin options.
        files: {
          "css/less/bootstrap.css": "less/bootstrap.less"
        }
      },
      sass: {
        options: {}, // less or node-sass plugin options.
        files: {
          "css/sass/bootstrap.css": "scss/bootstrap.scss"
        }
      }
    },
    nodeunit: {
      all: ['test/*-test.js']
    },
    jshint: {
      options: {
        jshintrc: true
      },
      all: [
        'index.js',
        'Gruntfile.js',
        'package.json',
        'lib/**/*.js'
      ]
    }
  });

  // Load this module's tasks.
  // -----------------------------------------------------------------------
  grunt.loadTasks('tasks');

  //Load NPM module Grunt tasks.
  //-----------------------------------------------------------------------
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  grunt.registerPromise('test-install-less', function () {
    var bootstrap = require('./');
    var file = require('./lib/util/file');
    bootstrap.init({
      "package": "bootstrap",
      "version": "3.3.6",
      "preprocessor": "less"
    });
    return file.exists('bootstrap').then(function (exists) {
      if (exists) return file.remove('bootstrap');
    }).then(bootstrap.install.bind(bootstrap));
  });

  grunt.registerPromise('test-install-sass', function () {
    var bootstrap = require('./');
    var file = require('./lib/util/file');
    bootstrap.init({
      "package": "bootstrap-sass",
      "version": "3.3.6",
      "preprocessor": "sass"
    });
    return file.exists('bootstrap-sass').then(function (exists) {
      if (exists) return file.remove('bootstrap-sass');
    }).then(bootstrap.install.bind(bootstrap));
  });

  // Register "default" and "test" tasks.
  grunt.registerTask('test', ['jshint', 'nodeunit']);
  grunt.registerTask('default', ['test']);

};
