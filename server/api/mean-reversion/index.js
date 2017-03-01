'use strict';

var express = require('express');
var handler = require('./reversion.router');

var router = express.Router();

router.post('/', handler.reversion);

module.exports = router;
