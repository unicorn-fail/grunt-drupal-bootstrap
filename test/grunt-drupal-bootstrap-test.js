(function () {
  "use strict";

  var grunt = require('grunt');

  // This test's Promise library (bluebird).
  var Promise = require('grunt-promise').using('bluebird');

  // Custom asserts.
  var assert = require('nodeunit').assert;
  assert.printed = function (result, expected, message) {
    return assert.ok(result.stdout.indexOf(expected) !== -1, message);
  };

  // Returns a promise for spawning a grunt task.
  var runTask = function (args) {
    return new Promise(function (resolve, reject) {
      grunt.util.spawn({
        grunt: true,
        args: args,
        fallback: ''
      }, function (e, result) {
        if (result.code !== 0) return reject(result.stderr);
        resolve(result);
      });
    });
  };

  // The tests.
  var tests = {};

  tests['Install - LESS'] = function (test) {
    test.expect(1);
    runTask(['test-install-less', '--no-color', '--is-test']).then(function (result) {
      if (result.stderr) return Promise.reject(result.stderr);
      test.printed(result, 'Successfully installed: bootstrap#3.3.6', 'Install - LESS');
      test.done();
    }).catch(function (e) {
      grunt.fail.fatal(e);
      test.done();
    });
  };

  tests['Compile - LESS'] = function (test) {
    test.expect(1);
    runTask(['compile:less', '--no-color', '--is-test']).then(function (result) {
      if (result.stderr) return Promise.reject(result.stderr);
      test.printed(result, '1 stylesheet created.', 'Compile');
      test.done();
    }).catch(function (e) {
      grunt.fail.fatal(e);
      test.done();
    });
  };

  tests['Install - SASS'] = function (test) {
    test.expect(1);
    runTask(['test-install-sass', '--no-color', '--is-test']).then(function (result) {
      test.printed(result, 'Successfully installed: bootstrap-sass#3.3.6', 'Install - LESS');
      test.done();
    }).catch(function (e) {
      grunt.fail.fatal(e);
      test.done();
    });
  };

  tests['Compile - SASS'] = function (test) {
    test.expect(1);
    runTask(['compile:sass', '--no-color', '--is-test']).then(function (result) {
      if (result.stderr) return Promise.reject(result.stderr);
      test.printed(result, '1 stylesheet created.', 'Compile');
      test.done();
    }).catch(function (e) {
      grunt.fail.fatal(e);
      test.done();
    });
  };

  exports["grunt-drupal-bootstrap"] = require('nodeunit').testCase(tests);

})();
