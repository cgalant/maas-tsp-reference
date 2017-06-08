'use strict';

// Module dependencies
const request = require('request-promise-lite');
const log4js = require('log4js');
const logger = log4js.getLogger("QUICKTICKET-API");

// Configuration
//const QUICKTICKET_ENDPOINT_URL = process.env.QUICKTICKET_ENDPOINT_URL;
const QUICKTICKET_ENDPOINT_URL = 'https://test.flygbussarna.se/qt/api/';

const USER_TOKEN = 'ja7vkdArCg7g8rKjLedASdeAENyY1b32tJJtccVxMyNJQVQhuBFzIQQE7f0gdAbrW+drJUOy5gRKlT48MeF5wwRZAnradYojdqb+bKZShVDmqOPg0XNn32gHGF3W122ODEwP+bReortIMhR1JkOk/5yncBSWP/cJY/Cy6lBTnbDePaqvHno7hmWYdVOeOFc5g/6DCco+TPmdD7txFFjtjw==';

const pricelist = () => {
  logger.info("call pricelist");
  return request
    .get(`${QUICKTICKET_ENDPOINT_URL}/pricelist`, {
      headers: {
        'Content-Type':'application/json',
        'Accept':'application/json',
        'X-AuthToken': USER_TOKEN
      },
      json: true
      //,verbose: true
    })
    .then(response => response)
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
      headers: {
        'Content-Type':'application/json',
        'Accept':'application/json',
        'X-AuthToken': USER_TOKEN
      },
      body: body,
      json: true
      //,verbose: true
    })
    .then(response => {
      logger.info("reservation created with id="+response.reservationId);
      logger.debug("create response", response);
      return response
    })
    .catch(error => {
      logger.error("create error:", error);
      return Promise.reject(error);
    });
};

const getReservation = (id) => {
  return request
    .get(`${QUICKTICKET_ENDPOINT_URL}/reservation/${id}`, {
      headers: {
        'Content-Type':'application/json',
        'Accept':'application/json',
        'X-AuthToken': USER_TOKEN
      },
      json: true
      //,verbose: true
    })
    .then(response => response)
    .catch(error => {
//      console.error("get reservation error:", error);
      return Promise.reject(error);
    });
};

const cancel = (id) => {
  return request
    .del(`${QUICKTICKET_ENDPOINT_URL}/reservation/${id}`, {
      headers: {
        'Content-Type':'application/json',
        'Accept':'application/json',
        'X-AuthToken': USER_TOKEN
      }
    })
    .then(response => response)
    .catch(error => {
//      console.error("cancel reservation error:", error);
      return Promise.reject(error);
    });
}

module.exports = {
  pricelist: pricelist,
  create: create,
  getReservation: getReservation,
  cancel: cancel
}