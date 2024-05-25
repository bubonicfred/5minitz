import {expect} from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const Meteor = {
  startup : sinon.mock(),
  settings : {
    ldap : {},
  },
};
const LDAP = {};
const LdapSettings = {
  ldapEnabled : sinon.stub(),
  usernameAttribute : sinon.stub(),
  searchFilter : sinon.stub(),
  serverDn : sinon.stub(),
  allowSelfSignedTLS : sinon.stub().returns(false),
};

const {ldap} = proxyquire("../../../server/ldap", {
  "meteor/meteor" : {Meteor, "@noCallThru" : true},
  "/imports/config/LdapSettings" : {LdapSettings, "@noCallThru" : true},
  "meteor/babrahams:accounts-ldap" : {LDAP, "@noCallThru" : true},
});
// skipcq: JS-0241
describe("ldap", function() {
  // skipcq: JS-0241
  describe("#bindValue", function() {
    // skipcq: JS-0241
    beforeEach(function() {
      Meteor.settings = {
        ldap : {
          enabled : true,
        },
      };

      LdapSettings.ldapEnabled.reset();
      LdapSettings.ldapEnabled.returns(true);
      LdapSettings.serverDn.reset();
      LdapSettings.serverDn.returns("dc=example,dc=com");
      LdapSettings.usernameAttribute.reset();
      LdapSettings.usernameAttribute.returns("test");
    });
    // skipcq: JS-0241
    it("generates a dn based on the configuration and the given username",
       function() {
         const isEmail = false;
         const username = "username";

         const result = LDAP.bindValue(username, isEmail);

         expect(result).to.equal("test=username,dc=example,dc=com");
       });
    // skipcq: JS-0241
    it("removes the host part if an email address is given", function() {
      const isEmail = true;
      const username = "username@example.com";

      const result = LDAP.bindValue(username, isEmail);

      expect(result).to.equal("test=username,dc=example,dc=com");
    });
    // skipcq: JS-0241
    it("returns an empty string if ldap is not enabled", function() {
      LdapSettings.ldapEnabled.returns(false);

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });
    // skipcq: JS-0241
    it("returns an empty string if serverDn is not set", function() {
      LdapSettings.serverDn.returns("");

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });

    // skipcq: JS-0241
    it("returns an empty string if no username attribute mapping is not defined",
       function() {
         LdapSettings.usernameAttribute.returns("");

         const result = LDAP.bindValue();

         expect(result).to.equal("");
       });
  });
  // skipcq: JS-0241
  describe("#filter", function() {
    // skipcq: JS-0241
    beforeEach(function() {
      LdapSettings.usernameAttribute.reset();
      LdapSettings.searchFilter.reset();

      Meteor.settings = {
        ldap : {
          enabled : true,
        },
      };
    });
    // skipcq: JS-0241
    it("generates a dn based on the configuration and the given username",
       function() {
         LdapSettings.usernameAttribute.returns("test");
         LdapSettings.searchFilter.returns("");

         const isEmail = false;
         const username = "username";

         const result = LDAP.filter(isEmail, username);

         expect(result).to.equal("(&(test=username))");
       });
    // skipcq: JS-0241
    it("removes the host part if an email address is given", function() {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("");

      const isEmail = true;
      const username = "username@example.com";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });
    // skipcq: JS-0241
    it("still works if searchFilter is undefined", function() {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns();

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    // skipcq: JS-0241
    it("appends the searchFilter configuration to the filter", function() {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("(objectClass=user)");

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username)(objectClass=user))");
    });
    // skipcq: JS-0241
    it("returns an empty string if the ldap configuration is missing",
       function() {
         delete Meteor.settings.ldap;

         const result = LDAP.filter();

         expect(result).to.equal("");
       });
    // skipcq: JS-0241
    it("returns an empty string if ldap is not enabled", function() {
      Meteor.settings.ldap.enabled = false;

      const result = LDAP.filter();

      expect(result).to.equal("");
    });
    // skipcq: JS-0241
    it("returns an empty string if searchDn is not set", function() {
      const result = LDAP.filter();

      expect(result).to.equal("");
    });
  });
  // skipcq: JS-0241
  describe("#addFields", function() {
    // skipcq: JS-0241
    it("returns an object with a password property that holds an empty string",
       function() {
         const expectedResult = {
           password : "",
         };

         const result = LDAP.addFields();

         expect(result).to.deep.equal(expectedResult);
       });
  });
  // skipcq: JS-0241
  describe("#log", function() {
    // skipcq: JS-0241
    beforeEach(function() {
      sinon.spy(console, "log");
      sinon.spy(console, "error");
      sinon.spy(console, "warn");
    });
    // skipcq: JS-0241
    afterEach(function() {
      console.log.restore();
      console.error.restore();
      console.warn.restore();
    });
    // skipcq: JS-0241
    it("forwards error messages to the console", function() {
      const message = "some error";

      LDAP.error(message);

      expect(console.error.calledOnce).to.be.true;
    });
    // skipcq: JS-0241
    it("forwards warning messages to the console", function() {
      const message = "some warning";

      LDAP.warn(message);

      expect(console.warn.calledOnce).to.be.true;
    });
  });
});
