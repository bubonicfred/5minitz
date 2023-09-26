import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMails } from './helpers/E2EMails'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'


describe('Send agenda', function () {
    const aProjectName = "E2E Send Agenda";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.launchApp();
        await E2EApp.resetMyApp(true);
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EMails.resetSentMailsDb();

        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    after("clear database", function () {
        if (await E2EGlobal.browserIsPhantomJS()) {
            await E2EApp.resetMyApp(true);
        }
    });

    it('displays a button send agenda on a new created minute', function() {
        expect(await browser.isVisible('#btn_sendAgenda')).to.be.true;
    });

    it('ensures that the send-agenda-button is invisible for non-moderators', function() {
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
        expect(await browser.isVisible('#btn_sendAgenda')).to.be.false;

        await E2EApp.loginUser();
    });

    it('ensures that the send-agenda-button is invisible for finalizes minutes', function() {
        await E2EMinutes.finalizeCurrentMinutes();
        expect(await browser.isVisible('#btn_sendAgenda')).to.be.false;
    });

    it('ensures that a confirmation dialog is shown before sending the agenda a second time', function() {
        await browser.waitForVisible('#btn_sendAgenda');
        await E2EGlobal.clickWithRetry('#btn_sendAgenda');

        await E2EMinutes.confirmQualityAssuranceDialog();

        await E2EGlobal.clickWithRetry('#btn_sendAgenda');

        await E2EMinutes.confirmQualityAssuranceDialog();

        let selectorDialog = "#confirmDialog";

        await E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(await browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        // close dialog otherwise beforeEach-hook will fail!
        await E2EApp.confirmationDialogAnswer(false);
    });

    it('sends one email to the participant containing the topic but not the info items', function() {
        const topicSubject = 'some topic';
        const infoItemSubject = 'amazing information';

        await E2ETopics.addTopicToMinutes(topicSubject);
        await E2ETopics.addInfoItemToTopic({
            subject: infoItemSubject,
            itemType: "infoItem"
        }, 1);

        await browser.waitForVisible('#btn_sendAgenda');
        await E2EGlobal.clickWithRetry('#btn_sendAgenda');
        await E2EMinutes.confirmQualityAssuranceDialog();

        await E2EGlobal.waitSomeTime();

        let sentMails = await E2EMails.getAllSentMails();
        expect(sentMails, 'one mail should be sent').to.have.length(1);
        let sentMail = sentMails[0];
        await expect(sentMail.subject, 'the subject should contain the string Agenda').to.have.string('Agenda');
        await expect(sentMail.html, 'the email should contain the subject of the topic').to.have.string(topicSubject);
        await expect(sentMail.html, 'the email should not contain the info item').to.not.have.string(infoItemSubject);
    });

    it('ensures that the agenda will be sent to all invited', function() {
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EMeetingSeriesEditor.disableEmailForRoleChange();

        let currentUser = await E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await browser.setValue('#edt_AddUser', user2);
        await browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = await browser.selectByValue(selector, "Invited");
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EGlobal.waitSomeTime();

        await E2EMinutes.gotoLatestMinutes();

        await browser.waitForVisible('#btn_sendAgenda');
        await E2EGlobal.clickWithRetry('#btn_sendAgenda');
        await E2EMinutes.confirmQualityAssuranceDialog();

        await E2EGlobal.waitSomeTime();

        let recipients = await E2EMails.getAllRecipients();

        expect(recipients).to.have.length(2);
        await expect(recipients).to.include.members([E2EGlobal.SETTINGS.e2eTestEmails[0], E2EGlobal.SETTINGS.e2eTestEmails[1]]);
    });

    it('ensures that the agenda will be sent to the *normal* participants even if there are additional participants ' +
        'with no valid email addresses', function() {

        let additionalUser = "Max Mustermann";
        await browser.setValue('#edtParticipantsAdditional', additionalUser);

        await browser.waitForVisible('#btn_sendAgenda');
        await E2EGlobal.clickWithRetry('#btn_sendAgenda');
        await E2EMinutes.confirmQualityAssuranceDialog();

        await E2EGlobal.waitSomeTime(3000);

        let sentMails = await E2EMails.getAllSentMails();
        expect(sentMails, 'one mail should be sent').to.have.length(1);
    });

});