import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

require('../../imports/helpers/date');


describe('ActionItems Responsibles', function () {
    const aProjectName = "E2E ActionItems Responsibles";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aAICounter = 0;
    let aAINameBase = "Action Item Name #";

    let getNewMeetingName = async () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };
    let getNewTopicName = async () => {
        aTopicCounter++;
        return aTopicNameBase + aTopicCounter;
    };
    let getNewAIName = async () => {
        aAICounter++;
        return aAINameBase + aAICounter;
    };

    async function addActionItemToFirstTopic() {
        let actionItemName = await getNewAIName();

        await E2ETopics.addInfoItemToTopic({
            subject: actionItemName,
            itemType: "actionItem"
        }, 1);

        return actionItemName;
    }

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("make sure test user is logged in, create series and add minutes", function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingName = await getNewMeetingName();

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        aTopicName = await getNewTopicName();
        await E2ETopics.addTopicToMinutes(aTopicName);
    });

    it('can add an action item with a responsible', function () {
        let topicIndex = 1;
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];

        await E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

        const actionItemName = await getNewAIName();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: user1
        });
        await (await browser.element("#btnInfoItemSave")).click();
        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        let actionItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let actionItemExpandElementText = (await browser.elementIdText(actionItemExpandElement)).value;

        await expect(actionItemExpandElementText, "user1 shall be responsible").to.have.string(user1);
    });


    it('can add an action item with two responsibles', function () {
        let topicIndex = 1;
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];

        await E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

        const actionItemName = await getNewAIName();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: user1+","+user2
        });
        await (await browser.element("#btnInfoItemSave")).click();
        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        let actionItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let actionItemExpandElementText = (await browser.elementIdText(actionItemExpandElement)).value;

        await expect(actionItemExpandElementText, "user1 shall be responsible").to.have.string(user1);
        await expect(actionItemExpandElementText, "user2 shall be responsible").to.have.string(user2);
    });


    it('can add an action item with a free-text EMail-responsible', function () {
        let topicIndex = 1;
        let emailUser = "noreply@4minitz.com";
        await E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

        const actionItemName = await getNewAIName();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: emailUser
        });
        await (await browser.element("#btnInfoItemSave")).click();
        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        let actionItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let actionItemExpandElementText = (await browser.elementIdText(actionItemExpandElement)).value;

        await expect(actionItemExpandElementText, "user1 shall be responsible").to.have.string(emailUser);
        await E2EGlobal.waitSomeTime();
    });


    it('prohibits non-email-string as free-text responsible', function () {
        let topicIndex = 1;
        let illegalUserName = "NonEMailResponsible";
        await E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

        const actionItemName = await getNewAIName();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: illegalUserName
        });

        // check if 'Invalid Responsible' modal info dialog shows up
        // Hint: browser.getText("h4.modal-title") delivers an array
        // where we are only interested in the *last* element - thus we pop()
        await E2EGlobal.waitSomeTime();
        await expect((await browser.getText("h4.modal-title")).pop(), "'Invalid Responsible' modal should be visible").to.have.string("Invalid Responsible");

        await E2EApp.confirmationDialogAnswer(true);  // click info modal "OK"
        await E2EGlobal.waitSomeTime();

        await (await browser.element("#btnInfoItemSave")).click();    // save AI
        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        let actionItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let actionItemExpandElementText = (await browser.elementIdText(actionItemExpandElement)).value;

        await expect(actionItemExpandElementText, "no illegal responsible added").not.to.have.string(illegalUserName);
    });
});
