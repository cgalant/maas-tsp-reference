'use strict';

const refbuider = require('../../../booking-qt/lib/referential-builder');


function testCreateRef(){
  refbuider.createReferential()
}

function extractLocations(){
  const res = refbuider.extractLocations();
  console.log(res);
}

function loadLocations(){
  const coords = refbuider.loadLocations();
  console.log(coords);
}
function testRequestAndSavePriceList(){
  refbuider.requestAndSavePriceList();
}
//testCreateRef();
//extractLocations();
//loadLocations();
testRequestAndSavePriceList();