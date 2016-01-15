/*
 * grunt-drupal-bootstrap
 * https://github.com/unicorn-fail/grunt-drupal-bootstrap
 *
 * Copyright (c) 2016 Mark Carver
 * Licensed under the GPL-2.0 license.
 */
(function () {
  "use strict";

  var bootstrap = require('../');
  var grunt = require('grunt');

  // Register the task.
  bootstrap.registerPromise('install', 'Drupal Bootstrap: Install the necessary grunt tasks and resources.', function () {
    return bootstrap.install();
  });

})();
