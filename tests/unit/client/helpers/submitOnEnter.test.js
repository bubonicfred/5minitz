import {expect} from "chai";
import esmock from "esmock";
import sinon from "sinon";

const jQueryOnStub = sinon.stub();

const submitOnEnter = await esmock(
                          "../../../../client/helpers/submitOnEnter",
                          {
                            "meteor/jquery" : {
                              $ : () => sinon.stub().returns({
                                on : jQueryOnStub,
                              }),
                            },
                          },
                          {},
                          {isModuleNotFoundError : false},
                          )
                          .default;

// skipcq: JS-0241
describe("submitOnEnter", function() {
  const action = sinon.stub();

  function fakeEnterPressed(controlPressed) {
    return {
      keyCode : 13,
      key : "Enter",
      ctrlKey : controlPressed,
      preventDefault : sinon.stub(),
    };
  }
  // skipcq: JS-0241
  beforeEach(function() {
    jQueryOnStub.resetHistory();
    $.resetHistory();
    action.resetHistory();
  });
  // skipcq: JS-0241
  it("attaches event handlers to the given textareas", function() {
    let textareas = [ "one", "two" ], numberOfTextareas = textareas.length;

    submitOnEnter(textareas, action);

    sinon.assert.callCount($, numberOfTextareas);
    sinon.assert.callCount(jQueryOnStub, numberOfTextareas);
    sinon.assert.alwaysCalledWith(jQueryOnStub, "keyup");

    sinon.assert.calledWith($, "one");
    sinon.assert.calledWith($, "two");
  });
  // skipcq: JS-0241
  it("action is not triggered when control is not pressed for textarea",
     function() {
       let input = [ "one" ], event = fakeEnterPressed(false);

       submitOnEnter(input, action);

       const handler = jQueryOnStub.getCall(0).args[1];
       handler(event);

       expect(action.calledOnce).to.be.false;
     });
  // skipcq: JS-0241
  it("action is triggered when control is pressed for textareas", function() {
    let input = [ "one" ], event = fakeEnterPressed(true);

    submitOnEnter(input, action);

    const handler = jQueryOnStub.getCall(0).args[1];
    handler(event);

    expect(action.calledOnce).to.be.true;
  });
  // skipcq: JS-0241
  it("action is not triggered for textareas when something other than enter is entered",
     function() {
       let input = [ "one" ], event = fakeEnterPressed(true);

       event.key = "Something Else";
       event.keyCode = 15;

       submitOnEnter(input, action);

       const handler = jQueryOnStub.getCall(0).args[1];
       handler(event);

       expect(action.calledOnce).to.be.false;
     });
});
