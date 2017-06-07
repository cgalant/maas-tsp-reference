'use strict';

// Module dependencies
const request = require('request-promise-lite');

// Configuration
//const QUICKTICKET_ENDPOINT_URL = process.env.QUICKTICKET_ENDPOINT_URL;
const QUICKTICKET_ENDPOINT_URL = 'https://test.flygbussarna.se/qt/api/';

const USER_TOKEN = 'ja7vkdArCg7g8rKjLedASdeAENyY1b32tJJtccVxMyNJQVQhuBFzIQQE7f0gdAbrW+drJUOy5gRKlT48MeF5wwRZAnradYojdqb+bKZShVDmqOPg0XNn32gHGF3W122ODEwP+bReortIMhR1JkOk/5yncBSWP/cJY/Cy6lBTnbDePaqvHno7hmWYdVOeOFc5g/6DCco+TPmdD7txFFjtjw==';

const pricelist = () => {
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
//      console.error("pricelist error:", error);
        return Promise.reject(error);
    });
};

const create = (ticketId) => {

  const body = {
    tickets:[
      { ticketId: ticketId, quantity: 1 }
      ]
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
    .then(response => response)
    .catch(error => {
//      console.error("create error:", error);
      return Promise.reject(error);
    });
}

module.exports = {
  pricelist: pricelist,
  create: create
}