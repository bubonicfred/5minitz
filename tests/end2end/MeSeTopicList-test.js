import { E2EApp } from './helpers/E2EApp'
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'

describe('MeetingSeries complete Topic list', function () {
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


    it("copies all topics of the first minute to the parent series including both all info- and actionItems.", function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabTopics();

        await expect(await E2ETopics.countTopicsForMinute(), "Meeting Series should have one topic").to.equal(1);

        await expect(await E2ETopics.countItemsForTopic(1), "Topic should have two items").to.equal(2);

        let items = await E2ETopics.getItemsForTopic(1);
        let firstItemElement = items[0].ELEMENT;
        await expect((await browser.elementIdText(firstItemElement)).value, "fist element should be the action item").to.have.string('some action item');

        let sndElement = items[1].ELEMENT;
        await expect((await browser.elementIdText(sndElement)).value, "2nd element should be the info item").to.have.string('some information');
    });

    it('closes the topic if it were discussed and has no open AI', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        await E2ETopics.toggleActionItem(1, 1);
        await E2ETopics.toggleTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabTopics();

        expect(await E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
    });

    it('remains the topic open if it were neither discussed nor has open AI', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabTopics();

        expect(await E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
    });

    it('remains the topic open if it were not discussed but has no open AI', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        await E2ETopics.toggleTopic(1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabTopics();

        expect(await E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
    });

    it('remains the topic open if it were discussed but has open AI', function () {
        await E2ETopics.addTopicToMinutes('some topic');
        await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        await E2ETopics.toggleActionItem(1, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.gotoParentMeetingSeries();

        await E2EMeetingSeries.gotoTabTopics();

        expect(await E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
    });

	it('Closed Topics have a Re-open Button, open ones not', function () {
		await E2ETopics.addTopicToMinutes('some open topic');
		await E2ETopics.addTopicToMinutes('some closed topic');
		await E2ETopics.toggleTopic(1);
		
		await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.gotoParentMeetingSeries();
		await E2EMeetingSeries.gotoTabTopics();
		
		expect(await E2ETopics.isTopicClosed(2), "Topic should be open").to.be.false;
		expect(await E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
		
		expect(await E2ETopics.hasDropDownMenuButton(2, '#btnReopenTopic')).to.be.false;
		expect(await E2ETopics.hasDropDownMenuButton(1, '#btnReopenTopic')).to.be.true;
	});
	
	it('Only Moderator can Re-Open a closed Topic', function () {
		await E2ETopics.addTopicToMinutes('some closed topic');
		await E2ETopics.toggleTopic(1);
		await E2EMinutes.finalizeCurrentMinutes();
		
		await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
		await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
		
        await E2EApp.loginUser(1);
		await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
		await E2EMeetingSeries.gotoTabTopics();
		
		expect(await E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
		expect(await E2ETopics.hasDropDownMenuButton(1, '#btnReopenTopic')).to.be.false;
        await E2EApp.loginUser();		
	});

	it('Reopen a Topic if there is no currently unfinalized Minute', function () {
		await E2ETopics.addTopicToMinutes('some closed topic');
		await E2ETopics.toggleTopic(1);
		await E2EMinutes.finalizeCurrentMinutes();
		
		await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
		await E2EMinutes.finalizeCurrentMinutes();
		
		await E2EMinutes.gotoParentMeetingSeries();
		await E2EMeetingSeries.gotoTabTopics();
		expect(await E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
		
		//try to reopen the topic
		await E2ETopics.reOpenTopic(1);
		expect(await E2ETopics.isTopicClosed(1), "Topic should be reopened").to.be.false;
		
		// currently finalized minute should not get the reopened Topic
		await E2EMeetingSeries.gotoTabMinutes();
		await E2EMinutes.gotoLatestMinutes();
		await expect(await E2ETopics.countTopicsForMinute()).to.equal(0);
		
		//a minute which is opened after reopening the topic should contain the topic
		await E2EMinutes.gotoParentMeetingSeries();
		await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
		await E2EMinutes.gotoLatestMinutes();
		await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
	});

	it('Reopen a Topic if there is a currently unfinalized Minute', function () {
		await E2ETopics.addTopicToMinutes('some closed topic');
		await E2ETopics.toggleTopic(1);
		await E2EMinutes.finalizeCurrentMinutes();
		
		await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
		await expect(await E2ETopics.countTopicsForMinute()).to.equal(0);
		
		await E2EMinutes.gotoParentMeetingSeries();
		await E2EMeetingSeries.gotoTabTopics();
		await E2ETopics.reOpenTopic(1);		
		
		// the topic should have been copied to the latest minute
		await E2EMeetingSeries.gotoTabMinutes();
		await E2EMinutes.gotoLatestMinutes();
		await E2EGlobal.waitSomeTime();
		await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
	});	
	
    describe('merge topics', function () {

        beforeEach('Create and finalize a first minute', function() {
            await E2ETopics.addTopicToMinutes('some topic');
            await E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
            await E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();
        });

        it('clears the topic list if the first minute will be un-finalized.', function() {
            await E2EMinutes.gotoLatestMinutes();

            await E2EMinutes.unfinalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            await expect(await E2ETopics.countTopicsForMinute()).to.equal(0);
        });

        it("adds new topics and AIs/IIs to the topic list of the meeting series", function () {
            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            // add new items (AI and II) to existing topic
            await E2ETopics.addInfoItemToTopic({subject: 'some other information'}, 1);
            await E2ETopics.addInfoItemToTopic({subject: 'some other action item', itemType: "actionItem"}, 1);

            // add a new topic
            await E2ETopics.addTopicToMinutes('some other topic');
            await E2ETopics.addInfoItemToTopic({subject: 'with information'}, 1);
            await E2ETopics.addInfoItemToTopic({subject: 'with an action item', itemType: "actionItem"}, 1);


            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            await expect(await E2ETopics.countTopicsForMinute(), "Meeting Series should have now two topics").to.equal(2);

            // check the first topic (this should be the new one)
            await expect(await E2ETopics.countItemsForTopic(1), "New Topic should have two items").to.equal(2);
            let itemsOfNewTopic = await E2ETopics.getItemsForTopic(1);
            let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
            await expect((await browser.elementIdText(firstItemOfNewTopic)).value, "first item of new topic should be the action item")
                .to.have.string('with an action item');
            let sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
            await expect((await browser.elementIdText(sndItemOfNewTopic)).value, "2nd item of new topic should be the info item")
                .to.have.string('with information');

            // check the 2nd topic (the merged one)
            await expect(await E2ETopics.countItemsForTopic(2), "Merged Topic should now have four items").to.equal(4);
        });

        it('closes an existing open AI but remains the topic open if it were not discussed', function () {
            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.toggleActionItem(1, 1);

            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            await expect(await E2ETopics.countTopicsForMinute(), "Meeting Series should still have only one topic").to.equal(1);

            expect(await E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
            expect(await E2ETopics.isActionItemClosed(1, 1), "AI should be closed").to.be.true;

        });

        it('closes an existing open AI and closes the topic if it were discussed', function () {
            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.toggleActionItem(1, 1);
            await E2ETopics.toggleTopic(1);

            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            await expect(await E2ETopics.countTopicsForMinute(), "Meeting Series should still have only one topic").to.equal(1);

            expect(await E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
            expect(await E2ETopics.isActionItemClosed(1, 1), "AI should be closed").to.be.true;
        });

        it('changes the properties (subject/responsible) of an existing Topic', function () {
            const newTopicSubject = "changed topic subject";
            const newResponsible = "user1";

            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.editTopicForMinutes(1, newTopicSubject, newResponsible);

            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            let topicItems = await E2ETopics.getTopicsForMinute();
            let topicEl = topicItems[0].ELEMENT;
            await expect((await browser.elementIdText(topicEl)).value, "the topic subject should have changed").to.have.string(newTopicSubject);
            await expect((await browser.elementIdText(topicEl)).value, "the topic responsible should have changed").to.have.string(newResponsible);
        });

        it('reverts property changes (subject/responsible) of a Topic if the minute will be un-finalized', function () {
            const newTopicSubject = "changed topic subject";
            const newResponsible = "user1";

            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.editTopicForMinutes(1, newTopicSubject, newResponsible);

            await E2EMinutes.finalizeCurrentMinutes();
            await E2EMinutes.unfinalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            let topicItems = await E2ETopics.getTopicsForMinute();
            let topicEl = topicItems[0].ELEMENT;
            await expect((await browser.elementIdText(topicEl)).value, "the topic subject should have changed").to.not.have.string(newTopicSubject);
            await expect((await browser.elementIdText(topicEl)).value, "the topic responsible should have changed").to.not.have.string(newResponsible);
        });

        it('changes the properties (subject/responsible) of an existing AI', function () {
            const newSubject = "changed action item subject";
            const newResponsible = "user1";

            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.editInfoItemForTopic(1, 1, { subject: newSubject, responsible: newResponsible });

            await E2EMinutes.finalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            let items = await E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            await expect((await browser.elementIdText(firstItemElement)).value, "the action item subject should have changed").to.have.string(newSubject);
            await expect((await browser.elementIdText(firstItemElement)).value, "the action item responsible should have changed").to.have.string(newResponsible);
        });

        it('reverts property changes (subject/responsible) of an AI if the minute will be un-finalized', function () {
            const newSubject = "changed action item subject";
            const newResponsible = "user1";

            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.editInfoItemForTopic(1, 1, { subject: newSubject, responsible: newResponsible });

            await E2EMinutes.finalizeCurrentMinutes();
            await E2EMinutes.unfinalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            let items = await E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            await expect((await browser.elementIdText(firstItemElement)).value, "the action item subject should have changed").to.not.have.string(newSubject);
            await expect((await browser.elementIdText(firstItemElement)).value, "the action item responsible should have changed").to.not.have.string("Resp: " + newResponsible);
        });

        it('removes the is-New-Flag of an existing topic after finalizing the 2nd minute', function () {
            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
            await E2EMinutes.finalizeCurrentMinutes();
            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            let items = await E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            await expect((await browser.elementIdText(firstItemElement)).value).to.not.have.string("New");
        });

        it('restores the is-New-Flag of an existing topic after un-finalizing the 2nd minute', function () {
            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
            await E2EMinutes.finalizeCurrentMinutes();
            await E2EMinutes.unfinalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            let items = await E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            await expect((await browser.elementIdText(firstItemElement)).value).to.have.string("New");
        });

        it('removes the topic from the meeting series topics list if it was created int the un-finalized minutes', function() {
            // add a second minute
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            // add a new topic
            await E2ETopics.addTopicToMinutes('some other topic');
            await E2ETopics.addInfoItemToTopic({subject: 'with information'}, 1);
            await E2ETopics.addInfoItemToTopic({subject: 'with an action item', itemType: "actionItem"}, 1);

            await E2EMinutes.finalizeCurrentMinutes();
            await E2EMinutes.unfinalizeCurrentMinutes();

            await E2EMinutes.gotoParentMeetingSeries();

            await E2EMeetingSeries.gotoTabTopics();

            await expect(await E2ETopics.countTopicsForMinute()).to.equal(1);
        });

    });

});