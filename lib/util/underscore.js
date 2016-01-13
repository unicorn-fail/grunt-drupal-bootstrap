/**
 * The internal "underscore" utility module for "grunt-drupal-bootstrap".
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Mark Carver
 *
 * @module module:grunt-drupal-bootstrap/util/underscore
 */
(function (module) {
  "use strict";

  var _ = require('underscore');

  var _n = require('underscore.nested');
  _n.DEFAULT_NESTED_OPTIONS.ensure = true;
  _.mixin(_n);

  // Custom "deepClean" method to remove empty properties.
  _.mixin({

    /**
     * @memberOf _
     *
     * @param {object} o
     */
    deepClean: function (o) {
      var clone = _.clone(o);
      _.each(o, function (v, k) {
        if (_.isObject(v)) {
          if (_.isEmpty(v)) {
            delete clone[k];
          }
          else {
            clone[k] = _.deepClean(v);
          }
        }
        else if (v === void 0 || v === null) {
          delete clone[k];
        }
      });
      return clone;
    }
  });

  module.exports = _;

})(module);
