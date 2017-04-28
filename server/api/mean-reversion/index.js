'use strict';

var express = require('express');
var handler = require('./reversion.router');

var router = express.Router();

router.post('/', handler.reversion);
router.post('/backtest', handler.backtest);

module.exports = router;
