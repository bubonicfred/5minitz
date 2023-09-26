import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2EProtocols } from './helpers/E2EProtocols';

describe('Protocols', function () {
    const _projectName = 'E2E Protocols';
    const _meetingNameBase = 'Meeting Name #';
    let _meetingCounter = 0;
    let _lastMinutesID;
    let _lastMeetingName;
    let getNewMeetingName = async () => {
        _meetingCounter++;
        return _meetingNameBase + _meetingCounter;
    };

    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });


    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        _lastMeetingName = await getNewMeetingName();
        await E2EMeetingSeries.createMeetingSeries(_projectName, _lastMeetingName);
        _lastMinutesID = await E2EMinutes.addMinutesToMeetingSeries(_projectName, _lastMeetingName);
    });

    // ******************
    // * DOCUMENT GENERATION TESTS
    // ******************

    it('No Protocol is created on finalizing Minutes if feature is disabled', function () {
        await E2EProtocols.setSettingsForProtocolGeneration(); //Disable document generation

        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();
        await E2EMinutes.finalizeCurrentMinutes();

        expect(await browser.isExisting('#btn_unfinalizeMinutes'),'Minute has been finalized').to.be.true;

        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'No Protocol has been created').to.equal(numberOfProtocolsBefore);
    });

    it('HTML Protocol is created on finalizing Minutes', function () {
        await E2EProtocols.setSettingsForProtocolGeneration('html');

        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();
        await E2EMinutes.finalizeCurrentMinutes();

        expect(await browser.isExisting('#btn_unfinalizeMinutes'),'Minute has been finalized').to.be.true;
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'Protocol has been saved in database').to.equal(numberOfProtocolsBefore + 1);
        expect(await E2EProtocols.checkProtocolFileForMinuteExits(_lastMinutesID), 'Protocol has been saved on file system').to.be.true;
    });

    it('HTML Protocol is deleted on unfinalizing Minutes', function () {
        await E2EProtocols.setSettingsForProtocolGeneration('html');

        await E2EMinutes.finalizeCurrentMinutes();
        expect(await browser.isExisting('#btn_unfinalizeMinutes'),'Minute has been finalized').to.be.true;

        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();
        expect(numberOfProtocolsBefore > 0, 'A Protocol has been saved in database').to.be.true;
        expect(await E2EProtocols.checkProtocolFileForMinuteExits(_lastMinutesID), 'A Protocol has been saved on file system').to.be.true;

        await E2EMinutes.unfinalizeCurrentMinutes();

        await E2EGlobal.waitSomeTime(5000);

        expect(await browser.isExisting('#btn_unfinalizeMinutes'),'Minute has been unfinalized').to.be.false;
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'The Protocol has been deleted in database').to.equal(numberOfProtocolsBefore - 1);
        expect(await E2EProtocols.checkProtocolFileForMinuteExits(_lastMinutesID), 'The Protocol has been deleted on file system').to.be.false;
    });

    // ******************
    // * DOWNLOAD TESTS
    // ******************

    it('Download Button is visible on finalized Minutes', function () {
        await E2EProtocols.setSettingsForProtocolGeneration('html');

        expect(await E2EProtocols.downloadButtonExists(), 'Download button is not visible in unfinalized Mintues').to.be.false;
        await E2EMinutes.finalizeCurrentMinutes();
        expect(await E2EProtocols.downloadButtonExists(), 'Download button is visible in finalized Mintues').to.be.true;
    });

    xit('Trying to download a non-existent protocol shows a confirmation dialog to download on-the-fly version', function () {
        await E2EProtocols.setSettingsForProtocolGeneration(); //Deactivate protocol generation

        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();
        await E2EMinutes.finalizeCurrentMinutes();
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'No protocol has been created').to.equal(numberOfProtocolsBefore);

        await E2EProtocols.setSettingsForProtocolGeneration('html'); //Reactivate protocol generation, otherwise there won't be a download-button
        await E2EApp.logoutUser(); //Re-Login to allow app to get changes of settings
        await E2EApp.loginUser();
        await E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
        await E2EMinutes.gotoLatestMinutes(); 

        expect(await E2EProtocols.checkDownloadOpensConfirmationDialog(), 'Confirmation Dialog is opened').to.be.true;
    });

    it('Trying to download an existant protocol shows no confirmation dialog', function () {
        console.log("checkpoint-1");
        await E2EProtocols.setSettingsForProtocolGeneration('html');
        console.log("checkpoint-2");
        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();
        console.log("checkpoint-3");

        await E2EMinutes.finalizeCurrentMinutes();
        console.log("checkpoint-4");
        await browser.scroll('.navbar-header'); //without this the "Minutes finalized" toast would be right above the download button
        console.log("checkpoint-5");
        await E2EGlobal.waitSomeTime(750);
        console.log("checkpoint-6");
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'Protocol has been saved in database').to.equal(numberOfProtocolsBefore + 1);
        console.log("checkpoint-7");
        expect(await E2EProtocols.checkDownloadOpensConfirmationDialog(), 'No Confirmation Dialog is opened').to.be.false;
        console.log("checkpoint-8");
    });

    it('Trying to download an protocol with an direct link should work with proper permissions', function () {
        await E2EProtocols.setSettingsForProtocolGeneration('html');
        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EGlobal.waitSomeTime(750);
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'Protocol has been saved in database').to.equal(numberOfProtocolsBefore + 1);

        await browser.execute((link) => {
            window.location = link;
        }, E2EProtocols.getDownloadLinkForProtocolOfMinute(_lastMinutesID) + '?download=true');

        await E2EGlobal.waitSomeTime(750);
        
        await expect(await browser.getText('body')).to.not.have.string('File Not Found');
    });

    it('Trying to download an protocol with an direct link should not work when logged out', function () {
        await E2EProtocols.setSettingsForProtocolGeneration('html');
        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EGlobal.waitSomeTime(750);
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'Protocol has been saved in database').to.equal(numberOfProtocolsBefore + 1);

        await E2EApp.logoutUser();
        await browser.execute((link) => {
            window.location = link;
        }, E2EProtocols.getDownloadLinkForProtocolOfMinute(_lastMinutesID) + '?download=true');

        await E2EGlobal.waitSomeTime(750);
        
        await expect(await browser.getText('body')).to.have.string('File Not Found');
    });

    it('Trying to download an protocol with an direct link should not work when loggin in but no permissions', function () {
        await E2EProtocols.setSettingsForProtocolGeneration('html');
        let numberOfProtocolsBefore = await E2EProtocols.countProtocolsInMongoDB();

        await E2EMinutes.finalizeCurrentMinutes();
        await E2EGlobal.waitSomeTime(750);
        await expect(await E2EProtocols.countProtocolsInMongoDB(), 'Protocol has been saved in database').to.equal(numberOfProtocolsBefore + 1);

        await E2EApp.logoutUser();
        await E2EApp.loginUser(1);
        await browser.execute((link) => {
            window.location = link;
        }, E2EProtocols.getDownloadLinkForProtocolOfMinute(_lastMinutesID) + '?download=true');

        await E2EGlobal.waitSomeTime(750);
        
        await expect(await browser.getText('body')).to.have.string('File Not Found');
    }); 
});
