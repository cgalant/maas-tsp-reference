'use strict';
const moment = require('moment');
const log4js = require('./logging-config');
const logger = log4js.getLogger("RESPONSE-MAPPER");

/**
 * Format a response that conforms to the TSP booking-create response schema
 */
const formatReservationResponse = (reservationResponse, parsedRequest) => {

  const ticket = reservationResponse.tickets[0];

  //2017-06-07T00:00:00+02:00
  const startTime = moment.parseZone(reservationResponse.validFrom).unix();
  const endTime = moment.parseZone(reservationResponse.endTime).unix();

  logger.debug("formatResponse customer:", parsedRequest.customer);

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

module.exports.formatReservationResponse = formatReservationResponse;
