import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'
import {E2EGlobal} from "./helpers/E2EGlobal";

require('../../imports/helpers/date');


describe('Sticky Info Items', function () {
    const aProjectName = "E2E Sticky Info Items";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aInfoItemName = "";
    let aAICounter = 0;
    let aAINameBase = "Info Item Name #";

    let getNewMeetingName = async () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };
    let getNewTopicName = async () => {
        aTopicCounter++;
        return aTopicNameBase + aTopicCounter;
    };
    let getNewInfoItemName = async () => {
        aAICounter++;
        aInfoItemName = aAINameBase + aAICounter;
        return aInfoItemName;
    };

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

        await E2ETopics.addInfoItemToTopic({
            subject: await getNewInfoItemName(),
            infoItemType: "infoItem"
        }, 1);
    });


    it('is possible to toggle the sticky-state of info items', function () {
        await E2ETopics.toggleInfoItemStickyState(1, 1);
        expect(await E2ETopics.isInfoItemSticky(1, 1)).to.be.true;
    });

    it('ensures that sticky-info-items will be presented in the next minute again', function () {
        await E2ETopics.toggleInfoItemStickyState(1, 1);

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.gotoParentMeetingSeries();

        // add a second minute
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await expect(await E2ETopics.countItemsForTopic(1), "The topic should have one item").to.equal(1);
        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let stickyInfoItem = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(stickyInfoItem)).value, "the sticky info item should be displayed")
            .to.have.string(aInfoItemName);

        expect(await E2ETopics.isInfoItemSticky(1, 1)).to.be.true;
    });

    it('closes a discussed topic which has a sticky-info-item but no open AIs and does not present the topic in the next minute again', function () {
        await E2ETopics.toggleInfoItemStickyState(1, 1);
        await E2ETopics.toggleTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.gotoParentMeetingSeries();

        // add a second minute
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await expect(await E2ETopics.countTopicsForMinute(), "the new minute should have no topics").to.equal(0);
    });

    it('ensures that the sticky-status of an info item in a finalized minute can not be modified', function () {
        await E2EMinutes.finalizeCurrentMinutes();

        await E2ETopics.toggleInfoItemStickyState(1, 1);
        expect(await E2ETopics.isInfoItemSticky(1, 1), "non-sticky item should not have changed state").to.be.false;

        await E2EMinutes.unfinalizeCurrentMinutes();
        await E2ETopics.toggleInfoItemStickyState(1, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        expect(await E2ETopics.isInfoItemSticky(1, 1), "sticky item should have changed state").to.be.true;
    });

    it('can not change the sticky status of info-items on the topics page of the meeting series', function () {
        await E2ETopics.addInfoItemToTopic({
            subject: await getNewInfoItemName(),
            infoItemType: "infoItem"
        }, 1);
        await E2ETopics.toggleInfoItemStickyState(1, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeries.gotoTabTopics();

        await E2ETopics.toggleInfoItemStickyState(1, 1);
        expect(await E2ETopics.isInfoItemSticky(1, 1), "sticky item should not have changed state").to.be.true;

        await E2ETopics.toggleInfoItemStickyState(1, 2);
        expect(await E2ETopics.isInfoItemSticky(1, 2), "non-sticky item should not have changed state").to.be.false;
    });

    it('ensures that changing the subject of a sticky-info-item also updates the related item located ' +
        'in the topic list of the meeting series after finalizing the minute', function () {

        const newInfoItemName = "updated info item subject";

        await E2ETopics.toggleInfoItemStickyState(1, 1);
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await E2ETopics.editInfoItemForTopic(1, 1, {subject: newInfoItemName});
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeries.gotoTabTopics();

        await expect(await E2ETopics.countItemsForTopic(1), "topic should have one item").to.equal(1);

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let stickyInfoItem = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(stickyInfoItem)).value, "the subject of the sticky info item should have changed")
            .to.have.string(newInfoItemName);

        expect(await E2ETopics.isInfoItemSticky(1, 1), "the info item should be still sticky").to.be.true;
    });

});