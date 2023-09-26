import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('MeetingSeries Items Tab', function () {
    const aProjectName = "MeetingSeries Items Tab";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });


    it("can filter the list of items", function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item with information', itemType: "actionItem"}, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabItems();

        await expect(await E2ETopics.countItemsForTopic('#itemPanel'), "Items list should have three items").to.equal(3);

        await browser.setValue('#inputFilter', 'information');
        await expect(await E2ETopics.countItemsForTopic('#itemPanel'), "Items list should have now two items").to.equal(2);
    });


});