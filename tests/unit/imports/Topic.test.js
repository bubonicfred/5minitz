import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import * as DateHelpers from "../../../imports/helpers/date";
import * as SubElements from "../../../imports/helpers/subElements";

class MeteorError {}
const Meteor = {
  call: sinon.stub(),
  Error: MeteorError,
  callPromise: sinon.stub(),
  user: () => {
    return { username: "unit-test" };
  },
};

const meetingSeriesId = "AaBbCcDd01";
class MeetingSeries {
  constructor(id) {
    this._id = id;
  }
  static findOne(id) {
    if (id === meetingSeriesId) {
      return dummySeries;
    }
    return undefined;
  }
}

const minuteId = "AaBbCcDd02";
class Minutes {
  constructor(id) {
    this._id = id;
  }
  upsertTopic() {}
  static findOne(id) {
    if (id === minuteId) {
      return dummyMinute;
    }
    return undefined;
  }
}

const dummyMinute = new Minutes(minuteId);
const dummySeries = new MeetingSeries(meetingSeriesId);

const Random = {
  i: 1,
  id() {
    return this.i++;
  },
};

SubElements["@noCallThru"] = true;
DateHelpers["@noCallThru"] = true;

const { Label } = proxyquire("../../../imports/label", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
});

const { InfoItem } = proxyquire("../../../imports/infoitem", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "meteor/random": { Random, "@noCallThru": true },
  "/imports/user": { null: null, "@noCallThru": true },
  "/imports/helpers/date": DateHelpers,
  "./label": { Label, "@noCallThru": true },
});

const { ActionItem } = proxyquire("../../../imports/actionitem", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "./infoitem": { InfoItem, "@noCallThru": true },
});

const { InfoItemFactory } = proxyquire("../../../imports/InfoItemFactory", {
  "./infoitem": { InfoItem, "@noCallThru": true },
  "./actionitem": { ActionItem, "@noCallThru": true },
});

const { Topic } = proxyquire("../../../imports/topic", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "meteor/random": { Random, "@noCallThru": true },
  "meteor/underscore": { _, "@noCallThru": true },
  "/imports/helpers/subElements": SubElements,
  "./label": { Label, "@noCallThru": true },
  "./infoitem": { InfoItem, "@noCallThru": true },
  "./InfoItemFactory": { InfoItemFactory, "@noCallThru": true },
  "./minutes": { Minutes, "@noCallThru": true },
  "./meetingseries": { MeetingSeries, "@noCallThru": true },
  "./helpers/promisedMethods": { null: null, "@noCallThru": true },
  "./collections/minutes_private": { null: null, "@noCallThru": true },
});

