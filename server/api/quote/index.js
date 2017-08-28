'use strict';

var express = require('express');
var handler = require('./quote.router');

var router = express.Router();

router.post('/', handler.quote);

module.exports = router;
