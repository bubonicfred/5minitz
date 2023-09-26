import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

describe('Minutes Finalize', function () {

    const aProjectName = 'E2E Minutes Finalize';
    let aMeetingCounter = 0;
    let aMeetingNameBase = 'Meeting Name #';
    let aMeetingName;

    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp('Start test suite');
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;
    });


    it('can finalize minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
        await E2EMinutes.finalizeCurrentMinutes();

        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.true;
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });

    // this test does only make sense if mail delivery is enabled
    if (E2EGlobal.SETTINGS.email && E2EGlobal.SETTINGS.email.enableMailDelivery) {
        it('asks if emails should be sent before finalizing the minute', function () {
            aMeetingCounter++;
            aMeetingName = aMeetingNameBase + aMeetingCounter;

            await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
            await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            await E2ETopics.addTopicToMinutes('some topic');
            await E2ETopics.addInfoItemToTopic({
                subject: 'action item',
                itemType: 'actionItem'
            }, 1);
            await E2ETopics.addInfoItemToTopic({
                subject: 'info item',
                itemType: 'infoItem'
            }, 1);

            await E2EMinutes.finalizeCurrentMinutes(/*autoConfirmDialog*/false);

            expect(await browser.isExisting('#cbSendAI')).to.be.true;
            expect(await browser.isExisting('#cbSendII')).to.be.true;

            // close dialog otherwise beforeEach-hook will fail!
            await E2EApp.confirmationDialogAnswer(false);
            await E2EGlobal.waitSomeTime(300);   // make next test happy
        });
    }


    it('can not add minutes if unfinalized minutes exist', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        // No finalize here!
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await browser.waitForVisible('#btnAddMinutes');

        // check that nothing happens if the add minutes button will be pressed
        const urlBefore = await browser.getUrl();
        expect(await browser.isExisting('#btnAddMinutes'), 'btnAddMinutes should be there').to.be.true;
        try {
            await E2EGlobal.clickWithRetry('#btnAddMinutes');
        } catch (e) {
            // Intentionally left empty
            // We expect the above click to fail, as button is disabled
        }
        await E2EGlobal.waitSomeTime(750);
        await expect(await browser.getUrl(), 'Route should not have changed').to.equal(urlBefore);
        await expect(
            await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
            'Only one minute should have been added'
        ).to.equal(countInitialMinutes + 1);
    });


    it('can finalize minutes at later timepoint', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        // No finalize here!
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await browser.waitForVisible('#btnAddMinutes');
        await E2EGlobal.clickWithRetry('a#id_linkToMinutes');        // goto first available minutes
        // Now finalize!
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        // check if button is clicked, it does add 2nd minutes
        await E2EGlobal.clickWithRetry('#btnAddMinutes');
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +2);
    });


    it('can not delete or finalize already finalized minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = '2015-03-17';  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.gotoMinutes(myDate);

        expect(await browser.isExisting('#btn_finalizeMinutes')).to.be.false;
        expect(await browser.isExisting('#btn_deleteMinutes')).to.be.false;
    });


    it('can unfinalize minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = '2015-03-17';  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.unfinalizeCurrentMinutes();
        expect(await browser.isExisting('#btn_finalizeMinutes')).to.be.true;
        expect(await browser.isExisting('#btn_deleteMinutes')).to.be.true;
    });

    it('removes all fresh info items when unfinalizing the second minutes', function() {
        await this.timeout(150000);
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        console.log('Meeting: ', aProjectName, aMeetingName);
        let myDate = '2015-05-14';

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        await E2ETopics.addTopicToMinutes('Topic');
        await E2ETopics.addInfoItemToTopic({
            subject: 'Old Info Item',
            itemType: 'infoItem'
        }, 1);

        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        await E2ETopics.addInfoItemToTopic({
            subject: 'New Info Item',
            itemType: 'infoItem'
        }, 1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeries.gotoTabTopics();

        await expect(await E2ETopics.countItemsForTopic(1), 'Topic should have two items').to.equal(2);

        await E2EMeetingSeries.gotoTabMinutes();
        await E2EMinutes.gotoLatestMinutes();

        await E2EMinutes.unfinalizeCurrentMinutes();

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeries.gotoTabTopics();

        await expect(await E2ETopics.countItemsForTopic(1), 'Topic should have one items').to.equal(1);
    });


    it('does show name of user that did finalize', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = '2015-03-17';  // date of first project commit ;-)
        let currentUsername = E2EGlobal.SETTINGS.e2eTestUsers[0];

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EGlobal.waitSomeTime();
        let finalizedText = await browser.getText('#txt_FinalizedBy');
        await expect(finalizedText).to.contain(currentUsername);

        // Now leave and re-enter minutes to trigger fresh render
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.gotoMinutes(myDate);
        finalizedText = await browser.getText('#txt_FinalizedBy');
        await expect(finalizedText).to.contain(currentUsername);
    });


    it('prohibits editing date of finalized minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = '2015-03-17';  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        await E2EMinutes.finalizeCurrentMinutes();

        let dateOfMinutes = await browser.getValue('#id_minutesdateInput');
        await expect(dateOfMinutes).to.equal(myDate);
        // try to change read-only field... we expect an exception in the next statement...  ;-)
        try {await browser.setValue('#id_minutesdateInput', '2015-05-22');} catch (e) {}
        dateOfMinutes = await browser.getValue('#id_minutesdateInput');
        await expect(dateOfMinutes).to.equal(myDate); // still same as above?
    });


    it('prohibits unfinalizing of non-latest minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate1 = '2015-03-17';  // date of first project commit ;-)
        let myDate2 = '2015-03-18';

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate2); // myDate2 is kept UNFINALIZED!

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.gotoMinutes(myDate1);
        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);  // now FINALIZE myDate2
        await E2EMinutes.gotoMinutes(myDate2);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.gotoMinutes(myDate1);
        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
    });


    it('prohibits minutes on dates before the latest minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate1 = '2015-03-17';  // date of first project commit ;-)
        let myDate2 = '2010-01-01';

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate2);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        expect(await E2EMinutes.getMinutesId(myDate2)).not.to.be.ok;
        let currentDateISO = await E2EGlobal.formatDateISO8601(new Date());
        expect(await E2EMinutes.getMinutesId(currentDateISO)).to.be.ok;
    });


    it('prohibits two minutes on the same date', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate1 = '2015-03-17';  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(2);
        let currentDateISO = await E2EGlobal.formatDateISO8601(new Date());
        expect(await E2EMinutes.getMinutesId(currentDateISO)).to.be.ok;
    });


    it('cancel finalize Minutes, when warning-box appears', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
        await E2EMinutes.finalizeCurrentMinutesWithoutParticipants(true, false);

        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });

    it('process finalize Minutes, when warning-box appears', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
        await E2EMinutes.finalizeCurrentMinutesWithoutParticipants(true, true);

        expect(await browser.isExisting('#btn_unfinalizeMinutes')).to.be.true;
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });

    it('update detail on pinned and not discussed item in next minute after finalizing item origin minute', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        let aTopicName = 'Topic';
        let infoItemName = 'Info Item';
        await E2ETopics.addTopicToMinutes(aTopicName);
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: 'infoItem'
        }, 1);

        let details = 'Details';
        await E2ETopics.addDetailsToActionItem(1, 1, details);

        await E2ETopics.toggleInfoItemStickyState(1,1);
        await E2EMinutes.finalizeCurrentMinutesWithoutParticipants(true, true);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        let detailsNew = 'Updated Details';
        await E2ETopics.editDetailsForActionItem(1, 1, 1, detailsNew);

        let itemsOfTopic = await E2ETopics.getItemsForTopic(1);
        let item = itemsOfTopic[0].ELEMENT;
        await expect((await browser.elementIdText(item)).value).to.have.string(detailsNew);
    });

});
