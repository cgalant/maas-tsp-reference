"use strict";

const qtapi = require('./quickticket-api');
const request = require('request-promise-lite');
const fs = require('fs');
const log4js = require('log4js');
const logger = log4js.getLogger("REF-BUILDER");

const createReferential = () => {

  logger.info("call createReferential");

  getAllSubcategories().then(routes => {

    const newRoutesRequests = routes.map(route => {
      return new Promise((resolve, reject) => {
        getRoute(route.subcategoryId).then(locations => {

          const newRoute = Object.assign({}, route, {
            stations: locations,
            first: locations[0],
            last: locations[locations.length - 1]
          });

//        logger.info("newRoute=",newRoute);
          return resolve(newRoute);
        }).catch(error => {
          logger.error("createReferential geRoute(" + route.subcategoryId + ") call error:", error);
          return reject(error);
        });
      });
    });

    Promise.all(newRoutesRequests).then(responses => {
      logger.info("newRoutes", responses);
      fs.writeFileSync('./lib/data/referential.json', JSON.stringify(responses));
    }).catch(error => {
      logger.error("createReferential saving referential error:", error);
      return Promise.reject(error);
    });

  }).catch(error => {
    logger.error("createReferential getAllSubcategories call error:", error);
    return Promise.reject(error);
  });
}

const requestAndSavePriceList = () => {
  qtapi.pricelist().then(responses => {
    logger.info("saving pricelist.json", responses);
    fs.writeFileSync('./lib/data/pricelist.json', JSON.stringify(responses));
  }).catch(error => {
    logger.error("requestAndSavePriceList error:", error);
    //return Promise.reject(error);
  });
}

const loadPriceList = () => {
  const content = fs.readFileSync('./lib/data/pricelist.json');
  const res = JSON.parse(content);
  return res;
}

const getAllSubcategories = () => {
  logger.info("call getAllSubcategories");

  return qtapi.pricelist().then(response => {
    const routesByCat = response.categories.map(cat => {
      const routeBase = {
        id: cat.categoryId,
        name: cat.categoryName
      };
      return cat.subcategories.map(subcat => {
        return Object.assign( {}, routeBase, {
          subcategoryId: subcat.subcategoryId,
          subcategoryName: subcat.subcategoryName
        });
      });
    });

    var routes = [].concat.apply([],routesByCat);
    logger.debug(routes);
    return routes;
  }).catch(error => {
    logger.error("getAllSubcategories error:", error);
    return Promise.reject(error);
  });
}

const getRoute = (subcatId) => {
  logger.info("call getRoute with subcatId="+subcatId);
  return request
    .get(`https://www.flygbussarna.se/maps/wpts-${subcatId}.txt`, {
      headers: {
        //'Content-Type':'application/json',
        //'Accept':'application/json'
        //,'X-AuthToken': USER_TOKEN
        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
      //,json: true
      //,verbose: true
    })
    .then(response => {
      var resp = response.toString().trim();
//      logger.debug("getRoute response:", resp);
      var res = JSON.parse(resp);
      logger.info("getRoute response returns " + res.length+" locations");
//      logger.debug("getRoute response", res);
      return res;
    })
    .catch(error => {
      logger.error("getRoute error:", error);
      //return Promise.reject(error);
      return [];
    });
}


const loadReferential = () => {
  logger.info("call loadReferential");
  const res = fs.readFileSync('./lib/data/referential.json');
  const routes = JSON.parse(res);
  return routes;
}

const extractLocations = () => {
  const routes = loadReferential();
  const locations = routes.map(route => {
    const location1 = createLocation(route, route.first);
    const location2 = createLocation(route, route.last);

    return [location1, location2]
  })

  const flattened = [].concat.apply([],locations);
  const filtered = flattened.filter(loc=>loc!=null);
  var grouped = groupBy(filtered, 'coords');
  logger.info("grouped=", grouped);


  var res = filtered;
  fs.writeFileSync('./lib/data/locations.json', JSON.stringify(res));
  fs.writeFileSync('./lib/data/locationsGroupedBy.json', JSON.stringify(grouped));
  return res;
}

const loadLocations = () => {
  const res = fs.readFileSync('./lib/data/locationsGroupedBy.json');
  const locations = JSON.parse(res);
  return locations;
}

const convertAsList = (locations) => {
  var coords = [];
  for(var key in locations){
//    logger.debug(loc, locations[loc].length);

    const loc = locations[key][0];
    //logger.debug(loc);
    /*
    const newLoc = {
      id: key,
      lat: loc.lat,
      lon: loc.lon
    };*/
    const newLoc = Object.assign({}, loc, {
      id: key
    })
    coords.push(newLoc);
  }
//  logger.debug("coords", coords);
  return coords;

}


function createLocation(route, station){
  if(!station) return null;
//  logger.info("station", station)
  return Object.assign({}, {
    name: station.hpl,
    coords: station.lat+","+station.long,
    lat: station.lat,
    lon: station.long,
    from: {
      categoryId: route.id,
      name: route.name,
      subcategoryId: route.subcategoryId,
      subcategoryName: route.subcategoryName
    }
  })
}

var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

module.exports = {
//  getRoute: getRoute,
  requestAndSavePriceList: requestAndSavePriceList,
  loadPriceList: loadPriceList,
  createReferential: createReferential,
  loadReferential:loadReferential,
  extractLocations:extractLocations,
  loadLocations:loadLocations,
  convertAsList:convertAsList
}