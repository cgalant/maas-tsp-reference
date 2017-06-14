'use strict';

const qtapi = require('../lib/quickticket-api');
const log4s = require('../lib/logging-config');
const logger = log4s.getLogger('booking-qt-options-list');
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

    let parsedEventTo = null;
    if(event.to.indexOf(",")>=0){
      const toCoords = event.to.split(",");
      parsedEventTo = {
        lat: toCoords[0],
        lon: toCoords[1]
      }
    }

    const parsed = {
      mode: event.mode,
      from: parsedEventFrom,
      // API Gateway gives even undefined values as strings
      to: event.to !== '' ? parsedEventTo : null,
      startTime: event.startTime,
      endTime: event.endTime !== '' ? event.endTime : event.startTime,
    };

    if (parsed.mode !== 'BUS') {
      return reject(new Error(`400: "mode" should be "BUS", got ${event.mode}`));
    }

    if (!validateCoordinates(parsed.from)) {
      return reject(new Error(`400: "from" should be valid coordinates, got ${event.from}`));
    }
//    logger.debug("validateEventData parsedEventFrom=", parsedEventFrom);
//    logger.debug("validateEventData parsed=", parsed);

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

const refbuilder = require('../lib/referential-builder');

const findNearestPlace = (places, place) => {
  logger.debug("findNearestPlace places", places)
  logger.debug("findNearestPlace place", place)
  const nearestPlace = places.filter(p => p.coords==place.id);
  return nearestPlace;
}

/**
 * Booking options list responder
 * @param {object} event
 * @param {function} callback
 * @returns {Promise} A promise that lastly calls `callback` with the TSP response
 */
const optionsListWithLocalFiles = (event, callback) => {

  var from = null;
  var to = null;
  var pricelist = null;
  var locationsMap = null;
  var locationsList = null;

  return validateEventData(event)
    .then(validatedEvent => {
      from = validatedEvent.from;
      to = validatedEvent.to;
      locationsMap = refbuilder.loadLocations();
      pricelist = refbuilder.loadPriceList();
      locationsList = refbuilder.convertAsList(locationsMap);
      return locationsList;
    })
    /*
    .then(results => {
      logger.debug(results);
      return results;
    })*/
    .then(results => findNearestLocation(results, from))
    .then(nearest => findLegs(locationsMap[nearest.id]))
    .then(legs=> filterLegsByDestination(legs, to))
    .then(place => formatResponse(place, event, pricelist.categories))
    .then(result => callback(null, result))
    .catch(error => callback(error));

};

const optionsListInMemory = (event, callback) => {

  var from = null;
  var to = null;
  var pricelist = null;
  var routesReferential = null;
  var locationsMap = null;
  var locationsList = null;

  return validateEventData(event)
    .then(validatedEvent => {
      from = validatedEvent.from;
      to = validatedEvent.to;

      /*
      locationsMap = refbuilder.loadLocations();
      pricelist = refbuilder.loadPriceList();
      locationsList = refbuilder.convertAsList(locationsMap);
      return locationsList;
      */
      return qtapi.pricelist()
    })
    .then(priceListResponse => {
      pricelist = priceListResponse;
      return refbuilder.buildReferential(priceListResponse);
    }).then(routesRef => {
      routesReferential = routesRef;
      locationsMap = refbuilder.extractLocations(routesRef);
      locationsList = refbuilder.convertAsList(locationsMap);
      return locationsList;
    })
    /*
     .then(results => {
     logger.debug(results);
     return results;
     })*/
    .then(results => findNearestLocation(results, from))
    .then(nearest => findLegs(locationsMap[nearest.id], routesReferential))
    .then(legs=> filterLegsByDestination(legs, to))
    .then(place => formatResponse(place, event, pricelist.categories))
    .then(result => callback(null, result))
    .catch(error => callback(error));

};

function filterLegsByDestination(legs, dest){
//  logger.debug("filterLegsByDestination with dest=",dest)
  if(!dest){
    return legs;
  }
  //TODO
  /*
  1. extraire les last
  2. findNearestLoc des last
  3. filter
   */

  const destinations = legs.map(leg =>{
    //logger.debug(leg);
    const loc = leg.last;
    const id = loc.lat+","+loc.long;
    return {
      id: id,
      coords: id,
      lat: loc.lat,
      lon: loc.long,
    }
  });
//  logger.debug("destinations: ", destinations);

  const nearest = nearestLocation(dest, destinations);
//  logger.debug("nearest place from evnt.to : ", nearest);

  if(!nearest){
    logger.warn("no nearest stations found ! return all legs");
    return legs;
  }
  const filteredLegs = legs.filter(leg => {
    const id = leg.last.lat+","+leg.last.long;
    return id == nearest.id;
  });

//  logger.debug("filteredLegs : ", filteredLegs);
  return filteredLegs;
}

function findLegs(departures, ref){
//  logger.debug("findLegs departures=", departures);

  const found = departures.map(dept =>{
    return ref.filter(cat => cat.id==dept.from.categoryId && cat.subcategoryId == dept.from.subcategoryId)
  });
  var legs = [].concat.apply([],found);
//  logger.debug("legs ", legs );
  return legs;
}

function formatResponse(legs, parsedRequest, categories) {

//  logger.debug("formatResponse2 legs", legs);
//  logger.debug("formatResponse2 parsedRequest", parsedRequest);
//  logger.debug("formatResponse2 categories", categories);

  const formattedStations = legs.map(leg => {

    //logger.debug("leg=",leg);

//    const cats = categories.find((cat, index, arr) => leg.id == cat.categoryId);
    const cat = categories.find(function(el, index, arr){
      return leg.id == el.categoryId
    });
    //logger.debug("cat found : ",cat);


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
          lat: Number(leg.first.lat),
          lon: Number(leg.first.long),
        },
        to: {
          lat: Number(leg.last.lat),
          lon: Number(leg.last.long),
        },
      },
      meta: {
        MODE_BUS: {
        }
      }
    }
  });

//  logger.debug(formattedStations);
  return {
    options: formattedStations,
  };

}

module.exports.optionsList = optionsListInMemory;
