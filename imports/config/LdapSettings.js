// ********************************
// Remember:
// This class is only useful on server side
// ********************************

import _ from "lodash";
import { Meteor } from "meteor/meteor";

/**
 * Retrieves the value at the specified path from the Meteor settings object.
 * If the value is not found, the default value is returned.
 *
 * @param {string} path - The path to the value in the Meteor settings object.
 * @param {*} [def=undefined] - The default value to return if the path is not
 *     found.
 * @returns {*} The value at the specified path, or the default value if not
 *     found.
 */
function get(path, def = undefined) {
  return _.get(Meteor.settings, `ldap.${path}`, def);
}

/**
 * Sets the value of a specific path in the LDAP settings of Meteor.settings.
 * @param {string} path - The path to the LDAP setting.
 * @param {*} value - The value to set for the LDAP setting.
 */
function set(path, value) {
  _.set(Meteor.settings, `ldap.${path}`, value);
}

/**
 * Disables LDAP by setting the "enabled" flag to false.
 */
function disableLdap() {
  set("enabled", false);
}

const defaultPropertyMap = {
  username: "cn",
  email: "mail",
};

const defaultLdapSettings = {
  enabled: false,
  authentication: {},
  searchFilter: "",
  allowSelfSignedTLS: false,
  allowListedFields: [],
  inactiveUsers: { strategy: "none" },
  autopublishFields: [],
  importCronTab: false,
  importOnLaunch: true,
  hideStandardLogin: false,
  label4Username: "Username (LDAP/AD)",
  label4Password: "Password",
};

if (Meteor.isServer) {
  // server only. Otherwise client will see our defaultLdapSettings
  Meteor.settings.ldap = Object.assign(
    defaultLdapSettings,
    Meteor.settings.ldap,
  );
}

/**
 * Represents the settings for LDAP (Lightweight Directory Access Protocol).
 * This class provides static methods to publish, load, and retrieve LDAP
 * settings.
 */
export class LdapSettings {
  static publish() {
    Meteor.settings.public.ldapEnabled = LdapSettings.ldapEnabled();

    Meteor.settings.public.ldapHideStandardLogin =
      LdapSettings.ldapHideStandardLogin();

    Meteor.settings.public.ldapLabel4Username =
      Meteor.settings.ldap.label4Username !== undefined
        ? Meteor.settings.ldap.label4Username
        : defaultLdapSettings.label4Username;

    Meteor.settings.public.ldapLabel4Password =
      Meteor.settings.ldap.label4Password !== undefined
        ? Meteor.settings.ldap.label4Password
        : defaultLdapSettings.label4Password;
  }

  static loadSettings() {
    Meteor.settings.ldap = Object.assign(
      {},
      defaultLdapSettings,
      Meteor.settings.ldap,
    );

    // backwards compatibility: support searchDn property
    const propertyMap = Object.assign({}, defaultPropertyMap);
    const searchDn = get("searchDn");
    if (!get("propertyMap") && searchDn) {
      propertyMap.username = searchDn;
    }

    Meteor.settings.ldap.propertyMap = Object.assign(
      {},
      propertyMap,
      Meteor.settings.ldap.propertyMap,
    );
  }

  static loadSettingsAndPerformSanityCheck() {
    LdapSettings.loadSettings();

    if (!LdapSettings.ldapEnabled()) {
      return;
    }

    if (LdapSettings.ldapServer() === undefined) {
      disableLdap();
      return;
    }

    if (LdapSettings.serverDn() === undefined) {
      disableLdap();
      return;
    }

    const propertyMap = LdapSettings.propertyMap();
    if (!propertyMap.username || !propertyMap.email) {
      disableLdap();
    }
  }

  static ldapEnabled() {
    return get("enabled", false);
  }

  static ldapServer() {
    return get("serverUrl");
  }

  static serverDn() {
    return get("serverDn");
  }

  static searchFilter() {
    return get("searchFilter", "");
  }

  static propertyMap() {
    return get("propertyMap");
  }

  static usernameAttribute() {
    return get("propertyMap.username");
  }

  static emailAttribute() {
    return get("propertyMap.email");
  }

  static allowSelfSignedTLS() {
    return get("allowSelfSignedTLS", false);
  }

  static ldapHideStandardLogin() {
    return LdapSettings.ldapEnabled() &&
      Meteor.settings.ldap.hideStandardLogin !== undefined
      ? Meteor.settings.ldap.hideStandardLogin
      : defaultLdapSettings.hideStandardLogin;
  }
}
