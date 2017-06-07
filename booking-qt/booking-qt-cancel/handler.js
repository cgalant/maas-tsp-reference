'use strict';

const quickticketTSP = require('./index');

module.exports.handler = function (event, context) {
  quickticketTSP.cancel(event, (error, response) => context.done(error, response));
};
