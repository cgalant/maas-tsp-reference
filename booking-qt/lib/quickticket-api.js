'use strict';

// Module dependencies
const request = require('request-promise-lite');
const log4js = require('log4js');
const logger = log4js.getLogger("QUICKTICKET-API");

// Configuration
const QUICKTICKET_ENDPOINT_URL = process.env.QUICKTICKET_ENDPOINT_URL || 'https://test.flygbussarna.se/qt/api/';
const QUICKTICKET_USERNAME = process.env.QUICKTICKET_USERNAME || 'DIGITALFAC';
const QUICKTICKET_PASSWORD = process.env.QUICKTICKET_PASSWORD || '26hm4Lwm*ZCz#zE+';
const QUICKTICKET_CLIENT_IP = process.env.QUICKTICKET_CLIENT_IP || '80.15.195.217';

const USER_TOKEN = 'if8lfyRjp7G030Sj2xAMVGO0gPmDhiWlCTbH4MSRAiWxHH5q0pE5p0TNEKVwPQzPxkWrIdDn3jsCA31KNj+Vqxxhm0kDqZC7zjGNvSitjtT+k6X2wJjurFxbl5j3wB0X6evoKYfvUeJ3FWivZGKQy7bDNOarFGh3Je7m2IZQTfbpJZggq+ym0XmUSdLM5/S+';

const DEFAULT_HEADERS = { 'Content-Type':'application/json', 'Accept':'application/json' }

const headersWithToken = (token) => {
  return Object.assign({}, DEFAULT_HEADERS, {'X-AuthToken': token})
}

const authenticate = () => {
  logger.info("call authenticate");

  var options = {
    headers: DEFAULT_HEADERS,
    body:
      { username: QUICKTICKET_USERNAME,
        password: QUICKTICKET_PASSWORD,
        clientIp:  QUICKTICKET_CLIENT_IP},
    json: true };

  return request.post(`${QUICKTICKET_ENDPOINT_URL}/authentication`,options)
    .then(response => {
      if(response.success){
        logger.info("authenticated with token="+response.token);
        logger.debug("response=",response);
      }else{
        logger.error("authenticate failed", response);
      }
    }).catch(error => {
      logger.error("authenticate error:", error);
      return Promise.reject(error);
    });

}

const pricelist = () => {
  logger.info("call pricelist");
  return request
    .get(`${QUICKTICKET_ENDPOINT_URL}/pricelist`, {
      headers: headersWithToken(USER_TOKEN),
      json: true
      //,verbose: true
    })
    .then(response => {
      logger.info("pricelist response returns with id=" + response.pricelistId);
//      logger.debug("pricelist response", response);
      return response;
    })
    .catch(error => {
        logger.error("pricelist error:", error);
        return Promise.reject(error);
    });
};

const create = (ticketId, customer) => {
  logger.info("call create with ticketId="+ticketId+" &customer=",customer);

  var body = {
    tickets:[
      { ticketId: ticketId, quantity: 1 }
      ]
  };

  if(customer){
    body.customer = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      mobilePhone: customer.phone,
    }
  }

  return request
    .post(`${QUICKTICKET_ENDPOINT_URL}/reservation`, {
      headers: headersWithToken(USER_TOKEN),
      body: body,
      json: true
      //,verbose: true
    })
    .then(response => {
      logger.info("reservation created with id="+response.reservationId);
//      logger.debug("create response", response);
      return response
    })
    .catch(error => {
      logger.error("create error:", error);
      return Promise.reject(error);
    });
};

const getReservation = (id) => {
  logger.info("call getReservationDetail with id="+id);
  return request
    .get(`${QUICKTICKET_ENDPOINT_URL}/reservation/${id}`, {
      headers: headersWithToken(USER_TOKEN),
      json: true
      //,verbose: true
    })
    .then(response => response)
    .catch(error => {
      logger.error("getReservationDetail error:", error);
      return Promise.reject(error);
    });
};

const cancel = (id) => {
  logger.info("call cancel reservation with id="+id);
  return request
    .del(`${QUICKTICKET_ENDPOINT_URL}/reservation/${id}`, {
      headers: headersWithToken(USER_TOKEN),
    })
    .then(response => response)
    .catch(error => {
      logger.error("cancel reservation error:", error);
      return Promise.reject(error);
    });
}

module.exports = {
  authenticate:authenticate,
  pricelist: pricelist,
  create: create,
  getReservation: getReservation,
  cancel: cancel
}