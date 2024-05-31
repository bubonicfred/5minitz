/**
 * @fileoverview LDAP server implementation for testing purposes.
 * @module ldap-server
 */

const ldap = require("ldapjs");

/**
 * Array of user objects representing LDAP users.
 * @type {Array<Object>}
 */
const users = [
  {
    dn: "cn=ldapUser1,dc=example,dc=com",
    password: "ldapPwd1",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "ldapUser1",
      mail: "ldapUser1@example.com",
    },
  },
  {
    dn: "cn=ldapUser2,dc=example,dc=com",
    password: "ldapPwd2",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "ldapUser2",
      mail: "ldapUser2@example.com",
    },
  },
  {
    dn: "cn=anotherLdapUser1,ou=germany,ou=europe,dc=example,dc=com",
    password: "ldapPwd",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "anotherLdapUser1",
      mail: "anotherLdapUser1@example.com",
    },
  },
  {
    dn: "cn=anotherLdapUser2,ou=japan,ou=asia,dc=example,dc=com",
    password: "ldapPwd",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "anotherLdapUser2",
      mail: "anotherLdapUser2@example.com",
    },
  },
  {
    dn: "cn=inactiveUser1,dc=example,dc=com",
    password: "ldapPwd",
    attributes: {
      objectclass: ["organization", "top"],
      userAccountControl: 514,
      o: "example",
      cn: "inactiveUser1",
      mail: "inactiveUser1@example.com",
    },
  },
];

/**
 * LDAP server instance.
 * @type {Object}
 */
const server = ldap.createServer();

/**
 * Middleware function to authorize LDAP requests.
 * @param {Object} req - LDAP request object.
 * @param {Object} res - LDAP response object.
 * @param {Function} next - Next middleware function.
 */
function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals("cn=ldapUser1,dc=example,dc=com"))
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

/**
 * Search operation handler for the LDAP server.
 * @param {string} base - Base DN for the search operation.
 * @param {Function} authorize - Authorization middleware function.
 * @param {Function} callback - Callback function.
 */
server.search("dc=example,dc=com", authorize, (req, res, next) => {
  const matches = users.filter((user) => req.filter.matches(user.attributes));
  matches.forEach((match) => res.send(match));

  res.end();
  return next();
});

/**
 * Bind operation handler for the LDAP server.
 * @param {string} base - Base DN for the bind operation.
 * @param {Function} callback - Callback function.
 */
server.bind("dc=example,dc=com", (req, res, next) => {
  const dn = req.dn.toString();
  const normalizedDn = dn.replace(/ /g, "");
  const password = req.credentials;

  console.log(dn, normalizedDn, password);

  const matchingUsers = users.filter((user) => normalizedDn === user.dn);

  console.log(matchingUsers);

  if (matchingUsers.length > 1) {
    return next(new ldap.UnwillingToPerformError());
  }

  if (matchingUsers.length === 0) {
    return next(new ldap.NoSuchObjectError(dn));
  }

  const user = matchingUsers[0];

  if (user.password !== password) {
    return next(new ldap.InvalidCredentialsError());
  }

  res.end();
  return next();
});

/**
 * Start the LDAP server.
 * @param {number} port - Port number to listen on.
 * @param {Function} callback - Callback function.
 */
server.listen(1389, () => {
  console.log(`ldapjs listening at ${server.url}`);
});
