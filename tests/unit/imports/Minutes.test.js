import {expect} from "chai";
import _ from "lodash";
import proxyquire from "proxyquire";
import sinon from "sinon";

import * as Helpers from "../../../imports/helpers/date";
import * as EmailHelpers from "../../../imports/helpers/email";
import * as SubElements from "../../../imports/helpers/subElements";

const MinutesSchema = {
  find : sinon.stub(),
  findOne : sinon.stub(),
};

MinutesSchema.getCollection = (_) => MinutesSchema;

class MeteorError {}

const Meteor = {
  call : sinon.stub(),
  callAsync : sinon.stub().resolves(true),
  Error : MeteorError,
};

const isCurrentUserModeratorStub = sinon.stub();
const updateLastMinutesFieldsStub = sinon.stub();
const updateLastMinutesFieldsAsyncStub = sinon.stub().resolves(true);
const MeetingSeries = function(seriesId) {
  this._id = seriesId;
  this.isCurrentUserModerator = isCurrentUserModeratorStub;
  this.updateLastMinutesFields = updateLastMinutesFieldsStub;
  this.updateLastMinutesFieldsAsync = updateLastMinutesFieldsAsyncStub;
};

const topicGetOpenActionItemsStub = sinon.stub().returns([]);
const Topic =
    function() { this.getOpenActionItems = topicGetOpenActionItemsStub; };
Topic.hasOpenActionItem = () => { return false; };

const ActionItem = function(topic, doc) {
  this._parentTopic = topic;
  this._infoItemDoc = doc;
};

