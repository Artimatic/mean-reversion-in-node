'use strict';

var express = require('express');
var handler = require('./quote.router');

var router = express.Router();

router.post('/', handler.quote);
router.post('/snapshot', handler.snapshot);

module.exports = router;
