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
  app.use('/api/example', require('./api/example'));

  app.route('/*')
    .get(function(req, res) {
        res.sendfile(app.get('appPath') + '/app.index.html');
  });
};
