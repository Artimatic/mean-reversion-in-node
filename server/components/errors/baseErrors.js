'use strict';
var errors = require('errors');

module.exports.InvalidArgumentsError = errors.create({
    name:"InvalidArgumentsError",
    defaultExplanation: "Input has invalid value"
});
