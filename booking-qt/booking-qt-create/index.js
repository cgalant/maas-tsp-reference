const qtAPI = require('../lib/quickticket-api');
const moment = require('moment');

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
 * Format a response that conforms to the TSP booking-create response schema
 */
function formatResponse(reservationResponse, parsedRequest) {

  const ticket = reservationResponse.tickets[0];

  //2017-06-07T00:00:00+02:00
  const startTime = moment.parseZone(reservationResponse.validFrom).unix();
  const endTime = moment.parseZone(reservationResponse.endTime).unix();

  console.log("formatResponse customer:", parsedRequest.customer);

  return Promise.resolve({
    cost: {
      amount: ticket.price,
      currency: 'EUR',
      taxes: ticket.vatFactor
    },
    terms: {
      type: ticket.ticketType,
      validity:{
        startTime: startTime,
        endTime: endTime
      }
    },
    token: {
      data:{
        url: reservationResponse.barcodeUrl, //TODO voir si C pas plutot du binaire
      },
      validityDuration: {
        startTime: startTime,
        endTime: endTime
      }
    },
    meta: {
      MODE_BUS: {
      },
      reservationCode: reservationResponse.reservationCode,
      reservationUrl: reservationResponse.reservationUrl,
      barcodeData: reservationResponse.barcodeData,
      cancellable: reservationResponse.cancellable
    },
//    customer: parsedRequest.customer,
    tspProduct: Object.assign( {}, parsedRequest.tspProduct),
    leg: Object.assign( {}, parsedRequest.leg, { mode: 'BUS' } ),
    state: "CONFIRMED", //TODO a revoir
    tspId: reservationResponse.reservationId,
  });
}

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