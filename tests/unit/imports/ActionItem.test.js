import { expect } from "chai";
import esmock from "esmock";
import sinon from "sinon";

const doNothing = () => {};

class MeteorError {}

const { Priority } = await esmock("../../../imports/priority", {
  "meteor/universe:i18n": { __: () => sinon.stub() }
}, {}, {
  isModuleNotFoundError: false
});

const { InfoItem } = await esmock("../../../imports/infoitem", {
  "meteor/meteor": {
    Meteor: {
      call: () => sinon.stub(),
      Error: MeteorError,
      user: () => {
        return { username: "unit-test" };
      },
    }, },
  "meteor/random": { Random: { id: () => {}, } },
  "/imports/user": { null: null, "@noCallThru": true },
  "./topic": { Topic: {} }, // These might need to be arrows?
  "./label": { Label: {} },
}, {}, {
  isModuleNotFoundError: false
});

const { ActionItem } = await esmock("../../../imports/actionitem", {
  "meteor/meteor": { // Dunno if I have to repeat this?
    Meteor: {
      call: () => sinon.stub(),
      Error: MeteorError,
      user: () => {
        return { username: "unit-test" };
      },
    }, },
 // "/imports/priority": { Priority, "@noCallThru": true }, Unsure if I need to mock these to the constants, or just mock combine mock statements?
 // "./infoitem": { InfoItem, "@noCallThru": true },
}, {}, {
  isModuleNotFoundError: false
});
// skipcq: JS-0241
describe("ActionItem", function () {
  let dummyTopic, infoItemDoc;
  // skipcq: JS-0241
  beforeEach(function () {
    dummyTopic = {
      _id: "AaBbCcDd",
      save: doNothing,
      findInfoItem: doNothing,
    };

    infoItemDoc = {
      _id: "AaBbCcDd01",
      createdInMinute: "AaBbCcDd01",
      subject: "infoItemDoc",
      createdAt: new Date(),
      details: [
        {
          date: "2016-05-06",
          text: "details Text",
        },
      ],
    };
  });
  // skipcq: JS-0241
  describe("#constructor", function () {
    // skipcq: JS-0241
    it("sets the reference to the parent topic correctly", function () {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

      // the infoItem should have a reference of our dummyTopic
      expect(myActionItem._parentTopic).to.equal(dummyTopic);
    });
    // skipcq: JS-0241
    it("sets the document correctly", function () {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);
      // the doc should be equal to our initial document
      expect(myActionItem._infoItemDoc).to.deep.equal(infoItemDoc);
    });
    // skipcq: JS-0241
    it("sets the initial value for the isOpen-flag correctly", function () {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);
      // the isOpen-filed should be initially true for a new actionItem
      expect(myActionItem._infoItemDoc.isOpen).to.be.true;
    });
    // skipcq: JS-0241
    it("sets the initial value for the isNew-flag correctly", function () {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);
      // the isOpen-filed should be initially true for a new actionItem
      expect(myActionItem._infoItemDoc.isNew).to.be.true;
    });
  });
  // skipcq: JS-0241
  it("#getDateFromDetails", function () {
    const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

    expect(myActionItem.getDateFromDetails()).to.equal(
      infoItemDoc.details[0].date,
    );
  });
  // skipcq: JS-0241
  it("#getTextFromDetails", function () {
    const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

    expect(myActionItem.getTextFromDetails()).to.equal(
      infoItemDoc.details[0].text,
    );
  });
  // skipcq: JS-0241
  it("#toggleState", function () {
    const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

    const oldState = myActionItem._infoItemDoc.isOpen;

    myActionItem.toggleState();

    // state should have changed
    expect(myActionItem._infoItemDoc.isOpen).to.not.equal(oldState);
  });
});
