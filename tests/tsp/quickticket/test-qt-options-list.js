'use strict';

const index = require('../../../booking-qt/booking-qt-options-list/index');
const log4s = require('log4js');
const logger = log4s.getLogger("test-qt-options-list");

function testOptionsList(){
  const event = require('../../../booking-qt/booking-qt-options-list/event.json');

  const cb = (err, res)=>{
    if(!err){
      logger.info(res.options);
    }else logger.error(err);
  }

  const res = index.optionsList(event, cb);
}

testOptionsList();