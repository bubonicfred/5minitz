import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

describe('MyActionItems Tab', function () {
    const aProjectName = 'MyActionItems Tab';
    let aMeetingCounter = 0;
    let aMeetingNameBase = 'Meeting Name #';

    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp('Start test suite');
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    // **************
    // ATTENTION!
    // This test case has expected side effect to next test case!
    // **************
    it('can filter my action items from all meeting series', function () {
        await this.timeout(150000);

        let meetingName = aMeetingNameBase + '1';
        await E2EMeetingSeries.createMeetingSeries(aProjectName, meetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        await E2ETopics.addTopicToMinutes('topic #1');
        await E2ETopics.addInfoItemToTopic({subject: 'action item #1', itemType: 'actionItem', responsible: await E2EApp.getCurrentUser()}, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        await E2ETopics.addTopicToMinutes('topic #2');
        await E2ETopics.addInfoItemToTopic({subject: 'action item #2', itemType: 'actionItem', responsible: await E2EApp.getCurrentUser()}, 1);
        await E2ETopics.toggleActionItem(1, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        meetingName = aMeetingNameBase + '2';
        await E2EMeetingSeries.createMeetingSeries(aProjectName, meetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        await E2ETopics.addTopicToMinutes('topic #3');
        await E2ETopics.addInfoItemToTopic({subject: 'action item #3', itemType: 'actionItem', responsible: await E2EApp.getCurrentUser()}, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        await E2ETopics.addTopicToMinutes('topic #4');
        await E2ETopics.addInfoItemToTopic({subject: 'action item #4', itemType: 'actionItem', responsible: await E2EApp.getCurrentUser()}, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EApp.gotoStartPage();
        await E2EApp.gotoActionItemsTab();

        await expect(await E2ETopics.countItemsForTopic('#itemPanel'), 'Items list should have three items').to.equal(3);
    });

    // **************
    // ATTENTION!
    // This test case has expected side effect to next test case!
    // **************
    it('can filter my action items from all action items', function () {
        let meetingName = aMeetingNameBase + '3';
        await E2EMeetingSeries.createMeetingSeries(aProjectName, meetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        await E2ETopics.addTopicToMinutes('topic #5');
        await E2ETopics.addInfoItemToTopic({subject: 'action item #5', itemType: 'actionItem', responsible: ((await E2EApp.getCurrentUser()) + ',' + E2EGlobal.SETTINGS.e2eTestUsers[1])}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'action item #6', itemType: 'actionItem', responsible: E2EGlobal.SETTINGS.e2eTestUsers[1]}, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EApp.gotoStartPage();
        await E2EApp.gotoActionItemsTab();

        await expect(await E2ETopics.countItemsForTopic('#itemPanel'), 'Items list should have four items').to.equal(4);
    });

    it('can navigate from AI on "My Action Item" to parent topic', function () {
        await E2EApp.gotoStartPage();
        await E2EApp.gotoActionItemsTab();

        const firstActionItemOnMyActionItemsView = await E2ETopics.getNthItemFromItemList(0);
        const firstAItextOnMyActionItemsView = firstActionItemOnMyActionItemsView.value.replace(/\n.*/,'');
        await E2EGlobal.clickWithRetry('a.linkItemContext');  // navigate to parent topic view

        const firstItemOnTopicView = await E2ETopics.getNthItemFromItemList(0);

        await expect(firstAItextOnMyActionItemsView, 'AI before & AI after shall be same').to.equal(firstItemOnTopicView.value);
    });
});