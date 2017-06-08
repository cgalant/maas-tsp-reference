'use strict';

const refbuider = require('./lib/referential-builder');


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

//testCreateRef();
//extractLocations();
loadLocations();