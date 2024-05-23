import { expect } from "chai";

import transformUser from "../../../../imports/ldap/transformUser";
// skipcq: JS-0241
describe("transformUser", function () {
  // skipcq: JS-0241
  it("defaults to cn for the username when no searchDn is given", function () {
    let ldapSettings = {},
      userData = {
        cn: "username",
      };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.username).to.equal(userData.cn);
  });
  // skipcq: JS-0241
  it("uses the configured attribute as username", function () {
    let ldapSettings = {
        propertyMap: {
          username: "attr",
        },
      },
      userData = {
        cn: "wrongUsername",
        attr: "username",
      };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.username).to.equal(userData.attr);
  });

  // skipcq: JS-0241
  it("uses the given email if given as string", function () {
    const ldapSettings = {};
    const userData = {
      mail: "me@example.com",
    };

    const meteorUser = transformUser(ldapSettings, userData);

    const expectedResult = [
      {
        address: userData.mail,
        verified: true,
        fromLDAP: true,
      },
    ];
    expect(meteorUser.emails).to.deep.equal(expectedResult);
  });

  // skipcq: JS-0241
  it("uses the first email if given an array", function () {
    const ldapSettings = {};
    const userData = {
      mail: ["me@example.com", "me2@example.com"],
    };

    const meteorUser = transformUser(ldapSettings, userData);

    const expectedResult = [
      {
        address: userData.mail[0],
        verified: true,
        fromLDAP: true,
      },
    ];
    expect(meteorUser.emails).to.deep.equal(expectedResult);
  });
  // skipcq: JS-0241
  it("copies over the value of the users profile cn attribute as the profile name", function () {
    let ldapSettings = {},
      profile = {
        cn: "user name",
      },
      userData = { profile };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.profile.name).to.equal(userData.cn);
  });
  // skipcq: JS-0241
  it("copies nothing into the user's profile if no allowlisted fields are given", function () {
    let ldapSettings = {},
      userData = {
        someAttribute: "someValue",
        anotherAttribute: 2,
      };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.profile).to.deep.equal({});
  });
  // skipcq: JS-0241
  it("copies over the attributes given as allowListedFields into the user's profile", function () {
    let ldapSettings = {
        allowListedFields: ["someAttribute", "anotherAttribute"],
      },
      userData = {
        someAttribute: "someValue",
        anotherAttribute: 2,
        anUnexpectedAttribute: true,
      };

    const meteorUser = transformUser(ldapSettings, userData);

    const expectedResult = {
      someAttribute: "someValue",
      anotherAttribute: 2,
    };
    expect(meteorUser.profile).to.deep.equal(expectedResult);
  });
});
