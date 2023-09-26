import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

import { formatDateISO8601 } from '../../imports/helpers/date';

describe('MeetingSeries Items list', function () {
    const aProjectName = "MeetingSeries Topic List";
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


    it("displays all info- and action-items of all topics", function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information of another topic'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item of another topic', itemType: "actionItem"}, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabItems();

        await expect((await E2ETopics.getAllItemsFromItemList()).length, "List should have 4 items").to.equal(4);

        await expect((await E2ETopics.getNthItemFromItemList(0)).value, "First item should have correct subject").to.have.string("some action item of another topic");
        await expect((await E2ETopics.getNthItemFromItemList(1)).value, "First item should have correct subject").to.have.string("some information of another topic");
        await expect((await E2ETopics.getNthItemFromItemList(2)).value, "First item should have correct subject").to.have.string("some action item");
        await expect((await E2ETopics.getNthItemFromItemList(3)).value, "First item should have correct subject").to.have.string("some information");
    });

    it('can expand an info item to display its details on the item list', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addDetailsToActionItem(1, 1, "Amazing details for this information item");

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabItems();

        await E2ETopics.expandDetailsForNthInfoItem(1);

        await expect((await E2ETopics.getNthItemFromItemList(0)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nAmazing details for this information item');
    });

});