SubElements["@noCallThru"] = true;
EmailHelpers["@noCallThru"] = true;
const Random = {
  id : () => {},
};
const {Minutes} = proxyquire("../../../imports/minutes", {
  "meteor/meteor" : {Meteor, "@noCallThru" : true},
  "meteor/universe:i18n" : {Meteor, "@noCallThru" : true},
  "meteor/random" : {Random, "@noCallThru" : true},
  "./collections/minutes_private" : {MinutesSchema, "@noCallThru" : true},
  "./collections/minutes.schema" : {MinutesSchema, "@noCallThru" : true},
  "./collections/workflow_private" : {null : null, "@noCallThru" : true},
  "./meetingseries" : {MeetingSeries, "@noCallThru" : true},
  "./topic" : {Topic, "@noCallThru" : true},
  "/imports/user" : {null : null, "@noCallThru" : true},
  "./actionitem" : {ActionItem, "@noCallThru" : true},
  "/imports/helpers/email" : EmailHelpers,
  "/imports/helpers/subElements" : SubElements,
  lodash : {_, "@noCallThru" : true},
});
// skipcq: JS-0241
describe("Minutes", function() {
  let minutesDoc, minute;
  // skipcq: JS-0241
  beforeEach(function() {
    minutesDoc = {
      meetingSeries_id : "AaBbCc01",
      _id : "AaBbCc02",
      date : "2016-05-06",
      createdAt : new Date(),
      topics : [],
      isFinalized : false,
      participants : "",
      agenda : "",
    };

    minute = new Minutes(minutesDoc);
  });
  // skipcq: JS-0241
  afterEach(function() {
    MinutesSchema.find.resetHistory();
    MinutesSchema.findOne.resetHistory();
    Meteor.call.resetHistory();
    Meteor.callAsync.resetHistory();
    isCurrentUserModeratorStub.resetHistory();
    updateLastMinutesFieldsStub.resetHistory();
    topicGetOpenActionItemsStub.resetHistory();
  });
  // skipcq: JS-0241
  describe("#constructor", function() {
    // skipcq: JS-0241
    it("sets the properties correctly", function() {
      expect(JSON.stringify(minute)).to.equal(JSON.stringify(minutesDoc));
    });
    // skipcq: JS-0241
    it("fetches the minute from the database if the id was given", function() {
      new Minutes(minutesDoc._id);
      expect(MinutesSchema.findOne.calledOnce, "findOne should be called once")
          .to.be.true;
      expect(
          MinutesSchema.findOne.calledWith(minutesDoc._id),
          "findOne should be called with the id",
          )
          .to.be.true;
    });
    // skipcq: JS-0241
    it("throws exception if constructor will be called without any arguments",
       function() {
         let exceptionThrown;
         try {
           new Minutes();
           exceptionThrown = false;
         } catch (e) {
           exceptionThrown = e instanceof MeteorError;
         }

         expect(exceptionThrown).to.be.true;
       });
  });
  // skipcq: JS-0241
  describe("find", function() {
    // skipcq: JS-0241
    it("#find", function() {
      Minutes.find("myArg");
      expect(MinutesSchema.find.calledOnce, "find-Method should be called once")
          .to.be.true;
      expect(
          MinutesSchema.find.calledWithExactly("myArg"),
          "arguments should be passed",
          )
          .to.be.true;
    });
    // skipcq: JS-0241
    it("#findOne", function() {
      Minutes.findOne("myArg");
      expect(
          MinutesSchema.findOne.calledOnce,
          "findOne-Method should be called once",
          )
          .to.be.true;
      expect(
          MinutesSchema.findOne.calledWithExactly("myArg"),
          "arguments should be passed",
          )
          .to.be.true;
    });
    // skipcq: JS-0241
    describe("#findAllIn", function() {
      let minIdArray;
      let limit;
      // skipcq: JS-0241
      beforeEach(function() {
        minIdArray = [ "1", "2" ];
        limit = 3;
      });
      // skipcq: JS-0241
      it("calls the find-Method of the Collection", function() {
        Minutes.findAllIn(minIdArray, limit);
        expect(
            MinutesSchema.find.calledOnce,
            "find-Method should be called once",
            )
            .to.be.true;
      });
      // skipcq: JS-0241
      it("sets the id selector correctly", function() {
        Minutes.findAllIn(minIdArray, limit);
        const selector = MinutesSchema.find.getCall(0).args[0];
        expect(selector, "Selector has the property _id")
            .to.have.ownProperty(
                "_id",
            );
        expect(
            selector._id,
            "_id-selector has propery $in",
            )
            .to.have.ownProperty("$in");
        expect(selector._id.$in, "idArray should be passed")
            .to.deep.equal(
                minIdArray,
            );
      });
      // skipcq: JS-0241
      it("sets the option correctly (sort, no limit)", function() {
        const expectedOption = {sort : {date : -1}};
        Minutes.findAllIn(minIdArray);
        const options = MinutesSchema.find.getCall(0).args[1];
        expect(options).to.deep.equal(expectedOption);
      });
      // skipcq: JS-0241
      it("sets the option correctly (sort and limit)", function() {
        const expectedOption = {sort : {date : -1}, limit};
        Minutes.findAllIn(minIdArray, limit);
        const options = MinutesSchema.find.getCall(0).args[1];
        expect(options).to.deep.equal(expectedOption);
      });
    });
  });
  // skipcq: JS-0241
  describe("#remove", function() {
    // skipcq: JS-0241
    it("calls the meteor method minutes.remove", function() {
      Minutes.remove(minute._id);
      expect(Meteor.callAsync.calledOnce).to.be.true;
    });
    // skipcq: JS-0241
    it("sends the minutes id to the meteor method minutes.remove", function() {
      Minutes.remove(minute._id);
      expect(
          Meteor.callAsync.calledWithExactly("workflow.removeMinute",
                                             minute._id),
          )
          .to.be.true;
    });
  });
  // skipcq: JS-0241
  describe("#syncVisibilityAndParticipants", function() {
    let visibleForArray, parentSeriesId;
    // skipcq: JS-0241
    beforeEach(function() {
      visibleForArray = [ "1", "2" ];
      parentSeriesId = minute.meetingSeries_id;
    });
    // skipcq: JS-0241
    it("calls the meteor method minutes.syncVisibilityAndParticipants",
       function() {
         Minutes.syncVisibility(parentSeriesId, visibleForArray);
         expect(Meteor.callAsync.calledOnce).to.be.true;
       });
    // skipcq: JS-0241
    it("sends the parentSeriesId and the visibleFor-array to the meteor method minutes.syncVisibilityAndParticipants",
       function() {
         Minutes.syncVisibility(parentSeriesId, visibleForArray);
         expect(
             Meteor.callAsync.calledWithExactly(
                 "minutes.syncVisibilityAndParticipants",
                 parentSeriesId,
                 visibleForArray,
                 ),
             )
             .to.be.true;
       });
  });
  // skipcq: JS-0241
  describe("#update", function() {
    let updateDocPart;
    // skipcq: JS-0241
    beforeEach(function() {
      updateDocPart = {
        date : "2016-05-07",
      };
    });
    // skipcq: JS-0241
    it("calls the meteor method minutes.update", function() {
      minute.update(updateDocPart);
      expect(Meteor.callAsync.calledOnce).to.be.true;
    });
    // skipcq: JS-0241
    it("sends the doc part and the minutes id to the meteor method minutes.update",
       function() {
         minute.update(updateDocPart);
         const sentObj = JSON.parse(JSON.stringify(updateDocPart));
         sentObj._id = minute._id;
         expect(
             Meteor.callAsync.calledWithExactly(
                 "minutes.update",
                 sentObj,
                 undefined,
                 ),
             )
             .to.be.true;
       });
    // skipcq: JS-0241
    it("updates the changed property of the minute object", async function() {
      await minute.update(updateDocPart);
      expect(minute.date).to.equal(updateDocPart.date);
    });
  });
  // skipcq: JS-0241
  describe("#save", function() {
    // skipcq: JS-0241
    it("calls the meteor method minutes.insert if a new minute will be saved",
       function() {
         delete minute._id;
         minute.save();
         expect(Meteor.call.calledOnce).to.be.true;
       });
    // skipcq: JS-0241
    it("uses the workflow.addMinutes method to save a new minutes document",
       function() {
         delete minute._id;
         minute.save();
         expect(
             Meteor.call.calledWithExactly(
                 "workflow.addMinutes",
                 minute,
                 undefined,
                 undefined,
                 ),
             )
             .to.be.true;
       });
    // skipcq: JS-0241
    it("sets the createdAt-property if it is not set", function() {
      delete minute._id;
      delete minute.createdAt;
      minute.save();
      expect(minute).to.have.ownProperty("createdAt");
    });
    // skipcq: JS-0241
    it("calls the meteor method minutes.update if a existing minute will be saved",
       function() {
         minute.save();
         expect(Meteor.call.calledOnce).to.be.true;
       });
    // skipcq: JS-0241
    it("sends the minutes object to the meteor method minutes.update",
       function() {
         minute.save();
         expect(Meteor.call.calledWithExactly("minutes.update", minute))
             .to.be.true;
       });
  });
  // skipcq: JS-0241
  it("#parentMeetingSeries", function() {
    const parentSeries = minute.parentMeetingSeries();
    expect(
        parentSeries instanceof MeetingSeries,
        "result should be an instance of MeetingSeries",
        )
        .to.be.true;
    expect(
        parentSeries._id,
        "created meeting series object should have the correct series id",
        )
        .to.equal(minute.meetingSeries_id);
  });
  // skipcq: JS-0241
  it("#parentMeetingSeriesID", function() {
    expect(minute.parentMeetingSeriesID()).to.equal(minute.meetingSeries_id);
  });
  // skipcq: JS-0241
  describe("topic related methods", function() {
    let topic1, topic2, topic3, topic4;
    // skipcq: JS-0241
    beforeEach(function() {
      topic1 = {
        _id : "01",
        subject : "firstTopic",
        isNew : true,
        isOpen : true,
      };
      topic2 = {
        _id : "02",
        subject : "2ndTopic",
        isNew : true,
        isOpen : false,
      };
      topic3 = {
        _id : "03",
        subject : "3rdTopic",
        isNew : false,
        isOpen : true,
      };
      topic4 = {
        _id : "04",
        subject : "4thTopic",
        isNew : false,
        isOpen : false,
      };
      minute.topics.push(topic1);
      minute.topics.push(topic2);
      minute.topics.push(topic3);
      minute.topics.push(topic4);
    });
    // skipcq: JS-0241
    describe("#findTopic", function() {
      // skipcq: JS-0241
      it("finds the correct topic identified by its id", function() {
        expect(minute.findTopic(topic1._id)).to.deep.equal(topic1);
      });
      // skipcq: JS-0241
      it("returns undefined if topic was not found",
         function() { expect(minute.findTopic("unknownId")).to.be.undefined; });
    });
    // skipcq: JS-0241
    describe("#removeTopic", function() {
      // skipcq: JS-0241
      it("removes the topic from the topics array", function() {
        const oldLength = minute.topics.length;
        minute.removeTopic(topic1._id);
        expect(minute.topics).to.have.length(oldLength - 1);
      });
      // skipcq: JS-0241
      it("calls the meteor method minutes.update", function() {
        minute.removeTopic(topic1._id);
        expect(Meteor.callAsync.calledOnce).to.be.true;
      });
    });
    // skipcq: JS-0241
    describe("#getNewTopics", function() {
      // skipcq: JS-0241
      it("returns the correct amount of topics",
         function() { expect(minute.getNewTopics()).to.have.length(2); });
      // skipcq: JS-0241
      it("returns only new topics", function() {
        const newTopics = minute.getNewTopics();
        newTopics.forEach((topic) => {
          expect(topic.isNew, "isNew-flag should be set").to.be.true;
        });
      });
    });
    // skipcq: JS-0241
    describe("#getOldClosedTopics", function() {
      // skipcq: JS-0241
      it("returns the correct amount of topics",
         function() { expect(minute.getOldClosedTopics()).to.have.length(1); });
      // skipcq: JS-0241
      it("returns only old and closed topics", function() {
        const oldClosedTopics = minute.getOldClosedTopics();
        oldClosedTopics.forEach((topic) => {
          expect(
              topic.isNew && topic.isOpen,
              "isNew and isOpen flag should both not set",
              )
              .to.be.false;
        });
      });
    });
    // skipcq: JS-0241
    describe("#getOpenActionItems", function() {
      // skipcq: JS-0241
      it("calls the getOpenActionItems method for each topic", function() {
        minute.getOpenActionItems();
        expect(topicGetOpenActionItemsStub.callCount)
            .to.equal(
                minute.topics.length,
            );
      });
      // skipcq: JS-0241
      it("concatenates all results of each getOpenActionItems-call",
         function() {
           topicGetOpenActionItemsStub.returns([ 5, 7 ]);
           expect(minute.getOpenActionItems())
               .to.have.length(
                   minute.topics.length * 2,
               );
         });
    });
  });
  // skipcq: JS-0241
  describe("#upsertTopic", function() {
    let topicDoc;
    // skipcq: JS-0241
    beforeEach(function() {
      topicDoc = {
        subject : "myTopic",
      };
    });
    // skipcq: JS-0241
    it("adds a new topic to the topic array", function() {
      minute.upsertTopic(topicDoc);
      expect(Meteor.callAsync.calledOnce).to.be.true;
      expect(
          Meteor.callAsync.calledWithExactly(
              "minutes.addTopic",
              sinon.match.string,
              topicDoc,
              ),
      );
    });
    // skipcq: JS-0241
    it("adds a new topic which already has an id", function() {
      topicDoc._id = "myId";
      minute.upsertTopic(topicDoc);
      expect(Meteor.callAsync.calledOnce).to.be.true;
      expect(
          Meteor.callAsync.calledWithExactly(
              "minutes.addTopic",
              topicDoc._id,
              topicDoc,
              ),
      );
    });
    // skipcq: JS-0241
    it("updates an existing topic correctly", function() {
      topicDoc._id = "myId";
      minute.topics.unshift(topicDoc);
      topicDoc.subject = "changedSubject";
      minute.upsertTopic(topicDoc);
      expect(
          minute.topics,
          "update an existing topic should not change the size of the topics array",
          )
          .to.have.length(1);
      expect(
          minute.topics[0].subject,
          "the subject should have been updated",
          )
          .to.equal(topicDoc.subject);
    });
    // skipcq: JS-0241
    it("calls the meteor method minutes.update", function() {
      minute.upsertTopic(topicDoc);
      expect(Meteor.callAsync.calledOnce).to.be.true;
    });
    // skipcq: JS-0241
    it("sends the minutes id and the topic doc to the meteor method minutes.addTopic",
       function() {
         minute.upsertTopic(topicDoc);
         const callArgs = Meteor.callAsync.getCall(0).args;
         expect(
             callArgs[0],
             "first argument should be the name of the meteor method",
             "minutes.addTopic",
         );
         const sentDoc = callArgs[1];
         expect(
             callArgs[1],
             "minutes id should be sent to the meteor method",
             )
             .to.equal(minutesDoc._id);
         expect(
             callArgs[2],
             "topic-doc should be sent to the meteor method",
             )
             .to.equal(topicDoc);
       });
  });
  // skipcq: JS-0241
  it("#isCurrentUserModerator", function() {
    minute.isCurrentUserModerator();

    expect(isCurrentUserModeratorStub.calledOnce).to.be.true;
  });
});
