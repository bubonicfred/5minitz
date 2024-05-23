import { expect } from "chai";
import proxyquire from "proxyquire";

class MeteorError {}
const Meteor = {
  Error: MeteorError,
};
// No dependecies left to mock. Replace this with normal import for test
const { ITEM_KEYWORDS } = proxyquire(
  "../../../../imports/search/FilterKeywords",
  {},
);

const { QueryParser } = proxyquire("../../../../imports/search/QueryParser", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
});
// skipcq: JS-0241
describe("QueryParser", function () {
  let parser;
  // skipcq: JS-0241
  beforeEach(function () {
    parser = new QueryParser(ITEM_KEYWORDS);
  });
  // skipcq: JS-0241
  it("parses a simple query string containing only search tokens correctly", function () {
    const QUERY = "hello world";
    parser.parse(QUERY);
    const filterTokens = parser.getFilterTokens();
    const labelTokens = parser.getLabelTokens();
    const searchTokens = parser.getSearchTokens();

    expect(filterTokens, "should contain no filter tokens").to.have.length(0);
    expect(labelTokens, "should contain no label tokens").to.have.length(0);
    expect(searchTokens, "should contain 2 search tokens").to.have.length(2);

    expect(searchTokens).to.contain("hello");
    expect(searchTokens).to.contain("world");
  });
  // skipcq: JS-0241
  it("parses a simple query string containing only label tokens correctly", function () {
    const QUERY = "#label 1 #label zwo";
    parser.parse(QUERY);

    const filterTokens = parser.getFilterTokens();
    const labelTokens = parser.getLabelTokens().map((token) => {
      return token.token;
    });
    const searchTokens = parser.getSearchTokens();

    expect(filterTokens, "should contain no filter tokens").to.have.length(0);
    expect(labelTokens, "should contain 2 label tokens").to.have.length(2);
    expect(searchTokens, "should contain no search tokens").to.have.length(0);

    expect(labelTokens).to.contain("label 1");
    expect(labelTokens).to.contain("label zwo");
  });
  // skipcq: JS-0241
  it("parses a simple query string containing search tokens, keywords and labels correctly", function () {
    const QUERY = "hello is:open world #my label";
    parser.parse(QUERY);
    const filterTokens = parser.getFilterTokens();
    const labelTokens = parser.getLabelTokens().map((token) => {
      return token.token;
    });
    const searchTokens = parser.getSearchTokens();

    expect(filterTokens, "should contain 1 filter tokens").to.have.length(1);
    expect(labelTokens, "should contain 1 label token").to.have.length(1);
    expect(searchTokens, "should contain 2 search tokens").to.have.length(2);

    expect(searchTokens).to.contain("hello");
    expect(searchTokens).to.contain("world");
    expect(filterTokens).to.deep.contain({ key: "is", value: "open", ids: [] });
    expect(labelTokens).to.contain("my label");
  });
  // skipcq: JS-0241
  it("identifies the due-keyword correctly", function () {
    const QUERY = "hello due:2017 world";
    parser.parse(QUERY);

    const filterTokens = parser.getFilterTokens();
    expect(filterTokens, "should contain 1 filter tokens").to.have.length(1);
    expect(filterTokens).to.deep.contain({
      key: "due",
      value: "2017",
      ids: [],
    });
  });
  // skipcq: JS-0241
  it("can query if a specific keyword is set", function () {
    const QUERY = "hello is:open world #my label";
    parser.parse(QUERY);

    expect(parser.hasKeyword("is", "open")).to.be.true;
    expect(parser.hasKeyword({ key: "is" }, "open")).to.be.true;
  });
  // skipcq: JS-0241
  describe("Query LabelIds", function () {
    // skipcq: JS-0241
    beforeEach(function () {
      parser = new QueryParser(ITEM_KEYWORDS, (labelName) => {
        if (labelName.split(/\s/).length > 2) {
          return [];
        }

        const length = labelName.length;
        return [`${labelName}-${length}`];
      });
    });
    // skipcq: JS-0241
    it("can query the label id for a given name using the passed function", function () {
      const QUERY = "#my label hello world";
      parser.parse(QUERY);
      const filterTokens = parser.getFilterTokens();
      const labelTokens = parser.getLabelTokens();
      const searchTokens = parser.getSearchTokens();

      expect(filterTokens, "should contain no filter tokens").to.have.length(0);
      expect(labelTokens, "should contain 1 label token").to.have.length(1);
      expect(searchTokens, "should contain 2 search tokens").to.have.length(2);

      expect(labelTokens[0].token).to.equal("my label");
      expect(labelTokens).to.deep.contain({
        token: "my label",
        ids: ["my label-8"],
      });
    });
  });
});
