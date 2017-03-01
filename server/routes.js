/**
 * Main application routes
 */
'use strict';
var express = require('express');
var path = require('path');
var errors = require('./components/errors');

module.exports = function(app) {
  // Insert routes below
  app.use('/dist', express.static(path.join(__dirname, '../dist')));
  app.use('/public', express.static(path.join(__dirname, '../public')));
  app.use('/api/earnings', require('./api/earnings'));
  app.use('/api/quote', require('./api/quote'));
  app.use('/api/mean-reversion', require('./api/mean-reversion'));

  app.route('/*')
    .get(function(req, res) {
        res.sendfile(app.get('appPath') + '/app.index.html');
  });
};
