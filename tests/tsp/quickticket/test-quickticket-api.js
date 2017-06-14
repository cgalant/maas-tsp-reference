'use strict';

const qtapi = require('../../../booking-qt/lib/quickticket-api');

function testPriceList(){
  qtapi.pricelist().then(response =>{
    console.log(response);
  });
}

function testCreate(){
  qtapi.create(1,{firstName:"toto", lastName:"titi", email:"toto@titi.me", phone:"0123456789"})
}

function testGetReservation(){
  qtapi.getReservation(1).then(response => {
    console.log("success", response);
  }).catch(error => {
    console.error("failure", error);
  });

}


function testAuthenticate(){
  qtapi.authenticate();
}


//testAuthenticate();
//testPriceList();
//testCreate();
//testGetReservation();

function testNumberNull(){
//  var num = Number("5.255");
  var num = Number(null);
  console.log(num);
}

testNumberNull();