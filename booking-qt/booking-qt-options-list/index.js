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
//    console.log("validateEventData parsedEventFrom=", parsedEventFrom);
//    console.log("validateEventData parsed=", parsed);

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
const findNearestLocation = (places, location) => (
  new Promise((resolve, reject) => {
    const nearest = nearestLocation(location, places);
    return resolve(nearest);
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
const refbuilder = require('../lib/referential-builder');

const findNearestPlace = (places, place) => {
  console.log("findNearestPlace places", places)
  console.log("findNearestPlace place", place)
  const nearestPlace = places.filter(p => p.coords==place.id);
  return nearestPlace;
}

const optionsList2 = (event, callback) => {

  var from = null;
  var pricelist = null;
  var locationsMap = null;
  var locationsList = null;

  return validateEventData(event)
    .then(validatedEvent => {
      from = validatedEvent.from;
      locationsMap = refbuilder.loadLocations();
      pricelist = refbuilder.loadPriceList();
      locationsList = refbuilder.convertAsList(locationsMap);
      return locationsList;
    })
    /*
    .then(results => {
      console.log(results);
      return results;
    })*/
    .then(results => findNearestLocation(results, from))
    .then(nearest => findLegs(locationsMap[nearest.id]))
    .then(legs=> filterLegsByDestination(legs, event.to))
    .then(place => formatResponse2(place, event, pricelist.categories))
    .then(result => callback(null, result))
    .catch(error => callback(error));

};

function filterLegsByDestination(legs, dest){
  console.log("filterLegsByDestination with dest=",dest)
  if(!dest){
    return legs;
  }
  //TODO
  return legs;
}

function findLegs(departures){
//  console.log("findLegs departures=", departures);
  const ref = refbuilder.loadReferential()

  const found = departures.map(dept =>{
    return ref.filter(cat => cat.id==dept.from.categoryId && cat.subcategoryId == dept.from.subcategoryId)
  });
  var legs = [].concat.apply([],found);
//  console.log("legs ", legs );
  return legs;
}

function formatResponse2(legs, parsedRequest, categories) {

//  console.log("formatResponse2 legs", legs);
//  console.log("formatResponse2 parsedRequest", parsedRequest);
//  console.log("formatResponse2 categories", categories);

  const formattedStations = legs.map(leg => {

    //console.log("leg=",leg);

//    const cats = categories.find((cat, index, arr) => leg.id == cat.categoryId);
    const cat = categories.find(function(el, index, arr){
      return leg.id == el.categoryId
    });
    //console.log("cat found : ",cat);


    const subcat = cat.subcategories.find((subcat, index, arr) => leg.subcategoryId == subcat.subcategoryId);
    const tickets = subcat.tickets;
    const res = tickets.filter(t => t.ticketType==TICKETTYPE_ADULT_SINGLE);
    const ticket = res[0];
    const finalPriceForCustomer = Math.round(ticket.priceExt * ticket.vatFactor * 100) / 100;


    return {
      cost: {
        amount: finalPriceForCustomer,
        currency: DEFAULT_CURRENCY
      },
      terms: {

      },
      tspProduct:{
        id: "QT-"+ticket.ticketId
      },
      leg: {
        mode: 'BUS',
        startTime: parsedRequest.startTime,
        endTime: parsedRequest.endTime,
        from: {
          lat: leg.first.lat,
          lon: leg.first.long,
        },
        to: {
          lat: leg.last.lat,
          lon: leg.last.long,
        },
      },
      meta: {
        MODE_BUS: {
        }
      }
    }
  });

//  console.log(formattedStations);
  return {
    options: formattedStations,
  };

}

module.exports.optionsList = optionsList2;
