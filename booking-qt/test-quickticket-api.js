'use strict';

const qtapi = require('./lib/quickticket-api');

function testPriceList(){
  qtapi.pricelist().then(response =>{
    console.log(response);
  });
}

function testCreate(){
  qtapi.create(1,{firstName:"toto", lastName:"titi", email:"toto@titi.me", phone:"0123456789"})
}

testPriceList();
//testCreate();