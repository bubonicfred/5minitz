import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';


describe('Info Items', function () {
    const aProjectName = "E2E Info Items";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
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

        aTopicName = await getNewTopicName();
        await E2ETopics.addTopicToMinutes(aTopicName);
    });

    it('can add an info item', function () {
        let topicIndex = 1;
        const infoItemName = await getNewAIName();
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "infoItem"
        }, topicIndex);

        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(await browser.isVisible(selector), "Info item should be visible").to.be.true;

        let infoItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let infoItemExpandElementText = (await browser.elementIdText(infoItemExpandElement)).value;

        await expect(infoItemExpandElementText, "Info item visible text should match").to.have.string(infoItemName);
    });

    it('shows security question before deleting info items', function () {
        const infoItemName = await getNewAIName();
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "infoItem"
        }, 1);

        await E2ETopics.deleteInfoItem(1, 1);

        let selectorDialog = "#confirmDialog";

        await E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(await browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = (await browser.element(selectorDialog + " .modal-body")).value.ELEMENT;
        let dialogContentText = (await browser.elementIdText(dialogContentElement)).value;

        await expect(dialogContentText, 'dialog content should display the title of the to-be-deleted object').to.have.string(infoItemName);
        await expect(dialogContentText, 'dialog content should display the correct type of the to-be-deleted object').to.have.string("information");

        // close dialog otherwise beforeEach-hook will fail!
        await E2EApp.confirmationDialogAnswer(false);
    });

    it('can delete an info item', function () {
        let topicIndex = 1;
        const infoItemName = await getNewAIName();
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "infoItem"
        }, topicIndex);

        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(await browser.isVisible(selector), "Info item should be visible").to.be.true;

        await E2ETopics.deleteInfoItem(1, 1, true);
        expect(await browser.isVisible(selector), "Info item should be deleted").to.be.false;
    });


    it('can cancel a "delete info item"', function () {
        let topicIndex = 1;
        const infoItemName = await getNewAIName();
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "infoItem"
        }, topicIndex);

        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(await browser.isVisible(selector), "Info item should be visible").to.be.true;

        await E2ETopics.deleteInfoItem(1, 1, false);
        expect(await browser.isVisible(selector), "Info item should still exist").to.be.true;
    });


    it('can submit an info item by pressing enter in the topic field', function () {
        let topicIndex = 1;
        await E2ETopics.openInfoItemDialog(topicIndex, "infoItem");

        const infoItemName = await getNewAIName();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: infoItemName,
            itemType: "infoItem"
        });

        const subjectInput = await browser.$('#id_item_subject');
        await subjectInput.keys('Enter');

        await E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(await browser.isVisible(selector), "Info item should be visible").to.be.true;

        let infoItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let infoItemExpandElementText = (await browser.elementIdText(infoItemExpandElement)).value;

        await expect(infoItemExpandElementText, "Info item visible text should match").to.have.string(infoItemName);
    });

    it('can edit an info item', function () {
        let topicIndex = 1;
        await E2ETopics.addInfoItemToTopic({
            subject: "Old Item Subject",
            itemType: "infoItem",
            label: "Proposal"
        }, topicIndex);
        await E2EGlobal.waitSomeTime();

        await E2ETopics.openInfoItemEditor(topicIndex, 1);
        await E2EGlobal.waitSomeTime();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: "New Item Subject",
            itemType: "infoItem",
            label: "Decision"
        });
        await E2ETopics.submitInfoItemDialog();

        // Check new subject text
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(await browser.isVisible(selector), "Info item should be visible after edit").to.be.true;
        let infoItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let infoItemExpandElementText = (await browser.elementIdText(infoItemExpandElement)).value;
        await expect(infoItemExpandElementText, "Info item subject text should match after edit").to.have.string("New Item Subject");

        // Check new label
        let newLabelSelector = "#topicPanel .well:nth-child(" + topicIndex + ") .label:nth-child(1)";
        expect(await browser.isVisible(newLabelSelector), "New label should be visible").to.be.true;
        infoItemExpandElement = (await browser.element(newLabelSelector)).value.ELEMENT;
        infoItemExpandElementText = (await browser.elementIdText(infoItemExpandElement)).value;
        await expect(infoItemExpandElementText, "New label text should match").to.have.string("Decision");
    });

    it('can edit the 2nd info item after creating three of them', function() {
        let topicIndex = 1;
        for (let i=1; i<4; i++) {
            await E2ETopics.addInfoItemToTopic({
                subject: `Info Item #${i}`,
                itemType: "infoItem"
            }, topicIndex);
            await E2EGlobal.waitSomeTime();
            if (i === 2) { // edit the first (last added) entry after adding the 2nd one.
                await E2ETopics.openInfoItemEditor(topicIndex, 1);
                await E2EGlobal.waitSomeTime();
                await E2ETopics.submitInfoItemDialog();
            }
        }

        for (let i=1; i>4; i++) {
            // Check new subject text
            const selector = `#topicPanel .well:nth-child(${topicIndex}) .topicInfoItem:nth-child(${i})`;
            expect(await browser.isVisible(selector), `Info Item ${i} should be visible`).to.be.true;
            let infoItemExpandElement = (await browser.element(selector)).value.ELEMENT;
            let infoItemExpandElementText = (await browser.elementIdText(infoItemExpandElement)).value;
            await expect(infoItemExpandElementText, `Info Item ${i} should be added correctly`).to.have.string(`Info Item #${i}`);
        }

        // Check if the 2nd item can be edited correctly
        await E2ETopics.openInfoItemEditor(topicIndex, 2);
        await E2EGlobal.waitSomeTime();
        await E2ETopics.insertInfoItemDataIntoDialog({
            subject: 'Info Item #2 - changed',
            itemType: 'infoItem'
        });
        await E2ETopics.submitInfoItemDialog();

        const selector = `#topicPanel .well:nth-child(${topicIndex}) .topicInfoItem:nth-child(2)`;
        let infoItemExpandElement = (await browser.element(selector)).value.ELEMENT;
        let infoItemExpandElementText = (await browser.elementIdText(infoItemExpandElement)).value;
        await expect(infoItemExpandElementText, `Info Item 2 should be edited correctly`).to.have.string('Info Item #2 - changed');

    });
});
