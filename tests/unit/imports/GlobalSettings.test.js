import {expect} from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

class MeteorError {}
const Meteor = {
  Error : MeteorError,
  absoluteUrl : (path, config) => {
    if (!path)
      path = "";

    if (config?.rootUrl) {
      if (path !== "")
        path = `/${path}`;
      return config.rootUrl + path;
    }
    return path;
  },
};

const LdapSettings = {
  publish : sinon.stub(),
};

const {GlobalSettings} = proxyquire(
    "../../../imports/config/GlobalSettings",
    {
      "meteor/meteor" : {Meteor, "@noCallThru" : true},
      "/imports/config/LdapSettings" : {LdapSettings, "@noCallThru" : true},
    },
);
// skipcq: JS-0241
describe("GlobalSettings", function() {
  // skipcq: JS-0241
  beforeEach("publish public settings", function() {
    Meteor.settings = require("../../../settings_sample.json");
    GlobalSettings.publishSettings();
  });
  // skipcq: JS-0241
  describe("#getRootUrl", function() {
    // skipcq: JS-0241
    it("returns the correct value", function() {
      expect(GlobalSettings.getRootUrl()).to.equal(Meteor.settings.ROOT_URL);
    });
    // skipcq: JS-0241
    it("returns an empty string if property is not set", function() {
      delete Meteor.settings.ROOT_URL;
      expect(GlobalSettings.getRootUrl()).to.equal("");
    });
    // skipcq: JS-0241
    it("does not fail if no settings file give", function() {
      Meteor.settings = {};
      expect(GlobalSettings.getRootUrl()).to.equal("");
    });
  });
  // skipcq: JS-0241
  describe("#isTrustedIntranetInstallation", function() {
    // skipcq: JS-0241
    it("returns the correct value", function() {
      expect(GlobalSettings.isTrustedIntranetInstallation())
          .to.equal(
              Meteor.settings.trustedIntranetInstallation,
          );
    });
    // skipcq: JS-0241
    it("returns false if property is not set", function() {
      delete Meteor.settings.trustedIntranetInstallation;
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.be.false;
    });
    // skipcq: JS-0241
    it("does not fail if no settings file give", function() {
      Meteor.settings = {};
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.be.false;
    });
  });
  // skipcq: JS-0241
  describe("#getDefaultEmailSenderAddress", function() {
    // skipcq: JS-0241
    it("returns the default email sender address", function() {
      expect(GlobalSettings.getDefaultEmailSenderAddress())
          .to.equal(
              Meteor.settings.email.defaultEMailSenderAddress,
          );
    });
    // skipcq: JS-0241
    it("returns the alternative address of the current user if property is left empty",
       function() {
         Meteor.settings.email.defaultEMailSenderAddress = "";
         const alternative = "alternativeSenderAddress";
         expect(GlobalSettings.getDefaultEmailSenderAddress(alternative))
             .to.equal(
                 alternative,
             );
       });
    // skipcq: JS-0241
    it("returns fallback sender address if no alternative address is given",
       function() {
         Meteor.settings.email.defaultEMailSenderAddress = "";
         expect(GlobalSettings.getDefaultEmailSenderAddress())
             .to.equal(
                 Meteor.settings.email.fallbackEMailSenderAddress,
             );
       });
    // skipcq: JS-0241
    it("throws exception if fallback sender address required but not given",
       function() {
         Meteor.settings.email.defaultEMailSenderAddress = "";
         delete Meteor.settings.email.fallbackEMailSenderAddress;
         let exceptionThrown;
         try {
           GlobalSettings.getDefaultEmailSenderAddress();
           exceptionThrown = false;
         } catch (e) {
           exceptionThrown = e instanceof MeteorError;
         }

         expect(exceptionThrown, "Method did not throw exception").to.be.true;
       });
    // skipcq: JS-0241
    it("throws exception if property is not set", function() {
      delete Meteor.settings.email.defaultEMailSenderAddress;

      let exceptionThrown;
      try {
        GlobalSettings.getDefaultEmailSenderAddress();
        exceptionThrown = false;
      } catch (e) {
        exceptionThrown = e instanceof MeteorError;
      }

      expect(exceptionThrown, "Method did not throw exception").to.be.true;
    });
  });
  // skipcq: JS-0241
  describe("#isEMailDeliveryEnabled", function() {
    // skipcq: JS-0241
    it("returns the correct value", function() {
      expect(GlobalSettings.isEMailDeliveryEnabled())
          .to.equal(
              Meteor.settings.email.enableMailDelivery,
          );
    });
    // skipcq: JS-0241
    it("returns false if property is not set", function() {
      delete Meteor.settings.email.enableMailDelivery;
      GlobalSettings.publishSettings();
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.be.false;
    });
    // skipcq: JS-0241
    it("does not fail if no settings file give", function() {
      Meteor.settings = {};
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.be.false;
    });
  });
  // skipcq: JS-0241
  describe("#getMailDeliverer", function() {
    // skipcq: JS-0241
    it("returns the correct value", function() {
      expect(GlobalSettings.getMailDeliverer())
          .to.equal(
              Meteor.settings.email.mailDeliverer,
          );
    });
    // skipcq: JS-0241
    it("returns smtp if property is not set", function() {
      delete Meteor.settings.email.mailDeliverer;
      expect(GlobalSettings.getMailDeliverer()).to.equal("smtp");
    });
    // skipcq: JS-0241
    it("does not fail if no settings file give", function() {
      Meteor.settings = {};
      expect(GlobalSettings.getMailDeliverer()).to.equal("smtp");
    });
  });
  // skipcq: JS-0241
  describe("#getSMTPMailUrl", function() {
    // skipcq: JS-0241
    it("returns the correct value", function() {
      expect(GlobalSettings.getSMTPMailUrl())
          .to.equal(
              Meteor.settings.email.smtp.mailUrl,
          );
    });
    // skipcq: JS-0241
    it("returns an empty string if property is not set", function() {
      delete Meteor.settings.email.smtp.mailUrl;
      expect(GlobalSettings.getSMTPMailUrl()).to.equal("");
    });
    // skipcq: JS-0241
    it("does not fail if no settings file give", function() {
      Meteor.settings = {};
      expect(GlobalSettings.getSMTPMailUrl()).to.equal("");
    });
  });
  // skipcq: JS-0241
  describe("#getMailgunSettings", function() {
    // skipcq: JS-0241
    it("returns the correct value", function() {
      expect(GlobalSettings.getMailgunSettings())
          .to.equal(
              Meteor.settings.email.mailgun,
          );
    });
    // skipcq: JS-0241
    it("throws exception if property is not set", function() {
      delete Meteor.settings.email.mailgun;

      let exceptionThrown;
      try {
        GlobalSettings.getMailgunSettings();
        exceptionThrown = false;
      } catch (e) {
        exceptionThrown = e instanceof MeteorError;
      }

      expect(exceptionThrown, "Method did not throw exception").to.be.true;
    });
  });
});
