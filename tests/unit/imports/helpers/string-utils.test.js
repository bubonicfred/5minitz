import { expect } from "chai";

import { StringUtils } from "../../../../imports/helpers/string-utils";

// skipcq: JS-0241
describe("StringUtils", function () {
  // skipcq: JS-0241
  describe("#eraseSubstring", function () {
    // skipcq: JS-0241
    it("removes the substring which has both a leading and following blank and leaves just a single blank", function () {
      const string = "foo remove-it bar";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("foo bar");
    });
    // skipcq: JS-0241
    it("removes the substring which is at the end of the string and has no following blank", function () {
      const string = "foo remove-it";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("foo");
    });
    // skipcq: JS-0241
    it("removes the substring which is at the start of the string and has no leading blank", function () {
      const string = "remove-it bar";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("bar");
    });

    // skipcq: JS-0241
    it("returns an empty string if string and substring are equal", function () {
      const string = "remove-it";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("");
    });
  });
});
