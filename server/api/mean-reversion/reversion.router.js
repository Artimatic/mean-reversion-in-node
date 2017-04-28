'use strict';

const ReversionController = require('./reversion.controller');

exports.reversion = function (req, res, next) {
  ReversionController.getAlgoData(req, res);
};

exports.backtest = function (req, res, next) {
  ReversionController.runBacktest(req, res);
};
