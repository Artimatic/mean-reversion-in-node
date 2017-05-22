/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('config');

// Setup server
var app = express();

app.set('views', __dirname + '/modules')
app.set('view engine', 'html');

var server = require('http').createServer(app);
require('./express')(app);
require('./routes')(app);

// Start server
server.listen(config.get('port'), undefined, function () {
  console.log('Express server listening on %d, in %s mode', config.get('port'), app.get('env'));
});

// Expose app
exports = module.exports = app;
