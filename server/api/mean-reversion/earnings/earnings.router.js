'use strict';

const EarningsController = require('./earnings.controller');

/**
 * Get earnings
 */
exports.earnings = function (req, res, next) {
  EarningsController.getEarningsReport(req, res);
};
