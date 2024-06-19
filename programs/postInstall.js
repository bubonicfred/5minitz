"use strict";
import pkg from "fs-extra";
const { copySync, removeSync } = pkg;

console.log("copy bootstrap fonts to the public folder");
copySync("./node_modules/bootstrap/dist/fonts", "./public/fonts");

console.log("force eonasdan-bootstrap-datetimepicker to use the global jquery");
removeSync("./node_modules/eonasdan-bootstrap-datetimepicker/node_modules");
