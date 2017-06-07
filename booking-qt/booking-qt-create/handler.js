'use strict';

const quickticketTSP = require('./index');

module.exports.handler = function(event, context, cb) {
  quickticketTSP.create(event, (error, response) => context.done(error, response));
  /*
  return cb(null, {
    message: 'Go Serverless! Your Lambda function executed successfully!'
  });*/
};
