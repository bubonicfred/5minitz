// rewiremock.es6.js
import rewiremock from "rewiremock";
// settings
// ....
rewiremock.overrideEntryPoint(module); // this is important. This command is "transfering" this module
// parent to rewiremock
export { rewiremock };
