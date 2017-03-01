'use strict';

var express = require('express');
var handler = require('./earnings.router');

var router = express.Router();

router.get('/', handler.earnings);

module.exports = router;
