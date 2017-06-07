'use strict';
const wrap = require('lambda-wrapper').wrap;
const handler = require('../../booking-qt/booking-qt-retrieve/handler')
const eventData = require('../../booking-qt/booking-qt-retrieve/event.json')
const schema = require('../../schemas/tsp/booking-read-by-id/response.json');

describe('TSP booking retrieve tests', function (){

  const id = "f991ac0b-9638-42de-a083-6ba9147d5ff6";
  it(`should be able to retrive booking with id ${id}`, () => {
    let _event = Object.assign({}, eventData, {tspId: id});
    wrap(handler.handler).run(_event).then(response => {
      return schemaUtils.validate(schema, response);
    })
      .catch(error => {
        console.log('Caught an error: ', error.message);
        console.log('Event: ', JSON.stringify(_event));
        console.log(error.stack);
        return Promise.reject(new Error([`@${currentStep}`, error.message].join(', ')));
      });
  })

})