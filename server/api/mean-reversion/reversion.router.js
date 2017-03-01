'use strict';

const ReversionController = require('./reversion.controller');

exports.reversion = function (req, res, next) {
  ReversionController.runTest(req, res);
};
