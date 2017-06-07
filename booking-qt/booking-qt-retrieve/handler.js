'use strict';

const quickticketTSP = require('./index');

module.exports.handler = function (event, context) {
  quickticketTSP.retrieve(event, (error, response) => context.done(error, response));
};
