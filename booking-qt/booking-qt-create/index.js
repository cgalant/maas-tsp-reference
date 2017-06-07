const qtAPI = require('../lib/quickticket-api');
const formatResponse = require('../lib/response-mapper').formatReservationResponse;

/**
 * Validate the event data
 * @param {object} event - The event data from the event
 * @returns {Promise} A promise that resolves with the original event
 */
const validateEventData = event => (
  new Promise((resolve, reject) => {

    console.log(event);

    const parsed = event;
    /*
    const parsed = {
      leg: event.leg,
      meta: event.meta,
      // API Gateway gives even undefined values as strings
      customer: event.customer,
    };*/
    if (parsed.leg.mode !== 'BUS') {
      return reject(new Error(`400: "mode" should be "BUS", got ${parsed.leg.mode}`));
    }
    if (!parsed.customer){
      return reject(new Error(`400: "customer" should be supplied`));
    }
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
    .then(event => parseId(event))
    .then(id => qtAPI.create(id))
    .then(qtApiResponse => formatResponse(qtApiResponse, event))
    .then(result => callback(null, result))
    .catch(error => callback(error));
};

module.exports.create = create;