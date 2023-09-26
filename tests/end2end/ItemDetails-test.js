import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

import { formatDateISO8601 } from '../../imports/helpers/date';


describe('Item Details', function () {
    const aProjectName = "E2E ActionItems Details";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aAICounter = 0;
    let aAINameBase = "Item Name #";

    let infoItemName;

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

        infoItemName = await getNewAIName();
        aTopicName = await getNewTopicName();
        await E2ETopics.addTopicToMinutes(aTopicName);
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "actionItem"
        }, 1);
    });

    it('can add first details to a new Info Item', function() {
        const detailsText = 'First Details for Info Item';
        await E2ETopics.addFirstDetailsToNewInfoItem({
            subject: await getNewAIName(),
            itemType: "infoItem"
        },1 , detailsText);

        await E2EGlobal.waitSomeTime();
        await (await browser.element(".expandDetails ")).click();
        await E2EGlobal.waitSomeTime();

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;

        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\n' + detailsText);
    });

    it('can add details to an Action Item', function() {
        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nNew Details');
    });

    it('can add details to an Info Item, too', function() {
        const detailsText = 'New Details for Info Item';
        await E2ETopics.addInfoItemToTopic({
            subject: await getNewAIName(),
            itemType: 'infoItem'
        }, 1);

        await E2ETopics.addDetailsToActionItem(1, 1, detailsText);

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\n' + detailsText);
    });

    it('can add a second detail to an Action Item', function () {
        await E2ETopics.addDetailsToActionItem(1, 1, 'First Details');
        await E2ETopics.addDetailsToActionItem(1, 1, 'Second Details');

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value, "First added detail should be displayed")
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nFirst Details');
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value, "2nd added detail should be displayed, too")
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nSecond Details');
    });

    it('can add details to the 2nd AI of the same topic persistent', function() {
        await E2ETopics.addInfoItemToTopic({
            subject: await getNewAIName(),
            itemType: "actionItem"
        }, 1);
        await E2ETopics.addDetailsToActionItem(1, 1, 'First Details');

        const detailsText = 'Details for the 2nd AI';

        await E2ETopics.addDetailsToActionItem(1, 2, detailsText);

        await browser.refresh();
        await E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        await E2ETopics.expandDetailsForActionItem(1, 2);

        await E2EGlobal.waitSomeTime(100); // phantom.js needs some time here, too...

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
        await expect((await browser.elementIdText(sndItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\n' + detailsText);
    });

    it('can edit the details of the 2nd AI of the same topic', function() {
        await E2ETopics.addDetailsToActionItem(1, 1, 'First Details');

        await E2ETopics.addInfoItemToTopic({
            subject: await getNewAIName(),
            itemType: "actionItem"
        }, 1);
        await E2ETopics.addDetailsToActionItem(1, 1, '2nd Details');

        await E2ETopics.editDetailsForActionItem(1, 2, 1, "Updated Details");
        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
        await expect((await browser.elementIdText(sndItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\n' + "Updated Details");
    });

    it('does not remove details when AI will be updated with the edit dialog', function () {
        const newSubject = "AI - changed subject";

        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        await E2ETopics.editInfoItemForTopic(1, 1, { subject: newSubject });

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1, 1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        let completeAIText = (await browser.elementIdText(firstItemOfNewTopic)).value;
        await expect(completeAIText, "Subject of AI should have changed").to.have.string(newSubject);
        await expect(completeAIText, "AI should still contain the details").to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nNew Details');
    });

    it('does not revert changes when input field receives click-event during input', function () {
        let doBeforeSubmit = async inputElement => {
           // perform click event on the input field after setting the text and before submitting the changes
            await E2EGlobal.clickWithRetry(inputElement);
        };

        await E2ETopics.addDetailsToActionItem(1, 1, 'First Details', doBeforeSubmit);

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value, "Added detail should be displayed")
            .to.have.string((await formatDateISO8601(new Date())) + ' New' +'\nFirst Details');
    });

    it('can change existing details', function () {
        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        await E2ETopics.editDetailsForActionItem(1, 1, 1, 'New Details (changed)');

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nNew Details (changed)');
    });

    it('shows an confirmation dialog when removing existing details', function() {
        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        await E2ETopics.editDetailsForActionItem(1, 1, 1, ''); // empty text will remove the detail

        let selectorDialog = "#confirmDialog";

        await E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(await browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = (await browser.element(selectorDialog + " .modal-body")).value.ELEMENT;
        let dialogContentText = (await browser.elementIdText(dialogContentElement)).value;

        await expect(dialogContentText, 'dialog content should display the subject of the to-be-deleted parent item')
            .to.have.string(infoItemName);

        // close dialog otherwise beforeEach-hook will fail!
        await E2EApp.confirmationDialogAnswer(false);
    });

    it('should remove the details if the input field of the new item will be submitted empty', function() {
        await E2ETopics.addDetailsToActionItem(1, 1, '');

        let selectorDialog = "#confirmDialog";

        await E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(await browser.isVisible(selectorDialog), "Dialog should be visible").to.be.false;

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value, 'the item should have not have any details')
            .to.not.have.string(await formatDateISO8601(new Date()));
    });

    it('saves details persistent', function () {
        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        await browser.refresh();
        await E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        await E2ETopics.expandDetailsForActionItem(1, 1);

        await E2EGlobal.waitSomeTime(100); // phantom.js needs some time here, too...

        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nNew Details');
    });

    it('ensures that only moderator can add details', function () {
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await browser.setValue('#edt_AddUser', user2);
        await browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = await browser.selectByValue(selector, "Invited");
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save


        await E2EApp.loginUser(1);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EGlobal.waitSomeTime();

        await E2EMinutes.gotoLatestMinutes();

        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details');


        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.not.have.string((await formatDateISO8601(new Date())) + ' New' + '\nNew Details');

        await E2EApp.loginUser();
    });

    it('ensures that only moderator can change details', function () {
        await E2ETopics.addDetailsToActionItem(1, 1, 'Old Details');

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await browser.setValue('#edt_AddUser', user2);
        await browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = await browser.selectByValue(selector, "Invited");
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EApp.loginUser(1);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EGlobal.waitSomeTime();

        await E2EMinutes.gotoLatestMinutes();

        await E2ETopics.editDetailsForActionItem(1, 1, 1, 'Changed Details');


        let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemOfNewTopic)).value)
            .to.have.string((await formatDateISO8601(new Date())) + ' New' + '\nOld Details');

        await E2EApp.loginUser();
    });

    it('can follow a-hyperlink in details', function() {
        await E2ETopics.addDetailsToActionItem(1, 1, 'New Details with link to http://www.google.com');

        await E2EGlobal.clickWithRetry(".detailText a");
        await E2EGlobal.waitSomeTime();
        console.log("new URL after click:"+(await browser.getUrl()));
        await expect(await browser.getUrl()).to.contain.string("google");
    });
});