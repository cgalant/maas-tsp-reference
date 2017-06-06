'use strict';

// Module dependencies
const request = require('request-promise-lite');

// Configuration
//const QUICKTICKET_ENDPOINT_URL = process.env.QUICKTICKET_ENDPOINT_URL;
const QUICKTICKET_ENDPOINT_URL = 'https://test.flygbussarna.se/qt/api/';

const USER_TOKEN = 'IpaKy3jEcAdI/gb2XfvZ0JQYsZareeqr/FhcQk8lcFv5w3Z4JkOGe4rpgNcFu02mzRCekqjawqkE1VU4nLQERtdqjPfi8738oel9fSWLF2NeLiU0AMebASc9I0BeKFgpL9dRwqnlu342WR9unI1Dot6BpB/BIW83/lwdelPy+7YtO4cLZSF+FJduSUVvT9rvDCjKUIHXnEYV5CiSozLulQ==';

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
        return Promise.reject(error);
    });
};

const create = () => {

}

module.exports = {
  pricelist: pricelist
}