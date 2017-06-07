const moment = require('moment');

var d = "2017-06-07T00:00:00+02:00";


console.log(d);
var m = moment(d);
console.log(m);
console.log(m.isValid());
console.log(m.unix());
console.log(m.format("x"));

var m2 = moment.parseZone(d);
console.log(m2);
console.log(m2.isValid());
console.log(m2.unix());
