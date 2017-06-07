'use strict';

const Templates = (new (require('serverless'))()).classes.Templates;

function loadEnvironment() {
  let values;
  try {
    values = require('../_meta/variables/s-variables-dev.json');
  } catch (e) {
    console.log('Failed to read _meta/variables/s-variables-dev.json');
  }

  const variables = (new Templates(values, '../s-templates.json')).toObject();
  for (let key of Object.keys(variables)) { // eslint-disable-line prefer-const
    process.env[key] = variables[key];
  }
}

loadEnvironment();

if (!process.env.DEBUG) {
  // Disable info & warn level logging
  console.info = () => {};
  console.warn = () => {};
}

describe('MaaS Transport Service Providers', () => {
  // require('./tsp/index.js');
  // require('./tsp/response-schema-validation.js');
  // require('./tsp/api-validation.js');
  require('./tsp/booking-process-test.js');

//  require('./tsp/booking-retrieve-test.js');

});
