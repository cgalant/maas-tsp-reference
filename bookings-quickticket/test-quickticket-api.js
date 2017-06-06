'use strict';

const qtapi = require('./lib/quickticket-api');

qtapi.pricelist().then(response =>{
  console.log(response);
});