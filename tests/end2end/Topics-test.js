import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

describe('Topics', function () {
    const aProjectName = "E2E Topics";
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
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    it('can add a topic to minutes', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('can add a topic to minutes at the end of topics list', function() {
        const testTopicName = 'some topic at the end';
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutesAtEnd(testTopicName);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        expect((await E2ETopics.getLastTopicForMinute()) === testTopicName);
    });

    it('can submit a new topic by pressing enter on the topic title input', function () {
        await browser.waitForVisible("#id_showAddTopicDialog");
        await E2EGlobal.clickWithRetry("#id_showAddTopicDialog");

        await E2ETopics.insertTopicDataIntoDialog("some topic");

        const subjectInput = await browser.$('#id_subject');
        await subjectInput.keys('Enter');

        await E2EGlobal.waitSomeTime(700);

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('can add multiple topics', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(3);
    });

    it('shows security question before deleting a topic', function() {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.deleteTopic(1);

        let selectorDialog = "#confirmDialog";

        await E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(await browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = (await browser.element(selectorDialog + " .modal-body")).value.ELEMENT;
        let dialogContentText = (await browser.elementIdText(dialogContentElement)).value;

        await expect(dialogContentText, 'dialog content should display the title of the to-be-deleted object').to.have.string('some topic');

        // close dialog otherwise beforeEach-hook will fail!
        await E2EApp.confirmationDialogAnswer(false);
    });


    it('can delete a topic', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('yet another topic');
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        await E2ETopics.deleteTopic(1, true);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
    });


    it('can cancel a "delete topic"', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('yet another topic');
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        await E2ETopics.deleteTopic(1, false);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
    });


    it('multiple topics are added with latest topic at the top', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');

        const topics = await E2ETopics.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = (await browser.elementIdText(elementId)).value;

        await expect(visibleText).to.have.string('yet another topic');
    });

    await it.skip('can not change the order of topics via drag and drop by clicking anywhere', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');

        await browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        const topics = await E2ETopics.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = (await browser.elementIdText(elementId)).value;

        await expect(visibleText).to.have.string('yet another topic');
    });

    await it.skip('can change the order of topics via drag and drop by clicking on the sort icon', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');

        await browser.waitForExist('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        await browser.moveToObject('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        await browser.buttonDown();
        await browser.moveTo(1, 1);
        await browser.moveToObject('#topicPanel .well:nth-child(1)');
        await browser.buttonUp();

        const topics = await E2ETopics.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = (await browser.elementIdText(elementId)).value;

        await expect(visibleText).to.have.string('some topic');
    });

    await it.skip('can not change the order of topics on the topics page', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        await E2EGlobal.clickWithRetry('#tab_topics');
        await E2EGlobal.waitSomeTime();

        const topicsBeforeSortAttempt = await E2ETopics.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = (await browser.elementIdText(firstElementBeforeSortAttempt)).value;
        await expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        await browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        const topicsAfterSortAttempt = await E2ETopics.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = (await browser.elementIdText(firstElementAfterSortAttempt)).value;
        await expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });

    await it.skip('can not change the order of topics of finalized minutes', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');

        await E2EMinutes.finalizeCurrentMinutes();

        const topicsBeforeSortAttempt = await E2ETopics.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = (await browser.elementIdText(firstElementBeforeSortAttempt)).value;
        await expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        await browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        const topicsAfterSortAttempt = await E2ETopics.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = (await browser.elementIdText(firstElementAfterSortAttempt)).value;
        await expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });


    await it.skip('ensures invited user can not drag-n-drop topics', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');
        
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        let currentUser = await E2EApp.getCurrentUser();
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
        const topicsBeforeSortAttempt = await E2ETopics.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = (await browser.elementIdText(firstElementBeforeSortAttempt)).value;
        await expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        expect(await browser.isExisting('#topicPanel .well:nth-child(3) .topicDragDropHandle')).to.be.false;

        await E2EApp.loginUser();
    });


    await it.skip('sorting of topics is persistent', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addTopicToMinutes('some other topic');
        await E2ETopics.addTopicToMinutes('yet another topic');

        await browser.waitForExist('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        await browser.moveToObject('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        await browser.buttonDown();
        await browser.moveTo(1, 1);
        await browser.moveToObject('#topicPanel .well:nth-child(1)');
        await browser.buttonUp();

        const topicsBeforeReload = await E2ETopics.getTopicsForMinute();
        let firstElementBeforeReload = topicsBeforeReload[0].ELEMENT;
        let visibleTextBeforeReload = (await browser.elementIdText(firstElementBeforeReload)).value;
        await expect(visibleTextBeforeReload).to.have.string('some topic');

        await browser.refresh();
        await E2EGlobal.waitSomeTime(2500); // phantom.js needs some time here...

        const topicsAfterReload = await E2ETopics.getTopicsForMinute();
        let firstElementAfterReload = topicsAfterReload[0].ELEMENT;
        let visibleTextAfterReload = (await browser.elementIdText(firstElementAfterReload)).value;
        await expect(visibleTextAfterReload).to.have.string('some topic');
    });


    it('can collapse a topic', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        await E2ETopics.addTopicToMinutes('topic 2');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        let infoitems = (await browser.elements(".infoitem")).value;
        await expect(infoitems.length).to.be.equal(2);

        // collapse top-most topic
        await E2EGlobal.clickWithRetry('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        infoitems = (await browser.elements(".infoitem")).value;
        await expect(infoitems.length).to.be.equal(1);

        let firstVisibleInfoitemId = infoitems[0].ELEMENT;
        let firstVisibleInfoItemText = (await browser.elementIdText(firstVisibleInfoitemId)).value;
        await expect(firstVisibleInfoItemText).to.have.string("InfoItem#1");
    });

    it('can collapse and re-expand a topic', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        await E2ETopics.addTopicToMinutes('topic 2');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        await E2EGlobal.clickWithRetry('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        await E2EGlobal.clickWithRetry('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        let infoitems = (await browser.elements(".infoitem")).value;
        await expect(infoitems.length).to.be.equal(2);
    });


    it('can collapse all topics', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        await E2ETopics.addTopicToMinutes('topic 2');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        await E2EGlobal.clickWithRetry('#btnCollapseAll');
        let infoitems = (await browser.elements(".infoitem")).value;
        await expect(infoitems.length).to.be.equal(0);
    });


    it('can collapse and re-expand all topics', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        await E2ETopics.addTopicToMinutes('topic 2');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        await E2EGlobal.clickWithRetry('#btnCollapseAll');
        await E2EGlobal.clickWithRetry('#btnExpandAll');
        let infoitems = (await browser.elements(".infoitem")).value;
        await expect(infoitems.length).to.be.equal(2);
    });

    it('can close topics', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        await E2ETopics.addTopicToMinutes('topic 2');
        await E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        await E2ETopics.toggleTopic(1);
        await E2ETopics.toggleTopic(2);

        expect(await E2ETopics.isTopicClosed(1), "first topic should be closed").to.be.true;
        expect(await E2ETopics.isTopicClosed(2), "second topic should be closed").to.be.true;
    });

    it('is possible to mark topics as recurring persistently', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addTopicToMinutes('topic 2');

        expect(await E2ETopics.isTopicRecurring(1), 'topic should not be recurring initially').to.be.false;

        await E2ETopics.toggleRecurringTopic(1);

        await browser.refresh();
        await E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        expect(await E2ETopics.isTopicRecurring(1), 'topic should be recurring').to.be.true;
        expect(await E2ETopics.isTopicRecurring(2), 'unchanged topic should not be recurring').to.be.false;
    });

    it('ensures that recurring topics will be displayed as recurring even in read-only-mode', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addTopicToMinutes('topic 2');

        await E2ETopics.toggleRecurringTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();

        expect(await E2ETopics.isTopicRecurring(1), 'recurring topic should be displayed as recurring after finalizing the minute').to.be.true;
        expect(await E2ETopics.isTopicRecurring(2), 'unchanged topic should not be displayed as recurring after finalizing the minute').to.be.false;

        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeries.gotoTabTopics();

        expect(await E2ETopics.isTopicRecurring(1), 'recurring topic should be displayed as recurring on topics tab').to.be.true;
        expect(await E2ETopics.isTopicRecurring(2), 'unchanged topic should not be displayed as recurring on topics tab').to.be.false;
    });

    it('ensures that it is not possible to change the recurring flag if topic is presented in read-only-mode', function () {
        await E2ETopics.addTopicToMinutes('topic 1');
        await E2ETopics.addTopicToMinutes('topic 2');
        await E2ETopics.toggleRecurringTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2ETopics.toggleRecurringTopic(1);
        await E2ETopics.toggleRecurringTopic(2);

        expect(await E2ETopics.isTopicRecurring(1), 'topic of minute should not be able to set as not-recurring if minute is finalized').to.be.true;
        expect(await E2ETopics.isTopicRecurring(2), 'topic of minute should not be able to set as recurring if minute is finalized').to.be.false;

        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeries.gotoTabTopics();

        await E2ETopics.toggleRecurringTopic(1);
        await E2ETopics.toggleRecurringTopic(2);

        expect(await E2ETopics.isTopicRecurring(1), 'topic of meeting series should not be able to modify in topics tab').to.be.true;
        expect(await E2ETopics.isTopicRecurring(2), 'topic of meeting series should not be able to set as recurring in topics tab').to.be.false;
    });

    it('ensures that a closed recurring topic should be presented in the next minute again', function () {
        const myTopicSubject = 'recurring topic';

        await E2ETopics.addTopicToMinutes(myTopicSubject);
        await E2ETopics.toggleRecurringTopic(1);
        await E2ETopics.toggleTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const topicsOfNewMinute = await E2ETopics.getTopicsForMinute();
        let firstElement = topicsOfNewMinute[0].ELEMENT;
        let visibleText = (await browser.elementIdText(firstElement)).value;
        await expect(visibleText).to.have.string(myTopicSubject);
    });

    it('ensures that the isRecurring-State of a topic in the meeting series topic list will be overwritten from the ' +
        'topics state within the last finalized minute', function () {

        const myTopicSubject = 'recurring topic';

        await E2ETopics.addTopicToMinutes(myTopicSubject);
        await E2ETopics.toggleRecurringTopic(1);
        await E2ETopics.toggleTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await E2ETopics.toggleRecurringTopic(1);
        await E2ETopics.toggleTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeries.gotoTabTopics();

        expect(await E2ETopics.isTopicRecurring(1)).to.be.false;
    });

    it('should not be possible to insert a new topics to a meeting minutes which has the same id as an existing one ' +
        '- even not by using the meteor method directly', function() {
        const url = await browser.getUrl();
        let parts = url.split('/');
        let minutesId = parts[parts.length - 1];

        let topic = {
            _id: 'nCNm3FCx4hRmp2SDQ',
            subject: 'duplicate me',
            isOpen:false,
            isRecurring:false,
            isNew:true,
            isSkipped: false,
            infoItems: [],
            labels: []
        };
        let aUser = E2EGlobal.SETTINGS.e2eTestUsers[0];
        let aPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
        await server.call('login', {user: {username: aUser}, password: aPassword});

        await server.call('minutes.addTopic', minutesId, topic);
        try {
            await server.call('minutes.addTopic', minutesId, topic);
        } catch(e) {
            // this is expected
        }

        await E2EGlobal.waitSomeTime();

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('check whether labelselectionfield exists', function() {
        await browser.waitForVisible("#id_showAddTopicDialog");
        await E2EGlobal.clickWithRetry("#id_showAddTopicDialog");
        await E2EGlobal.waitSomeTime(350);

        expect(await browser.waitForExist("#id_item_selLabels")).to.be.true;
        await E2EGlobal.waitSomeTime(350);
        await E2EGlobal.clickWithRetry("#btnTopicCancel");
    });

    it('add label to topic via selection field', function() {
        let labelName = 'testLabel';
        await E2ETopics.addTopicWithLabelToMinutes('topic', labelName);
        await E2EGlobal.waitSomeTime(500);

        expect(await browser.waitForExist(".topic-labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('add label to topic via textbox', function() {
        let labelName = 'testLabel';
        await E2ETopics.addTopicToMinutes('topic #' + labelName);
        await E2EGlobal.waitSomeTime(500);

        expect(await browser.waitForExist(".topic-labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('add more (2) labels to topic via textbox', function() {
        const topicName = 'testTopic'
        const labelName1 = 'testLabel1';
        const labelName2 = 'testLabel2';
        await E2ETopics.addTopicToMinutes(topicName + ' #' + labelName1 + ' #' + labelName2);
        await E2EGlobal.waitSomeTime(500);

        expect(await browser.waitForExist(".topic-labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label:nth-child(1)")).to.equal(labelName1);
        await expect(await browser.getText(".topic-labels .label:nth-child(2)")).to.equal(labelName2);
    });

    it('add label to topic and check if topic is displayed in topic tab of meeting series', function() {
        let labelName = 'testLabel';
        await E2ETopics.addTopicToMinutes('topic #' + labelName);
        await E2EGlobal.waitSomeTime(500);

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeries.gotoTabTopics();

        expect(await browser.waitForExist(".topic-labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('can add a topic with label to minutes at the end of topics list', function() {
        const testTopicName = 'some topic at the end';
        const labelName = 'testLabel';
        await E2ETopics.addTopicToMinutes('some topic on top');
        await E2ETopics.addTopicToMinutesAtEnd(testTopicName + " #" + labelName);
        await E2EGlobal.waitSomeTime(500);

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        expect((await E2ETopics.getLastTopicForMinute()) === testTopicName);
        expect(await browser.waitForExist(".topic-labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('can add a topic with more (2) labels to minutes at the end of topics list', function() {
        const testTopicName = 'some topic at the end';
        const labelName1 = 'testLabel1';
        const labelName2 = 'testLabel2';
        await E2ETopics.addTopicToMinutes('some topic on top');
        await E2ETopics.addTopicToMinutesAtEnd(testTopicName + " #" + labelName1 + " #" + labelName2);
        await E2EGlobal.waitSomeTime(500);

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        expect((await E2ETopics.getLastTopicForMinute()) === testTopicName);
        expect(await browser.waitForExist(".labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label:nth-child(1)")).to.equal(labelName1);
        await expect(await browser.getText(".topic-labels .label:nth-child(2)")).to.equal(labelName2);
    });

    it('can add a topic with responsible to minutes at the end of topics list', function() {
        const testTopicName = 'some topic at the end';
        const responsibleName = 'TestResponsible';
        await E2ETopics.addTopicToMinutes('some topic on top');
        await E2ETopics.addTopicToMinutesAtEnd(testTopicName + " @" + responsibleName);
        await E2EGlobal.waitSomeTime(500);

        let topicHeadingText = await (await browser.element("#topicPanel .well:nth-child(2) h3")).getText();

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        expect((await E2ETopics.getLastTopicForMinute()) === testTopicName);
        await expect (topicHeadingText).to.contain(responsibleName);
    });

    it('can add a topic with more (2) responsible to minutes at the end of topics list', function() {
        const testTopicName = 'some topic at the end';
        const responsibleName1 = 'TestResponsible1';
        const responsibleName2 = 'TestResponsible2';
        await E2ETopics.addTopicToMinutes('some topic on top');
        await E2ETopics.addTopicToMinutesAtEnd(testTopicName + " @" + responsibleName1 + " @" + responsibleName2);
        await E2EGlobal.waitSomeTime(500);

        let topicHeadingText = await (await browser.element("#topicPanel .well:nth-child(2) h3")).getText();

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        expect((await E2ETopics.getLastTopicForMinute()) === testTopicName);
        await expect (topicHeadingText).to.contain(responsibleName1, responsibleName2);
    });

    it('can add a topic with label and responsible to minutes at the end of topics list', function() {
        const testTopicName = 'some topic at the end';
        const labelName = 'testLabel';
        const responsibleName = 'TestResponsible';
        await E2ETopics.addTopicToMinutes('some topic on top');
        await E2ETopics.addTopicToMinutesAtEnd(testTopicName + " #" + labelName + " @" + responsibleName);
        await E2EGlobal.waitSomeTime(500);

        let topicHeadingText = await (await browser.element("#topicPanel .well:nth-child(2) h3")).getText();

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        expect((await E2ETopics.getLastTopicForMinute()) === testTopicName);
        expect(await browser.waitForExist(".topic-labels")).to.be.true;
        await expect(await browser.getText(".topic-labels .label")).to.equal(labelName);
        await expect (topicHeadingText).to.contain(responsibleName);
    });
});
