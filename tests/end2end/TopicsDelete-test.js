import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

describe('Topics Delete - Forbid deleting topics which were not created within the current minutes', function () {
    const aProjectName = "E2E Topics Delete";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    const EXISTING_TOPIC = 'existing topic';
    const EXISTING_ACTION = 'existing action item';
    const EXISTING_STICKY_INFO = 'existing sticky info item';

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2ETopics.addTopicToMinutes(EXISTING_TOPIC);
        await E2ETopics.addInfoItemToTopic({
            subject: EXISTING_ACTION,
            itemType: "actionItem"
        }, 1);
        await E2ETopics.addInfoItemToTopic({
            subject: EXISTING_STICKY_INFO,
            itemType: "infoItem"
        }, 1);
        await E2ETopics.toggleInfoItemStickyState(1,1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    it('is allowed to delete a topic which was created within the current minutes even if it has open action items', function() {
        await E2ETopics.addTopicToMinutes('fresh created topic');
        await E2ETopics.addInfoItemToTopic({
            subject: 'fresh action item',
            itemType: "actionItem"
        }, 1);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        await E2ETopics.deleteTopic(1, true);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
    });
    
    it('closes the topic together with its open action items instead of deleting it', function() {
        await E2ETopics.deleteTopic(1, true);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
        expect(await E2ETopics.isTopicClosed(1), "the topic should be closed now").to.be.true;
        expect(await E2ETopics.isActionItemClosed(1, 2), 'the action item should be closed, too').to.be.true;
    });

    it('shows a info dialog and does nothing if the topic and its actions are already closed', function () {
        await E2ETopics.toggleTopic(1);
        await E2ETopics.toggleActionItem(1, 2);
        await E2ETopics.deleteTopic(1);

        let selectorDialog = '#confirmDialog';
        await E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(await browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = (await browser.element(selectorDialog + " .modal-header")).value.ELEMENT;
        let dialogContentTitle = (await browser.elementIdText(dialogContentElement)).value;

        await expect(dialogContentTitle).to.have.string('Cannot delete topic');

        // close dialog otherwise beforeEach-hook will fail!
        await E2EGlobal.clickWithRetry('#confirmationDialogOK');
        await E2EGlobal.waitSomeTime();
    });

    it('closes the action item instead of deleting it', function () {
        await E2ETopics.deleteInfoItem(1, 2, true);
        expect(await E2ETopics.isActionItemClosed(1, 2), "the AI should be closed").to.be.true;
    });

    it('closes the action item instead of deleting it even it was recently edited', function() {
        const topicIndex = 1,
            itemIndex = 2,
            UPDATED_SUBJECT = `${EXISTING_ACTION} (updated)`;
        await E2ETopics.editInfoItemForTopic(topicIndex, itemIndex, {subject: UPDATED_SUBJECT});
        await E2ETopics.deleteInfoItem(topicIndex, itemIndex, true);
        expect(await E2ETopics.isActionItemClosed(topicIndex, 2), "the AI should be closed").to.be.true;
    });

    it('unpins the sticky info item instead of deleting it', function () {
        await E2ETopics.deleteInfoItem(1, 1, true);
        expect(await E2ETopics.isInfoItemSticky(1, 1)).to.be.false;
    });

});
