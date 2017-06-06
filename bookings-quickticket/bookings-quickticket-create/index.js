/**
 * Booking create responder
 * @param {object} event
 * @param {function} callback
 * @returns {Promise} A promise that lastly calls `callback` with the TSP response
 */
const create = (event, callback) => {
  return validateEventData(event)
    .then(event => citybikesAPI.create(event.customer.phone))
    .then(userAndPIN => formatResponse(userAndPIN, event))
    .then(result => callback(null, result))
    .catch(error => callback(error));
};

module.exports.create = create;