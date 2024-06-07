import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const Meteor = {
  startup: sinon.mock(),
  settings: {
    ldap: {},
  },
};
const LDAP = {};
const LdapSettings = {
  usernameAttribute: sinon.stub(),
  searchFilter: sinon.stub(),
  serverDn: sinon.stub(),
  allowSelfSignedTLS: sinon.stub().returns(false),
  ldapEndabled: undefined
};

const { ldap } = proxyquire("../../../server/ldap", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/config/LdapSettings": { LdapSettings, "@noCallThru": true },
  "meteor/babrahams:accounts-ldap": { LDAP, "@noCallThru": true },
});

describe("ldap", () => {
  describe("searchValue", () => {
    it("should return an empty string if ldap is not enabled", () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(false);
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      const result = LDAP.searchValue(isEmailAddress, usernameOrEmail);
      expect(result).to.equal("");
      LdapSettings.ldapEnabled.restore();
    });

    it("should return the search value for username if ldap is enabled", () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(true);
      sinon.stub(LdapSettings, "usernameAttribute").returns("username");
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      const result = LDAP.searchValue(isEmailAddress, usernameOrEmail);
      expect(result).to.equal("testuser");
      LdapSettings.ldapEnabled.restore();
      LdapSettings.usernameAttribute.restore();
    });

    it("should return the search value for email if ldap is enabled", () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(true);
      sinon.stub(LdapSettings, "usernameAttribute").returns("email");
      const isEmailAddress = true;
      const usernameOrEmail = "testuser@example.com";
      const result = LDAP.searchValue(isEmailAddress, usernameOrEmail);
      expect(result).to.equal("testuser");
      LdapSettings.ldapEnabled.restore();
      LdapSettings.usernameAttribute.restore();
    });
  });

  describe("searchField", () => {
    it("should return the username attribute from LdapSettings", () => {
      const result = LDAP.searchField;
      expect(result).to.equal(LdapSettings.usernameAttribute());
    });
  });

  describe("searchValueType", () => {
    it("should be set to 'username'", () => {
      const result = LDAP.searchValueType;
      expect(result).to.equal("username");
    });
  });

  describe("bindValue", () => {
    it("should return an empty string if ldap is not enabled", async () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(false);
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      const result = await LDAP.bindValue(usernameOrEmail, isEmailAddress);
      expect(result).to.equal("");
      LdapSettings.ldapEnabled.restore();
    });

    it("should return the search DN if ldap is enabled and user is found", async () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(true);
      sinon.stub(LdapSettings, "serverDn").returns("dc=example,dc=com");
      sinon.stub(LdapSettings, "usernameAttribute").returns("username");
      sinon
        .stub(Meteor.users, "findOneAsync")
        .resolves({ profile: { dn: "uid=testuser,dc=example,dc=com" } });
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      const result = await LDAP.bindValue(usernameOrEmail, isEmailAddress);
      expect(result).to.equal("uid=testuser,dc=example,dc=com");
      LdapSettings.ldapEnabled.restore();
      LdapSettings.serverDn.restore();
      LdapSettings.usernameAttribute.restore();
      Meteor.users.findOneAsync.restore();
    });

    it("should return an empty string if ldap is enabled but user is inactive", async () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(true);
      sinon.stub(LdapSettings, "serverDn").returns("dc=example,dc=com");
      sinon.stub(LdapSettings, "usernameAttribute").returns("username");
      sinon.stub(Meteor.users, "findOneAsync").resolves({ isInactive: true });
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      await expect(
        LDAP.bindValue(usernameOrEmail, isEmailAddress)
      ).to.be.rejectedWith(Meteor.Error, "User is inactive");
      LdapSettings.ldapEnabled.restore();
      LdapSettings.serverDn.restore();
      LdapSettings.usernameAttribute.restore();
      Meteor.users.findOneAsync.restore();
    });
  });

  describe("filter", () => {
    it("should return an empty string if ldap is not enabled", () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(false);
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      const result = LDAP.filter(isEmailAddress, usernameOrEmail);
      expect(result).to.equal("");
      LdapSettings.ldapEnabled.restore();
    });

    it("should return the LDAP filter string", () => {
      sinon.stub(LdapSettings, "ldapEnabled").returns(true);
      sinon.stub(LdapSettings, "usernameAttribute").returns("username");
      sinon.stub(LdapSettings, "searchFilter").returns("(objectClass=person)");
      const isEmailAddress = false;
      const usernameOrEmail = "testuser";
      const result = LDAP.filter(isEmailAddress, usernameOrEmail);
      expect(result).to.equal("(&(username=testuser)(objectClass=person))");
      LdapSettings.ldapEnabled.restore();
      LdapSettings.usernameAttribute.restore();
      LdapSettings.searchFilter.restore();
    });
  });

  describe("addFields", () => {
    it("should return an object with password field set to an empty string", () => {
      const result = LDAP.addFields();
      expect(result).to.deep.equal({ password: "" });
    });
  });

  describe("onSignIn", () => {
    it("should update the user document to set isLDAPuser to true", async () => {
      const userDocument = { _id: "123" };
      sinon.stub(Meteor.users, "updateAsync").resolves();
      await LDAP.onSignIn(userDocument);
      expect(
        Meteor.users.updateAsync.calledOnceWithExactly(
          { _id: userDocument._id },
          { $set: { isLDAPuser: true } }
        )
      ).to.be.true;
      Meteor.users.updateAsync.restore();
    });
  });

  describe("logging", () => {
    it("should be set to false", () => {
      const result = LDAP.logging;
      expect(result).to.be.false;
    });
  });

  describe("warn", () => {
    it("should log a warning message to the console", () => {
      const message = "This is a warning";
      sinon.stub(console, "warn");
      LDAP.warn(message);
      expect(console.warn.calledOnceWithExactly(message)).to.be.true;
      console.warn.restore();
    });
  });

  describe("error", () => {
    it("should log an error message to the console", () => {
      const message = "This is an error";
      sinon.stub(console, "error");
      LDAP.error(message);
      expect(console.error.calledOnceWithExactly(message)).to.be.true;
      console.error.restore();
    });
  });
});
