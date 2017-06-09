'use strict';

const index = require('./booking-qt-options-list/index');


function testOptionsList(){
  const event = require('./booking-qt-options-list/event.json');

  const cb = (err, res)=>{
    if(!err){
      console.log(res.options);
      if(console.log(res.options.length>0))
       console.log(res.options[0].leg);
    }else console.error(err);
  }

  const res = index.optionsList(event, cb);


}

testOptionsList();