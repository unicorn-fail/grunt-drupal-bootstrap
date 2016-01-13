/*
 * grunt-drupal-bootstrap
 * https://github.com/unicorn-fail/grunt-drupal-bootstrap
 *
 * Copyright (c) 2016 Mark Carver
 * Licensed under the GPL-2.0 license.
 */
(function () {
  "use strict";

  var grunt = require('grunt');
  var fs = require('./../lib/util/file');
  var bootstrap = require('../');
  var Promise = require('grunt-promise').load('bluebird');

  bootstrap.registerMultiPromise('compile', 'Drupal Bootstrap: Compile the source stylesheets into CSS.', function () {
    var options = this.options({
      banner: ''
    });

    if (this.files.length < 1) {
      grunt.verbose.warn('Destination not written because no source files were provided.');
    }

    var tally = {
      sheets: 0,
      maps: 0
    };

    return Promise.mapSeries(this.files, function (file) {
      var destFile = file.dest;

      var files = file.src.filter(function (filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        }
        return true;
      });

      if (files.length === 0) {
        if (file.src.length < 1) {
          grunt.log.warn('Destination ' + destFile.cyan + ' not written because no source files were found.');
        }

        // No src files, goto next target. Warn would have been issued above.
        return Promise.resolve(false);
      }

      var compiled = [];
      var i = 0;

      return Promise.mapSeries(files, function (file) {
        if (i++ > 0) options.banner = '';
        var parts = file.split('.');
        var extension = parts.pop();

        // Allow an explicit preprocessor to be specified in the options.
        var preprocessor = options.preprocessor;

        // Otherwise, attempt to determine the preprocessor by the file type.
        if (!preprocessor) {
          switch (extension) {
            case 'sass':
            case 'scss':
              preprocessor = 'sass';
              break;
            case 'less':
              preprocessor = 'less';
              break;
          }
        }

        return fs.exists(destFile).then(function (exists) {
          if (exists) return fs.remove(destFile).return();
          return Promise.resolve();
        }).then(function () {
          return bootstrap.getPreprocessor(preprocessor).compile(file, destFile, options)
            .catch(function (e) {
              return Promise.reject(e);
            })
            .then(function (output) {
              return new Promise(function (resolve) {
                compiled.push(output.css);
                if (output.map && options.sourceMap && !options.sourceMapFileInline) {
                  var sourceMapFilename = options.sourceMapFilename;
                  if (!sourceMapFilename) {
                    sourceMapFilename = destFile + '.map';
                  }
                  grunt.file.write(sourceMapFilename, output.map);
                  grunt.verbose.writeln('File ' + sourceMapFilename.cyan + ' created.');
                  tally.maps++;
                }
                process.nextTick(resolve);
              });
            });
        });
      }).then(function () {
        if (compiled.length < 1) {
          grunt.log.warn('Destination ' + destFile.cyan + ' not written because compiled files were empty.');
        } else {
          var allCss = compiled.join(options.compress ? '' : grunt.util.normalizelf(grunt.util.linefeed));
          grunt.file.write(destFile, allCss);
          grunt.verbose.writeln('File ' + destFile.cyan + ' created');
          tally.sheets++;
        }
        return Promise.resolve(destFile);
      });

    }).then(function () {
      if (tally.sheets) {
        grunt.log.ok(tally.sheets + ' ' + grunt.util.pluralize(tally.sheets, 'stylesheet/stylesheets') + ' created.');
      }
      if (tally.maps) {
        grunt.log.ok(tally.maps + ' ' + grunt.util.pluralize(tally.maps, 'sourcemap/sourcemaps') + ' created.');
      }
    });
  });

})();
