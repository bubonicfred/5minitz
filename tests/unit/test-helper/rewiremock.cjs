// rewiremock.es6.js
const rewiremock = require('rewiremock/node');
// settings
// ....
// rewiremock.overrideEntryPoint(module);
// this is important. This command is "transfering" this module parent to rewiremock
module.exports = rewiremock;
