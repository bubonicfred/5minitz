import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';
import { E2EMails } from './helpers/E2EMails'

describe('Topics Skip', function () {
    const aProjectName = "E2E Topics Skip";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    
    const nonSkippedTopicName = 'Non-skipped Topic #1';
    const skippedTopicName = 'Skipped Topic #2';

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in. Also create two topics", function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        
        await E2ETopics.addTopicToMinutes(skippedTopicName);
        await E2ETopics.addTopicToMinutes(nonSkippedTopicName);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);
        
        expect(await E2ETopics.isTopicSkipped(1)).to.be.false;
        expect(await E2ETopics.isTopicSkipped(2)).to.be.false;
    });
    
    it('Can skip and unskip topic', function () {
        let skipAndUnskipTopicViaUI = async useDropdownMenu => {
            await E2ETopics.toggleSkipTopic(2, true); //skip
            expect(await E2ETopics.isTopicSkipped(1)).to.be.false;
            expect(await E2ETopics.isTopicSkipped(2)).to.be.true;
            await E2ETopics.toggleSkipTopic(2, useDropdownMenu); //unskip
            expect(await E2ETopics.isTopicSkipped(1)).to.be.false;
            expect(await E2ETopics.isTopicSkipped(2)).to.be.false;
        };
        
        //Check skip & unskip via dropdown menu
        await skipAndUnskipTopicViaUI(true);
        //Check unskip by directly pressing the skip icon
        await skipAndUnskipTopicViaUI(false);
    });
    
    it('Skipping closed topics will open them and they cannot be closed again', function () {
        await E2ETopics.toggleTopic(2);
        expect(await E2ETopics.isTopicClosed(2)).to.be.true;
        
        await E2ETopics.toggleSkipTopic(2);
        expect(await E2ETopics.isTopicSkipped(2)).to.be.true;
        expect(await E2ETopics.isTopicClosed(2)).to.be.false; // topic has been opened again
        
        await E2ETopics.toggleTopic(2);
        expect(await E2ETopics.isTopicClosed(2)).to.be.false; // topic has not been opened again, since the checkbox is not editable
    });
    
    it('Skipped topics will not be included in agenda mails', function () { 
        await E2EMails.resetSentMailsDb();
        
        await E2ETopics.toggleSkipTopic(2, true);
        await browser.waitForVisible('#btn_sendAgenda');
        await E2EGlobal.clickWithRetry('#btn_sendAgenda');

        await E2EGlobal.waitSomeTime();

        let sentMails = await E2EMails.getAllSentMails();
        expect(sentMails, 'one mail should be sent').to.have.length(1);
        
        let sentMail = sentMails[0];     
        await expect(sentMail.html, 'the email should contain the subject of the topic').to.have.string(nonSkippedTopicName);
        await expect(sentMail.html, 'the email should not contain the subject of the skipped topic').to.not.have.string(skippedTopicName);
    });
    
    it('Skipped topics will not be included in info item mails', function () { 
        const skippedInfoItemTitle = "This is an Infoitem within a skipped Topic";
        const nonSkippedInfoItemTitle = "This is an Infoitem within a non-skipped Topic"
        
        await E2EMails.resetSentMailsDb();
        await E2ETopics.toggleSkipTopic(2, true);      
        await E2ETopics.addInfoItemToTopic({
            subject: nonSkippedInfoItemTitle,
            itemType: "infoItem"
        }, 1);      
        await E2ETopics.addInfoItemToTopic({
                subject: skippedInfoItemTitle,
                itemType: "infoItem"
        }, 2);
            
        await E2EMinutes.finalizeCurrentMinutes(true);
        await E2EGlobal.waitSomeTime();

        let sentMails = await E2EMails.getAllSentMails();
        expect(sentMails, 'one mail should be sent').to.have.length(1);    
        let sentMail = sentMails[0];        
        await expect(sentMail.html, "the email should contain the title of the non-skipped Topic's InfoItem").to.have.string(nonSkippedInfoItemTitle);
        await expect(sentMail.html, "the email should not contain the title of the skipped Topic's InfoItem").to.not.have.string(skippedInfoItemTitle);
    });
    
    it('Skipped topics will not be included in action item mails', function () { 
        const skippedActionItemTitle = "This is an ActionItem within a skipped Topic";
        const nonSkippedActionItemTitle = "This is an ActionItem within a non-skipped Topic"

        await E2EMails.resetSentMailsDb();        
        await E2ETopics.toggleSkipTopic(2, true); 
        await E2ETopics.addInfoItemToTopic({
            subject: nonSkippedActionItemTitle,
            itemType: "actionItem",
            responsible: await E2EApp.getCurrentUser()
        }, 1);      
        await E2ETopics.addInfoItemToTopic({
                subject: skippedActionItemTitle,
                itemType: "actionItem",
                responsible: await E2EApp.getCurrentUser()
        }, 2);
        
        await E2EMinutes.finalizeCurrentMinutes(true);
        await E2EGlobal.waitSomeTime();

        let sentMails = await E2EMails.getAllSentMails();
        expect(sentMails, 'two mail should be sent. One for the ActionItems, the other for the InfoItems').to.have.length(2);  
        let sentMail = sentMails[0]; //ActionItem Mail will be sent first
        await expect(sentMail.html, "the email should contain the title of the non-skipped Topic's ActionItem").to.have.string(nonSkippedActionItemTitle);
        await expect(sentMail.html, "the email should not contain the title of the skipped Topic's ActionItem").to.not.have.string(skippedActionItemTitle);   
    });
    
    it('Skipped topics can only be seen by the moderator', function () {
        await E2ETopics.toggleSkipTopic(2, true);
        //Moderator can see Topic
        let selector = "#topicPanel .well:nth-child(2) #btnTopicDropdownMenu";
        expect(await browser.isVisible(selector)).to.be.true;
        
        //Add another participant
        await E2EMinutes.gotoParentMeetingSeries();
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        await E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save  
        //check if new non-moderator-participant can see skipped topic
        await E2EApp.loginUser(1);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await E2EGlobal.waitSomeTime();
        await E2EMinutes.gotoLatestMinutes();
        expect(await browser.isVisible(selector)).to.be.false;

        await E2EApp.loginUser();

    });
    
    it('Hide closed Topics button will also hide skipped topics', function () {
        await E2ETopics.toggleSkipTopic(2, true);
        let selector = "#topicPanel .well:nth-child(2) #btnTopicDropdownMenu";
        expect(await browser.isVisible(selector)).to.be.true;
        await E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");
        await E2EGlobal.waitSomeTime();
        expect(await browser.isVisible(selector)).to.be.false;
        await E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");
    });
    
    it('Skipped topics will appear unskipped in the next minute', function () { 
        await E2ETopics.toggleSkipTopic(2, true);
        expect(await E2ETopics.isTopicSkipped(2)).to.be.true;
        await E2EMinutes.finalizeCurrentMinutes(true);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.gotoLatestMinutes();
        expect(await E2ETopics.isTopicSkipped(2)).to.be.false;
    });
});