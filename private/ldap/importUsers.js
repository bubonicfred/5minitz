import importUsers from "../../imports/ldap/import";
import loadLDAPSettings from "../../imports/ldap/loadLDAPSettings";

const optionParser = require("node-getopt").create([
  ["s", "settings=[ARG]", "4minitz Meteor settings file"],
  ["m", "mongourl=[ARG]", "Mongo DB url"],
  ["h", "help", "Display this help"],
]);
const arg = optionParser.bindHelp().parseSystem();

// check preconditions
// we need a meteor settings file for the ldap settings and we
// need a mongo url
//
// the meteor settings file has to be provided via command line parameters
//
// for the mongo url, first check environment variables, then
// parameters and if neither provides a url, exit with an error

if (!arg.options.settings) {
  optionParser.showHelp();
  throw new Error("No 4minitz settings file given.");
}

const meteorSettingsFile = arg.options.settings;
const mongoUrl = arg.options.mongourl || process.env.MONGO_URL;

if (!mongoUrl) {
  optionParser.showHelp();
  throw new Error("No mongo url found in env or given as parameter.");
}

loadLDAPSettings(meteorSettingsFile)
  .then((ldapSettings) => importUsers(ldapSettings, mongoUrl))
  .catch((error) => {
    console.warn(
      `An error occurred while reading the settings file or importing users: ${error}`,
    );
  });
