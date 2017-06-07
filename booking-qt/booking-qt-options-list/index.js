'use strict';

const qtAPI = require('../lib/quickticket-api');
const validateCoordinates = require('../lib/util').validateCoordinates;
const nearestLocation = require('../lib/util').nearestLocation;

/**
 * Validate the event data
 * @param {object} event - The event data from the event
 * @returns {Promise} A promise that resolves with the original event
 */
const validateEventData = event => (
  new Promise((resolve, reject) => {

    let parsedEventFrom = event.from;
    if(event.from.indexOf(",")>=0){
      const fromCoords = event.from.split(",");
      parsedEventFrom = {
        lat: fromCoords[0],
        lon: fromCoords[1]
      }
    }



    const parsed = {
      mode: event.mode,
      from: parsedEventFrom,
      // API Gateway gives even undefined values as strings
      to: event.to !== '' ? event.to : null,
      startTime: event.startTime,
      endTime: event.endTime !== '' ? event.endTime : event.startTime,
    };

    if (parsed.mode !== 'BUS') {
      return reject(new Error(`400: "mode" should be "BUS", got ${event.mode}`));
    }

    if (!validateCoordinates(parsed.from)) {
      return reject(new Error(`400: "from" should be valid coordinates, got ${event.from}`));
    }

    return resolve(parsed);
  })
);

/**
 * Find the nearest bike network based
 * on given coordinates from a list of available
 * bike networks.
 * @param {object} networks
 * @param {number} location
 * @returns {Promise} A promise that resolves with a found newtork, rejects if no close matches are found
 */
const findNearestNetwork = (networks, location) => (
  new Promise((resolve, reject) => {
    const nearestNetwork = nearestLocation(location, networks.networks);
    return resolve(nearestNetwork.href);
  })
);

const TICKETTYPE_ADULT_SINGLE = 'ENK';
const DEFAULT_CURRENCY = 'EUR';

/**
 * Format a response that conforms to the TSP response schema
 */
function formatResponse(priceListResponse, parsedRequest) {

//  console.log(parsedRequest);
  const categories = priceListResponse.categories;
  const cat = categories[0];
  const subs = cat.subcategories;
  const subcat = subs[0];
  const tickets = subcat.tickets;
  const res = tickets.filter(t => t.ticketType==TICKETTYPE_ADULT_SINGLE);
//  console.log(res[0]);

  const ticket = res[0];
  const finalPriceForCustomer = Math.round(ticket.priceExt * ticket.vatFactor * 100) / 100;

  const formattedStations =
    [{
      cost: {
        amount: finalPriceForCustomer,
        currency: DEFAULT_CURRENCY
      },
      terms: {
        /*validity:{
          startTime:
          endTime:
        }*/
      },
      tspProduct:{
        id: "QT-"+ticket.ticketId
      },
      leg: {
        mode: 'BUS',
        startTime: parsedRequest.startTime,
        endTime: parsedRequest.endTime,
        from: {
          lat: 1,
          lon: 2,
        },
        to: {
          lat: 1,
          lon: 2,
        },
      },
      meta: {
        MODE_BUS: {
        }
      }
    }];

  return {
    options: formattedStations,
  };
}

/**
 * Booking options list responder
 * @param {object} event
 * @param {function} callback
 * @returns {Promise} A promise that lastly calls `callback` with the TSP response
 */
const optionsList = (event, callback) => {

  return validateEventData(event)
    .then(event => qtAPI.pricelist())
//    .then(results => findNearestNetwork(results, event.from))
//    .then(closestNetwork => citybikesAPI.products(closestNetwork))
//    .then(availableNetwork => formatResponse(availableNetwork.network.stations, event))
    .then(results => formatResponse(results, event))
    .then(result => callback(null, result))
    .catch(error => callback(error));

};

module.exports.optionsList = optionsList;
