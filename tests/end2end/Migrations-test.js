import {E2EApp} from './helpers/E2EApp';
import {E2EMeetingSeries} from './helpers/E2EMeetingSeries';
import {E2EMinutes} from './helpers/E2EMinutes';
import {E2ETopics} from './helpers/E2ETopics';
import {E2EGlobal} from './helpers/E2EGlobal';

// This test might be helpful if there is a bug with our migrations
// The tests creates a series with two minutes containing action and info items
// After that you can migrate down to a specific version and migrate up step by step. After each step
// the amount of items will be count
describe.skip('Migrations', function () {

    const aProjectName = "Migrations";
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

    it('should not change meeting series topics history when migration down and up', function() {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'action item', itemType: 'actionItem'}, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await E2ETopics.toggleActionItem(1, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'new information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'new action item', itemType: 'actionItem'}, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        const checkHistory = async () => {
            const url = await browser.getUrl();
            const msId =  url.slice(url.lastIndexOf("/")+1);

            const topics = await server.call('e2e.getTopicsOfMeetingSeries', msId);

            await expect(topics.length, "Meeting Series should have one topic").to.equal(1);
            await expect(topics[0].infoItems.length, "Topic should have four items").to.equal(4);
        };
        
        await checkHistory(20);

        await E2EGlobal.waitSomeTime(500);

        const startAtVersion = 17;
        await server.call('e2e.triggerMigration', startAtVersion);

        for (let i=startAtVersion+1; i<=21; i++) {
            await server.call('e2e.triggerMigration', i);
            console.log('migrated to version ' + i);
            await E2EGlobal.waitSomeTime(1000);
            await checkHistory();
        }
    });

});