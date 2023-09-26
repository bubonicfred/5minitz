import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('Labels', function () {
    const aProjectName = "E2E Labels";
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

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("make sure test user is logged in, create series and add minutes", function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;

        aMeetingName = await getNewMeetingName();

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        aTopicName = await getNewTopicName();
        await E2ETopics.addTopicToMinutes(aTopicName);
    });

    describe("Labels for Action- / Info Items", function () {

        it('can add a new custom label to an AI', function () {
            const labelName = "MyCustomLabel";
            const labelColor = "#ff0000";

            await E2ETopics.addInfoItemToTopic({
                subject: await getNewAIName(),
                itemType: "actionItem"
            }, 1);

            await E2ETopics.addLabelToItem(1, 1, labelName + labelColor);

            var items = await E2ETopics.getItemsForTopic(1);
            let firstActionITem = items[0].ELEMENT;
            let visibleText = (await browser.elementIdText(firstActionITem)).value;
            await expect(visibleText).to.have.string(labelName);
            await expect(visibleText).to.not.have.string(labelColor);
        });

        it('can add a default label to an info item', function () {
            const defaultLabel = E2EGlobal.SETTINGS.defaultLabels[0].name;

            await E2ETopics.addInfoItemToTopic({
                subject: await getNewAIName(),
                itemType: "infoItem"
            }, 1);

            await E2ETopics.addLabelToItem(1, 1, defaultLabel);

            var items = await E2ETopics.getItemsForTopic(1);
            let firstActionItem = items[0].ELEMENT;
            let visibleText = (await browser.elementIdText(firstActionItem)).value;
            await expect(visibleText).to.have.string(defaultLabel);
        });

        it('changes the labels text in finalized minutes if the label will be renamed', function () {
            const labelName = 'Decision';
            const renamedLabel = 'Entscheidung';

            await E2ETopics.addInfoItemToTopic({
                subject: await getNewAIName(),
                itemType: "infoItem"
            }, 1);

            await E2ETopics.addLabelToItem(1, 1, labelName);

            let items = await E2ETopics.getItemsForTopic(1);
            let firstActionItem = items[0].ELEMENT;
            let visibleText = (await browser.elementIdText(firstActionItem)).value;
            await expect(visibleText, 'setting the label failed').to.have.string(labelName);

            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "labels");
            await E2EMeetingSeriesEditor.changeLabel(labelName, renamedLabel);
            await E2EMinutes.gotoLatestMinutes();

            items = await E2ETopics.getItemsForTopic(1);
            firstActionItem = items[0].ELEMENT;
            visibleText = (await browser.elementIdText(firstActionItem)).value;
            await expect(visibleText, 'label name should have changed').to.have.string(renamedLabel);
        });

        it('resets the labels name if editing will be canceled', function() {
            const labelName = 'Status:RED';
            const renamedLabel = 'Test';
            const changedColor = 'ffffff';

            await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "labels");

            let labelId = await E2EMeetingSeriesEditor.changeLabel(labelName, renamedLabel, changedColor, false);
            let selLabelRow = '#row-label-' + labelId;
            await E2EGlobal.clickWithRetry(selLabelRow + ' .evt-btn-edit-cancel');

            // open editor again
            await E2EGlobal.clickWithRetry(selLabelRow + ' .evt-btn-edit-label');
            let newLabelNameValue = await browser.getValue(selLabelRow + " [name='labelName']");
            await expect(newLabelNameValue, "label name should be restored").to.equal(labelName);

            let newLabelColorValue = await browser.getValue(selLabelRow + " [name='labelColor-" + labelId + "']");
            await expect(newLabelColorValue, "label color should be restored").to.not.equal(changedColor);

            await E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
        });

    });

});