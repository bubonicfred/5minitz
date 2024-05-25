import { expect } from "chai";

import { subElementsHelper } from "../../../../imports/helpers/subElements";
// skipcq JS-0241
describe("subElementsHelper", function () {
  // skipcq JS-0241
  describe("#findIndexById", function () {
    // skipcq JS-0241
    it("returns undefined if an empty list is given", function () {
      const list = [];
      const id = "someId";

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.be.undefined;
    });
    // skipcq JS-0241
    it("returns undefined if the given id is not found", function () {
      const list = [{}, {}, {}];
      const id = "someId";

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.be.undefined;
    });
    // skipcq JS-0241
    it("returns the index of the element with the given id", function () {
      const id = "someId";
      const list = [{}, { _id: "someId" }, {}];

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.equal(1);
    });
    // skipcq JS-0241
    it("returns the index of the element with the given id it first encounters", function () {
      const id = "someId";
      const list = [{}, { _id: id }, { _id: id }];

      const result = subElementsHelper.findIndexById(id, list);

      expect(result).to.equal(1);
    });
  });
});
