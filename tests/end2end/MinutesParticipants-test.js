import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMinutesParticipants } from './helpers/E2EMinutesParticipants'


describe('Minutes Participants', function () {
    const aProjectName = "E2E Minutes Participants";
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


    it('ensures per default only creator of series is participant', function () {
        let participantsInfo = new E2EMinutesParticipants();
        await expect(await participantsInfo.getParticipantsCount()).to.equal(1);
        expect(await participantsInfo.getParticipantInfo(E2EApp.getCurrentUser())).to.be.ok;
    });



    it('can add users to series which will show up on new minutes', function () {
        await E2EMinutes.finalizeCurrentMinutes();    // we don't need these...

        // prepare meeting series
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        // now create some new minutes
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        let participantsInfo = new E2EMinutesParticipants();
        await expect(await participantsInfo.getParticipantsCount()).to.equal(3);
        expect(await participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()), "currentUser").to.be.ok;
        expect(await participantsInfo.getParticipantInfo(user2), user2).to.be.ok;
        expect(await participantsInfo.getParticipantInfo(user3), user3).to.be.ok;
    });


    it('can add users to series which will show up on unfinalized minutes', function () {
        // prepare meeting series
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EMinutes.gotoLatestMinutes();

        await browser.waitForVisible('#btnParticipantsExpand', 3000);

        let participantsInfo = new E2EMinutesParticipants();
        await expect(await participantsInfo.getParticipantsCount()).to.equal(3);
        expect(await participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()), "currentUser").to.be.ok;
        expect(await participantsInfo.getParticipantInfo(user2), user2).to.be.ok;
        expect(await participantsInfo.getParticipantInfo(user3), user3).to.be.ok;
    });


    it('prohibits user changes in series to propagate to all finalized minutes', function () {
        await E2EMinutes.finalizeCurrentMinutes();

        // prepare meeting series
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EMinutes.gotoLatestMinutes();
        // finalized minutes have their participants collapsed, by default.
        await E2EMinutesParticipants.expand();

        let participantsInfo = new E2EMinutesParticipants();
        await expect(await participantsInfo.getParticipantsCount()).to.equal(1);
        expect(await participantsInfo.getParticipantInfo(E2EApp.getCurrentUser())).to.be.ok;
    });


    it('can persist checked participants', function () {
        // prepare meeting series
        let currentUser = await E2EApp.getCurrentUser();
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EMinutes.gotoLatestMinutes();
        let minId = await E2EMinutes.getCurrentMinutesId();

        let participantsInfo = new E2EMinutesParticipants();
        await participantsInfo.setUserPresence(currentUser, true);
        await participantsInfo.setUserPresence(user3, true);

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        let parts = await E2EMinutesParticipants.getPresentParticipantsFromServer(minId);
        await expect(parts).to.contain(currentUser);
        await expect(parts).to.contain(user3);
    });


    it('can persist additional participants', function () {
        let additionalUser = "Max Mustermann";
        await browser.setValue('#edtParticipantsAdditional', additionalUser);
        await E2EMinutes.finalizeCurrentMinutes();

        let minId = await E2EMinutes.getCurrentMinutesId();
        let parts = await E2EMinutesParticipants.getPresentParticipantsFromServer(minId);
        await expect(parts).to.contains(additionalUser);
    });


    it('can show collapsed view', function () {
        await E2EMinutesParticipants.collapse();
        expect (await E2EMinutesParticipants.isCollapsed()).to.be.true;
    });


    it('can re-expand a collapsed view', function () {
        await E2EMinutesParticipants.collapse();
        await E2EMinutesParticipants.expand();
        expect (await E2EMinutesParticipants.isExpanded()).to.be.true;
    });


    it('shows collapsed view for non-moderators', function () {
        // prepare meeting series
        let currentUser = await E2EApp.getCurrentUser();
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EApp.loginUser(1);
        await E2EMinutes.gotoLatestMinutes();

        expect (await E2EMinutesParticipants.isCollapsed()).to.be.true;

        await E2EApp.loginUser();
    });


    it('prohibits non-moderator users to change participants', function () {
        // prepare meeting series
        let currentUser = await E2EApp.getCurrentUser();
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EApp.loginUser(1);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.gotoLatestMinutes();
        await E2EMinutesParticipants.expand();

        let participantsInfoBefore = new E2EMinutesParticipants();
        await participantsInfoBefore.setUserPresence(currentUser, true);
        await participantsInfoBefore.setUserPresence(user2, true);
        let additionalUser = "Max Mustermann";
        try{await browser.setValue('#edtParticipantsAdditional', additionalUser);} catch (e) {}

        let participantsInfoAfter = new E2EMinutesParticipants();
        await expect(participantsInfoAfter).to.deep.equal(participantsInfoBefore);

        await E2EApp.loginUser();
    });


    it('prohibits change of participants on finalized minutes', function () {
        await E2EMinutes.finalizeCurrentMinutes();
        let currentUser = await E2EApp.getCurrentUser();
        let participantsInfoBefore = new E2EMinutesParticipants();
        await participantsInfoBefore.setUserPresence(currentUser, true);
        let additionalUser = "Max Mustermann";
        try{await browser.setValue('#edtParticipantsAdditional', additionalUser);} catch (e) {}

        let participantsInfoAfter = new E2EMinutesParticipants();
        await expect(participantsInfoAfter).to.deep.equal(participantsInfoBefore);
    });


    it('collapses / expands participants on finalize / un-finalize', function () {
        expect (await E2EMinutesParticipants.isExpanded(),"initial state").to.be.true;
        await E2EMinutes.finalizeCurrentMinutes();
        expect (await E2EMinutesParticipants.isCollapsed(), "after finalize").to.be.true;
        await E2EMinutes.unfinalizeCurrentMinutes();
        expect (await E2EMinutesParticipants.isExpanded(), "after unfinalize").to.be.true;
    });


    it('shows participants on minutelist in meeting series details view', function () {
        // prepare meeting series
        let currentUser = await E2EApp.getCurrentUser();
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EMinutes.gotoLatestMinutes();
        let participantsInfo = new E2EMinutesParticipants();
        await participantsInfo.setUserPresence(currentUser, true);
        await participantsInfo.setUserPresence(user3, true);
        let additionalUser = "Max Mustermann";
        await browser.setValue('#edtParticipantsAdditional', additionalUser);
        await E2EMinutes.finalizeCurrentMinutes();

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await browser.getText("tr#id_MinuteRow")).to.contain("user1; user3; Max Mustermann");
    });
    
    it('can edit participants from within a minute as a moderator', function () {
        let participantsInfo = new E2EMinutesParticipants();
        await expect(await participantsInfo.getParticipantsCount()).to.equal(1);
        
        await E2EGlobal.clickWithRetry("#btnEditParticipants");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
        
        participantsInfo = new E2EMinutesParticipants();
        await expect(await participantsInfo.getParticipantsCount()).to.equal(2);
    }); 
});
