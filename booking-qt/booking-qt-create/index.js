const qtAPI = require('../lib/quickticket-api');
const formatResponse = require('../lib/response-mapper').formatReservationResponse;

/**
 * Validate the event data
 * @param {object} event - The event data from the event
 * @returns {Promise} A promise that resolves with the original event
 */
const validateEventData = event => (
  new Promise((resolve, reject) => {
    var parsed = event;
    if (parsed.leg.mode !== 'BUS') {
      return reject(new Error(`400: "mode" should be "BUS", got ${parsed.leg.mode}`));
    }
    if (!parsed.customer){
      return reject(new Error(`400: "customer" should be supplied`));
    }

    const tspId = event.tspProduct.id;
    if(tspId.indexOf("QT-")<0){
      return reject(new Error("Wrong tspId : "+tspId));
    }
    parsed.ticketId = tspId.substring(3, tspId.length);

    /*TODO
    if (!validateCoordinates(parsed.leg.from)) {
      return reject(new Error(`400: "from" should be valid coordinates, got ${parsed.leg.from}`));
    }*/

    return resolve(parsed);
  })
);


//function parseId(event){
const parseId = event => (
  new Promise((resolve, reject) => {

    const tspId = event.tspProduct.id;

    if(tspId.indexOf("QT-")<0){
      return reject(new Error("Wrong tspId : "+tspId));
    }
    const id = tspId.substring(3, tspId.length);
    console.log("parsedId="+id);
    return resolve(id);
  })
//};
);



/**
 * Booking create responder
 * @param {object} event
 * @param {function} callback
 * @returns {Promise} A promise that lastly calls `callback` with the TSP response
 */
const create = (event, callback) => {
  return validateEventData(event)
    .then(parsedEvent => qtAPI.create(parsedEvent.ticketId, event.customer))
//    .then(event => parseId(event))
//    .then(id => qtAPI.create(id))
    .then(qtApiResponse => formatResponse(qtApiResponse, event))
    .then(result => callback(null, result))
    .catch(error => callback(error));
};

module.exports.create = create;