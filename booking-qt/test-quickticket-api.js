'use strict';

const qtapi = require('./lib/quickticket-api');

function testPriceList(){
  qtapi.pricelist().then(response =>{
    console.log(response);
  });
}

function testCreate(){
  qtapi.create()
}