'use strict';

// Module dependencies
const request = require('request-promise-lite');
const log4js = require('./logging-config');
const logger = log4js.getLogger("QUICKTICKET-API");


// Configuration
const QUICKTICKET_ENDPOINT_URL = process.env.QUICKTICKET_ENDPOINT_URL || 'https://test.flygbussarna.se/qt/api/';
const QUICKTICKET_USERNAME = process.env.QUICKTICKET_USERNAME || 'DIGITALFAC';
const QUICKTICKET_PASSWORD = process.env.QUICKTICKET_PASSWORD || '26hm4Lwm*ZCz#zE+';
const QUICKTICKET_CLIENT_IP = process.env.QUICKTICKET_CLIENT_IP || '80.15.195.217';

var USER_TOKEN = '1r6JiVX9ddLVDuSxzyorQgwez0AJW+6psSmpU36ugDVyFzB77FGObOFd1FZLNb1bAWDPac24EdTGS1NTASnt6n1Uf6BulxaichcvyXKV4pEg06J9XwjytumkT96ZgAB2/It09gIjw9T4U8ihK+t4hb7epDIH5KlMVbvlG0ls7DkJYfObWmWQOn/Ud2DgnT3H';

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
        USER_TOKEN = response.token;
        return Promise.resolve(response.token);
      }else{
        logger.error("authenticate failed", response);
        return Promise.reject(response);
      }
    }).catch(error => {
      logger.error("authenticate error:", error);
      return Promise.reject(error);
    });

}

const _pricelist = (authToken) => {
  logger.debug("call _pricelist with authToken="+authToken);
  return request
    .get(`${QUICKTICKET_ENDPOINT_URL}/pricelist`, {
      headers: headersWithToken(authToken || USER_TOKEN),
      json: true
     // ,verbose: true
    })
    .then(response => {
      logger.info("pricelist response returns with id=" + response.pricelistId);
      logger.debug("pricelist response", response);
      return response;
    })
};

const pricelist = () => {
  logger.info("call pricelist");
  return _pricelist().catch( error => {
    if(isAuthenticationError(error))
      return authenticate().then(_pricelist).catch(error => { return traceError(error, "catch last _pricelist error") })
    else
      return traceError(error, 'pricelist error');
  });
};

const _create = (ticketId, customer, authToken) => {
  logger.debug("call _create with ticketId=" + ticketId + " &customer=", customer + " &authToken=", authToken);

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
      headers: headersWithToken(authToken || USER_TOKEN),
      body: body,
      json: true
      //,verbose: true
    })
    .then(response => {
      logger.info("reservation created with id="+response.reservationId);
      logger.debug("create response", response);
      return response
    })

};

const create = (ticketId, customer) => {
  logger.info("call create with ticketId=" + ticketId + " &customer=", customer);
  return _create(ticketId, customer).catch(error => {
    if(isAuthenticationError(error))
      return authenticate().then(token => _create(ticketId, customer, token)).catch(error => { return traceError(error, "catch last _create error")})
    else
      return traceError(error, 'create error');
  });
}

const _getReservation = (id, authToken) => {
  logger.debug("call _getReservationDetail with id=" + id + " &authToken="+authToken);
  return request
    .get(`${QUICKTICKET_ENDPOINT_URL}/reservation/${id}`, {
      headers: headersWithToken(authToken || USER_TOKEN),
      json: true
      //,verbose: true
    })
    .then(response => response)
};

const getReservation = (id) => {
  logger.info("call getReservationDetail with id=" + id);
  return _getReservation(id).catch(error => {
    if(isAuthenticationError(error))
      return authenticate().then(token => _getReservation(id, token)).catch(err => { return traceError(err, "catch last _getReservation error"); });
    else {
      return traceError(error, "getReservationDetail error");
    }
  });
};

const isAuthenticationError = (error) => {
  return (error && error.message && error.message.indexOf('Invalid token')>0);
}

const traceError= (error, msg) => {
  if(error && error.message)
    logger.error(msg+ ' => '+ error.message);
  else
    logger.error(msg, error);
  return Promise.reject(error);
}

const _cancel = (id, authToken) => {
  logger.debug("call _cancel reservation with id="+id+ " &authToken="+authToken);
  return request
    .del(`${QUICKTICKET_ENDPOINT_URL}/reservation/${id}`, {
      headers: headersWithToken(authToken || USER_TOKEN),
    })
    .then(response => response)
    .catch(error => {
      logger.error("cancel reservation error:", error);
      return Promise.reject(error);
    });
};
const cancel = (id) => {
  logger.info("call cancel reservation with id=" + id);
  return _cancel(id).catch(error => authenticate().then(token => _cancel(id, token)).catch(error => { logger.error("catch last _cancel error", error); return Promise.reject(error);}));
};

module.exports = {
  authenticate:authenticate,
  pricelist: pricelist,
  create: create,
  getReservation: getReservation,
  cancel: cancel
}