describe("Topic", () => {
  let topicDoc;

  beforeEach(() => {
    topicDoc = {
      subject: "topic-subject",
      infoItems: [],
    };
  });

  describe("#constructor", () => {
    it("sets the reference to the parent minute correctly", () => {
      const myTopic = new Topic(dummyMinute._id, topicDoc);
      expect(myTopic._parentMinutes).to.equal(dummyMinute);
    });

    it("can instantiate a topic with the parent minutes object instead of its id", () => {
      const myTopic = new Topic(dummyMinute, topicDoc);
      expect(myTopic._parentMinutes).to.equal(dummyMinute);
    });

    it("sets the subject correctly", () => {
      const myTopic = new Topic(dummyMinute._id, topicDoc);
      expect(myTopic._topicDoc.subject).to.equal(topicDoc.subject);
    });

    it("sets the initial value of the isOpen-flag correctly", () => {
      const myTopic = new Topic(dummyMinute._id, topicDoc);
      expect(myTopic._topicDoc.isOpen).to.be.true;
    });

    it("sets the initial value of the isNew-flag correctly", () => {
      const myTopic = new Topic(dummyMinute._id, topicDoc);
      expect(myTopic._topicDoc.isNew).to.be.true;
    });

    it("enforces infoItems to be of type Array", () => {
      topicDoc.infoItems = "something";
      const myTopic = new Topic(dummyMinute._id, topicDoc);

      expect(myTopic._topicDoc.infoItems).to.be.an("array");
    });
  });

  it("#findTopicIndexInArray", () => {
    const topicArray = [topicDoc];
    const index = Topic.findTopicIndexInArray(topicDoc._id, topicArray);
    expect(index).to.equal(0);
  });

  describe("#hasOpenActionItem", () => {
    it("returns false if the topic does not have any sub items", () => {
      expect(Topic.hasOpenActionItem(topicDoc)).to.be.false;
    });

    it("returns true if the topic has at least one open action items", () => {
      topicDoc.infoItems.push({
        itemType: "actionItem",
        isOpen: false,
      });
      topicDoc.infoItems.push({
        itemType: "actionItem",
        isOpen: true,
      });

      expect(Topic.hasOpenActionItem(topicDoc)).to.be.true;
    });

    it("returns false if the topic has only closed action items", () => {
      topicDoc.infoItems.push({
        itemType: "actionItem",
        isOpen: false,
      });
      topicDoc.infoItems.push({
        itemType: "actionItem",
        isOpen: false,
      });

      expect(Topic.hasOpenActionItem(topicDoc)).to.be.false;
    });

    it("returns false if the topic has only info items (whose open state is unimportant)", () => {
      topicDoc.infoItems.push({
        itemType: "infoItem",
        isOpen: false,
      });
      topicDoc.infoItems.push({
        itemType: "infoItem",
        isOpen: true,
      });
      topicDoc.infoItems.push({
        itemType: "infoItem",
        // isOpen: keep it "undefined"!!!
      });
      expect(Topic.hasOpenActionItem(topicDoc)).to.be.false;
    });

    it("returns true if the topic has a open action item (object method call)", () => {
      topicDoc.infoItems.push({
        itemType: "actionItem",
        isOpen: true,
      });
      const myTopic = new Topic(dummyMinute._id, topicDoc);
      expect(myTopic.hasOpenActionItem()).to.be.true;
    });
  });

  describe("#invalidateIsNewFlag", () => {
    let myTopic;

    beforeEach(() => {
      topicDoc.isNew = true;
      topicDoc.infoItems.push({
        isOpen: true,
        isNew: true,
        itemType: "actionItem",
        createdInMinute: dummyMinute._id,
      });
      myTopic = new Topic(dummyMinute._id, topicDoc);
    });

    it("clears the isNew-Flag of the topic itself", () => {
      myTopic.invalidateIsNewFlag();
      expect(topicDoc.isNew).to.be.false;
    });

    it("clears the isNew-Flag of the action item", () => {
      myTopic.invalidateIsNewFlag();
      expect(topicDoc.infoItems[0].isNew).to.be.false;
    });
  });

  it("#toggleState", () => {
    const myTopic = new Topic(dummyMinute._id, topicDoc);

    const oldState = myTopic._topicDoc.isOpen;

    myTopic.toggleState();

    // state should have changed
    expect(myTopic._topicDoc.isOpen).to.not.equal(oldState);
  });

  describe("#isRecurring", () => {
    let myTopic;

    beforeEach(() => {
      myTopic = new Topic(dummyMinute._id, topicDoc);
    });

    it("sets the default value correctly", () => {
      expect(myTopic.isRecurring()).to.be.false;
    });

    it("returns the correct value", () => {
      myTopic.getDocument().isRecurring = true;
      expect(myTopic.isRecurring()).to.be.true;
    });
  });

  describe("#toggleRecurring", () => {
    let myTopic;

    beforeEach(() => {
      myTopic = new Topic(dummyMinute._id, topicDoc);
    });

    it("can change the value correctly", () => {
      myTopic.toggleRecurring();
      expect(myTopic.isRecurring()).to.be.true;
    });

    it("can reset the isRecurring-Flag", () => {
      myTopic.toggleRecurring();
      myTopic.toggleRecurring();
      expect(myTopic.isRecurring()).to.be.false;
    });
  });

  describe("#upsertInfoItem", () => {
    let myTopic;
    let topicItemDoc;

    beforeEach(() => {
      myTopic = new Topic(dummyMinute._id, topicDoc);

      topicItemDoc = {
        subject: "info-item-subject",
        createdAt: new Date(),
      };
    });

    it("adds a new info item to our topic", () => {
      myTopic.upsertInfoItem(topicItemDoc);

      expect(
        myTopic.getInfoItems().length,
        "the topic should have exactly one item",
      ).to.equal(1);
      expect(myTopic.getInfoItems()[0]._id, "the item should have an id").to.not
        .be.false;
      expect(
        myTopic.getInfoItems()[0].subject,
        "the subject should be set correctly",
      ).to.equal(topicItemDoc.subject);
    });

    it("updates an existing info item", () => {
      myTopic.upsertInfoItem(topicItemDoc);

      // Change the subject and call the upsertTopicItem method again
      const topicItem = myTopic.getInfoItems()[0];
      topicItem.subject = "new_subject";

      myTopic.upsertInfoItem(topicItem);

      expect(
        myTopic.getInfoItems().length,
        "the topic should have exactly one item",
      ).to.equal(1);
      expect(
        myTopic.getInfoItems()[0]._id,
        "the item should have an id",
      ).to.equal(topicItem._id);
      expect(
        myTopic.getInfoItems()[0].subject,
        "the subject should be set correctly",
      ).to.equal(topicItem.subject);
    });
  });

  it("#findInfoItem", () => {
    const myTopic = new Topic(dummyMinute._id, topicDoc);
    const infoItemDoc = {
      _id: "AaBbCcDd01",
      subject: "info-item-subject",
      createdAt: new Date(),
      createdInMinute: dummyMinute._id,
    };

    // new info item is not added yet, so our topic should not find it
    let foundItem = myTopic.findInfoItem(infoItemDoc._id);
    expect(foundItem).to.equal();

    // now we add the info item to our topic
    myTopic.upsertInfoItem(infoItemDoc);

    foundItem = myTopic.findInfoItem(infoItemDoc._id);
    // foundItem should not be undefined
    expect(foundItem, "the result should not be undefined").to.not.equal();
    // the subject of the found item should be equal to its initial value
    expect(
      foundItem._infoItemDoc.subject,
      "the correct info item should be found",
    ).to.equal(infoItemDoc.subject);
  });

  it("#removeInfoItem", () => {
    const myTopic = new Topic(dummyMinute._id, topicDoc);

    const infoItemDoc = {
      _id: "AaBbCcDd01",
      subject: "info-item-subject",
      createdAt: new Date(),
    };
    const infoItemDoc2 = {
      _id: "AaBbCcDd02",
      subject: "info-item-subject2",
      createdAt: new Date(),
    };

    // now we add the info items to our topic
    myTopic.upsertInfoItem(infoItemDoc);
    myTopic.upsertInfoItem(infoItemDoc2);

    // check that the two info items was added
    const initialLength = myTopic.getInfoItems().length;

    // remove the second one
    myTopic.removeInfoItem(infoItemDoc2._id);

    const diff = initialLength - myTopic.getInfoItems().length;

    // check that there are now only one items
    expect(
      diff,
      "The length of the info items should be decreased by one",
    ).to.equal(1);

    // check that the first item is still part of our topic
    expect(
      myTopic.getInfoItems()[0]._id,
      "The other info item should not be removed.",
    ).to.equal(infoItemDoc._id);
  });

  describe("#tailorTopic", () => {
    let myTopic;

    beforeEach(() => {
      topicDoc.infoItems.push({
        subject: "myInfoItem",
        createdInMinute: dummyMinute._id,
      });
      topicDoc.infoItems.push({
        subject: "myClosedActionItem",
        isOpen: false,
        itemType: "actionItem",
        createdInMinute: dummyMinute._id,
      });
      topicDoc.infoItems.push({
        subject: "myOpenActionItem",
        isOpen: true,
        itemType: "actionItem",
        createdInMinute: dummyMinute._id,
      });
      myTopic = new Topic(dummyMinute._id, topicDoc);
    });

    it("removes all info items and closed action items", () => {
      myTopic.tailorTopic();

      expect(myTopic.getInfoItems()).to.have.length(1);
    });

    it("keeps the open action items", () => {
      myTopic.tailorTopic();

      expect(myTopic._topicDoc.infoItems[0].isOpen).to.be.true;
    });
  });

  describe("#getOpenActionItems", () => {
    let myTopic;

    beforeEach(() => {
      topicDoc.infoItems.push({
        subject: "myInfoItem",
      });
      topicDoc.infoItems.push({
        subject: "myClosedActionItem",
        isOpen: false,
        itemType: "actionItem",
      });
      topicDoc.infoItems.push({
        subject: "myOpenActionItem",
        isOpen: true,
        itemType: "actionItem",
      });
      topicDoc.infoItems.push({
        subject: "my2ndOpenActionItem",
        isOpen: true,
        itemType: "actionItem",
      });
      myTopic = new Topic(dummyMinute._id, topicDoc);
    });

    it("returns the correct amount of items", () => {
      expect(myTopic.getOpenActionItems()).to.have.length(2);
    });

    it("returns only open action items", () => {
      myTopic.getOpenActionItems().forEach((item) => {
        expect(item, "the item should be a action item").to.have.ownProperty(
          "isOpen",
        );
        expect(item.isOpen, "the item should marked as open").to.be.true;
      });
    });
  });

  it("#save", () => {
    const myTopic = new Topic(dummyMinute._id, topicDoc);

    // the save-method should call the upsertTopic-Method of the parent Minute
    // so we spy on it
    const spy = sinon.spy(dummyMinute, "upsertTopic");

    myTopic.save();

    expect(spy.calledOnce, "the upsertTopic method should be called once").to.be
      .true;
    expect(
      spy.calledWith(myTopic._topicDoc),
      "the document should be sent to the upsertTopic method",
    ).to.be.true;

    spy.restore();
  });

  it("#getDocument", () => {
    const myTopic = new Topic(dummyMinute._id, topicDoc);

    expect(myTopic.getDocument()).to.equal(topicDoc);
  });
});
