/**
 * The internal "file" library for the "grunt-drupal-bootstrap" NPM module.
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 *
 * @module module:grunt-drupal-bootstrap/file
 */
(function (exports) {
  "use strict";

  var cwd = process.cwd();
  var grunt = require('grunt');
  var Promise = require('grunt-promise').load('bluebird');
  var fs = Promise.promisifyAll(require('fs-extra'));
  var path = require('path');

  /**
   * Copy a file or directory. The directory can have contents. Like cp -r.
   *
   * @param {string} src
   *   The source file or directory to copy.
   * @param {string} dest
   *   The destination file or directory to copy to.
   * @param {object} [options]
   *   (Optional) An object containing the following properties.
   *   - cwd (string): The current working directory to base `src` and `dest`.
   *     Pass false to use absolute paths if base paths of `src` and `dest` are
   *     different.
   *   - clobber (boolean): overwrite existing file or directory
   *   - preserveTimestamps (boolean): will set last modification and access
   *     times to the ones of the original source files, default is false.
   *   - filter: Function or RegExp to filter copied files. If function, return
   *     true to include, false to exclude. If RegExp, same as function, where
   *     `filter` is `filter.test`.
   */
  exports.copy = function (src, dest, options) {
    options = options || {};
    if (options.cwd === void 0) options.cwd = cwd;
    var srcFullPath = options.cwd ? path.join(options.cwd, src) : src;
    var destFullPath = options.cwd ? path.join(options.cwd, dest) : dest;
    grunt.verbose.write('Copying '+ srcFullPath.replace(cwd, '.') + ' >> '.cyan + destFullPath.replace(cwd, '.') + '...');
    return fs.copyAsync(srcFullPath, destFullPath, options)
      .catch({code: 'ENOENT'}, function () {
        grunt.verbose.error();
        return Promise.reject(new Error(srcFullPath.replace(cwd, '.') + ' does not exist', 'ENOENT'));
      })
      .then(function () {
        grunt.verbose.ok();
        return Promise.resolve(destFullPath);
      })
    ;
  };

  /**
   * Determines if a directory or file exists.
   *
   * @param {string} file
   *   The path to the file or directory to check.
   */
  exports.exists = function (file, root) {
    root = root || cwd;
    var fullPath = path.join(root, file.replace(cwd, ''));
    return fs.lstatAsync(fullPath)
      .then(function(stat) {
        return Promise.resolve(stat.isDirectory() || stat.isFile());
      })
      .catch({code: 'ENOENT'}, function () {
        return Promise.resolve(false);
      })
    ;
  };

  /**
   * Removes a file or directory. The directory can have contents. Like rm -rf.
   *
   * @param {string} file
   *   The file or directory to remove.
   * @param {string} [root]
   *   (Optional) The current working directory `dir` is relative to.
   */
  exports.remove = function (file, root) {
    root = root || cwd;
    var fullPath = path.join(root, file);
    grunt.verbose.write('Deleting '+ fullPath.replace(cwd, '.') + '...');
    return fs.removeAsync(fullPath)
      .catch({code: 'ENOENT'}, function (e) {
        return Promise.resolve(file);
      })
      .then(function () {
        grunt.verbose.ok();
        return Promise.resolve(fullPath);
      })
    ;
  };

  // Read a file, parse its contents, return an object.
  exports.writeJSON = function(path, data, options) {
    grunt.verbose.write('Writing ' + path.replace(cwd, '.') + '...');
    return fs.writeJsonAsync(path, data, options)
      .then(function () {
        grunt.verbose.ok();
      })
      .catch(function (e) {
        grunt.verbose.error();
        throw grunt.util.error('Unable to write "' + path.replace(cwd, '.') + '" file (' + e.message + ').', e);
      })
    ;
  };


})(module.exports);
