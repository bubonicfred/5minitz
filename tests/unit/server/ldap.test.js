import { expect } from "chai";
import proxyquire from "proxyquire";
import { mock, stub, spy, createSandbox } from "sinon";
import { Meteor } from "meteor/meteor";
import { LDAP } from "meteor/babrahams:accounts-ldap";
import { LdapSettings } from "/imports/config/LdapSettings";

// skipcq: JS-0241
describe("ldap", function () {
  let sandbox;
  // skipcq: JS-0241
  beforeEach(function () {
    sandbox = createSandbox();

    // Stub the entire Meteor, LDAP, and LdapSettings modules
    sandbox.stub(Meteor, "startup");
    sandbox.stub(Meteor.settings, "ldap").value({});
    sandbox.stub(LDAP, "bindValue").callsFake((username, isEmail) => {
      // Implement fake logic or return value
    });
    sandbox.stub(LdapSettings, "ldapEnabled").returns(false);
    sandbox.stub(LdapSettings, "usernameAttribute").returns("");
    sandbox.stub(LdapSettings, "searchFilter").returns("");
    sandbox.stub(LdapSettings, "serverDn").returns("");
    sandbox.stub(LdapSettings, "allowSelfSignedTLS").returns(false);
  });

  // skipcq: JS-0241
  afterEach(function () {
    sandbox.restore();
  });
  // skipcq: JS-0241
  describe("#bindValue", function () {
    // skipcq: JS-0241
    beforeEach(function () {
      Meteor.settings = {
        ldap: {
          enabled: true,
        },
      };

      LdapSettings.ldapEnabled.reset();
      LdapSettings.ldapEnabled.returns(true);
      LdapSettings.serverDn.reset();
      LdapSettings.serverDn.returns("dc=example,dc=com");
      LdapSettings.usernameAttribute.reset();
      LdapSettings.usernameAttribute.returns("test");
    });

    it("generates a dn based on the configuration and the given username", function () {
      const isEmail = false;
      const username = "username";

      const result = LDAP.bindValue(username, isEmail);

      expect(result).to.equal("test=username,dc=example,dc=com");
    });

    it("removes the host part if an email address is given", function () {
      const isEmail = true;
      const username = "username@example.com";

      const result = LDAP.bindValue(username, isEmail);

      expect(result).to.equal("test=username,dc=example,dc=com");
    });

    it("returns an empty string if ldap is not enabled", function () {
      LdapSettings.ldapEnabled.returns(false);

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });

    it("returns an empty string if serverDn is not set", function () {
      LdapSettings.serverDn.returns("");

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });

    it("returns an empty string if no username attribute mapping is not defined", function () {
      LdapSettings.usernameAttribute.returns("");

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });
  });

  describe("#filter", function () {
    beforeEach(function () {
      LdapSettings.usernameAttribute.reset();
      LdapSettings.searchFilter.reset();

      Meteor.settings = {
        ldap: {
          enabled: true,
        },
      };
    });

    it("generates a dn based on the configuration and the given username", function () {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("");

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    it("removes the host part if an email address is given", function () {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("");

      const isEmail = true;
      const username = "username@example.com";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    it("still works if searchFilter is undefined", function () {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns();

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    it("appends the searchFilter configuration to the filter", function () {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("(objectClass=user)");

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username)(objectClass=user))");
    });

    it("returns an empty string if the ldap configuration is missing", function () {
      delete Meteor.settings.ldap;

      const result = LDAP.filter();

      expect(result).to.equal("");
    });

    it("returns an empty string if ldap is not enabled", function () {
      Meteor.settings.ldap.enabled = false;

      const result = LDAP.filter();

      expect(result).to.equal("");
    });

    it("returns an empty string if searchDn is not set", function () {
      const result = LDAP.filter();

      expect(result).to.equal("");
    });
  });

  describe("#addFields", function () {
    it("returns an object with a password property that holds an empty string", function () {
      const expectedResult = {
        password: "",
      };

      const result = LDAP.addFields();

      expect(result).to.deep.equal(expectedResult);
    });
  });

  describe("#log", function () {
    beforeEach(function () {
      spy(console, "log");
      spy(console, "error");
      spy(console, "warn");
    });

    afterEach(function () {
      console.log.restore();
      console.error.restore();
      console.warn.restore();
    });

    it("forwards error messages to the console", function () {
      const message = "some error";

      LDAP.error(message);

      expect(console.error.calledOnce).to.be.true;
    });

    it("forwards warning messages to the console", function () {
      const message = "some warning";

      LDAP.warn(message);

      expect(console.warn.calledOnce).to.be.true;
    });
  });
});
