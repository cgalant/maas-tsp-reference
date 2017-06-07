'use strict';

const chai = require('chai');
const moment = require('moment-timezone');
const wrap = require('lambda-wrapper').wrap;
const schemaUtils = require('maas-schemas');

const expect = chai.expect;

// Use when #151 is merged to maas-schemas
// const responseSchemas = {
//   'booking-options-list':
//     require('maas-schemas/prebuilt/tsp/booking-options-list/response.json'),
//   'booking-create':
//     require('maas-schemas/prebuilt/tsp/booking-create/response.json'),
//   'booking-cancel':
//     require('maas-schemas/prebuilt/tsp/booking-cancel/response.json'),
//   'booking-read-by-id':
//     require('maas-schemas/prebuilt/tsp/booking-read-by-id/response.json'),
// };

// Local overrides w/ schemas from #151
const responseSchemas = {
  'booking-options-list': require('../../schemas/tsp/booking-options-list/response.json'),
  'booking-create': require('../../schemas/tsp/booking-create/response.json'),
  'booking-cancel': require('../../schemas/tsp/booking-cancel/response.json'),
  'booking-read-by-id': require('../../schemas/tsp/booking-read-by-id/response.json'),
};

const tsps = [
  {
    agencyId: 'qt',
    handlers: {
      'booking-options-list': {
        handler: require('../../booking-qt/booking-qt-options-list/handler'),
        eventData: require('../../booking-qt/booking-qt-options-list/event.json'),
      },
      'booking-create': {
        handler: require('../../booking-qt/booking-qt-create/handler'),
        eventData: require('../../booking-qt/booking-qt-create/event.json'),
      },
      'booking-read-by-id': {
        handler: require('../../booking-qt/booking-qt-retrieve/handler'),
        eventData: require('../../booking-qt/booking-qt-retrieve/event.json'),
      },
      'booking-cancel': {
        handler: require('../../booking-qt/booking-qt-cancel/handler'),
        eventData: require('../../booking-qt/booking-qt-cancel/event.json'),
      },
    },
  },
];

describe('TSP booking worklow validation', function () {
  this.timeout(60 * 1000);

  function generateTestCases(tspSpec) {
    // Next Tuesday 13:00
    const now = new Date();
    const currentDay = now.getDay();
    const eventTimes = {
      // Use a date that is a normal working day, but <7 days in future
      // => the next working day, or Tuesday next week
      startTime: moment.tz({ hours: 15 }, 'Europe/Helsinki')
        .day(currentDay < 4 ? currentDay + 1 : 9).valueOf(),
      endTime: moment.tz({ hours: 15 }, 'Europe/Helsinki')
        .day(currentDay < 4 ? currentDay + 2 : 10).valueOf(),
    };
    const events = {};

    Object.keys(tspSpec.handlers).forEach(handlerKey => {
      const eventBase = tspSpec.handlers[handlerKey].eventData;
      let _event = Object.assign({}, eventBase);

      if (Object.prototype.hasOwnProperty.call(_event, 'startTime')) {
        _event = Object.assign({}, _event, eventTimes);
      }

      if (Object.prototype.hasOwnProperty.call(_event, 'leg') && Object.prototype.hasOwnProperty.call(_event.leg, 'startTime')) {
        _event = Object.assign({}, _event, { leg: Object.assign({}, _event.leg, eventTimes) });
      }

      events[handlerKey] = _event;
    });

    it(`should be able to complete the booking workflow for ${tspSpec.agencyId}`, () => {
      let _previousResponse;
      let currentStep = 'booking-options-list';
      let _event = events['booking-options-list'];

      return wrap(tspSpec.handlers[currentStep].handler).run(_event)
          .then(response => {
            _previousResponse = response;
            expect(_previousResponse.options).to.be.an('array').that.is.not.empty;
            return schemaUtils.validate(responseSchemas[currentStep], response);
          })
          .then(() => {
            currentStep = 'booking-create';
            _event = Object.assign({}, events[currentStep], {
              meta: _previousResponse.options[0].meta,
              terms: _previousResponse.options[0].terms,
              tspProduct: _previousResponse.options[0].tspProduct,
            });
            return wrap(tspSpec.handlers[currentStep].handler).run(_event);
          })
          .then(response => {
            _previousResponse = response;
            return schemaUtils.validate(responseSchemas[currentStep], response);
          })
          .then(() => {
            currentStep = 'booking-read-by-id';
            _event = Object.assign({}, events[currentStep], { tspId: _previousResponse.tspId });
            return wrap(tspSpec.handlers[currentStep].handler).run(_event);
          })
          .then(response => {
            _previousResponse = response;
            return schemaUtils.validate(responseSchemas[currentStep], response);
          })
          .then(() => {
            currentStep = 'booking-cancel';
            _event = Object.assign({}, events[currentStep], { tspId: _previousResponse.tspId });
            return wrap(tspSpec.handlers[currentStep].handler).run(_event);
          })
          .then(response => {
            _previousResponse = response;
            return schemaUtils.validate(responseSchemas[currentStep], response);
          })
          .catch(error => {
            console.log('Caught an error: ', error.message);
            console.log('Step', currentStep);
            console.log('Event: ', JSON.stringify(_event));
            console.log(error.stack);
            return Promise.reject(new Error([`@${currentStep}`, error.message].join(', ')));
          });
    });
  }

  tsps.forEach(tsp => generateTestCases(tsp));
});
