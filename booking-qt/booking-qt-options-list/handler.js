'use strict';

const quickticketTSP = require('./index');

module.exports.handler = function (event, context) {
  quickticketTSP.optionsList(event, (error, response) => context.done(error, response));
};
