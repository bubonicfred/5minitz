const path = require('path');
const fs = require('fs-extra');
const md5File = require('md5-file');

import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EAttachments } from './helpers/E2EAttachments'

describe('Attachments', function () {
    const _projectName = "E2E Attachments";
    const _meetingNameBase = "Meeting Name #";
    let _meetingCounter = 0;
    let _lastMeetingSeriesID;
    let _lastMinutesID;
    let _lastMeetingName;
    let _localPublicDir;
    let _staticLocalFilename = "";

    let getNewMeetingName = async () => {
        _meetingCounter++;
        return _meetingNameBase + _meetingCounter;
    };

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();

        _localPublicDir = await server.call('e2e.getServerCurrentWorkingDir');  // call meteor server method
        _localPublicDir += "/../web.browser/app/"; // location of files from "/public" directory
        _staticLocalFilename = _localPublicDir + "favicon.ico";
    });


    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        _lastMeetingName = await getNewMeetingName();
        _lastMeetingSeriesID = await E2EMeetingSeries.createMeetingSeries(_projectName, _lastMeetingName);
        _lastMinutesID = await E2EMinutes.addMinutesToMeetingSeries(_projectName, _lastMeetingName);
    });

    // ******************
    // * MODERATOR TESTS
    // ******************
    it('can upload an attachment to the server (as moderator)', function () {
        await expect(await E2EAttachments.countAttachmentsGlobally(),
            "Number of attachments before upload").to.equal(0);

        await E2EAttachments.uploadFile(_staticLocalFilename);

        // check we have one attachment now in database
        await expect(await E2EAttachments.countAttachmentsGlobally(),
            "Number of attachments after upload").to.equal(1);

        // check if the server file exists after upload
        let attachment = (await E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID))[0];
        let serverAttachmentDir = await server.call('e2e.getServerAttachmentsDir');
        let serverAttachmentFilename = serverAttachmentDir +
                                "/" + _lastMeetingSeriesID +
                                "/" + attachment._id +
                                "." + attachment.extension;
        expect(fs.existsSync(serverAttachmentFilename),
                "Attachment file should exist on server: "+serverAttachmentFilename)
                .to.be.ok;

        // check if local and server files have same MD5 checksum
        const md5local = await md5File.sync(_staticLocalFilename);
        const md5server = await md5File.sync(serverAttachmentFilename);
        await expect(md5local,
            "Local file should have same MD5 checksum as server file")
            .to.equal(md5server);
    });

    it('can not upload illegal files (as moderator)', function () {
        // wrong extension
        let fileWithDeniedExtension = _localPublicDir + "loading-gears.gif";
        await E2EAttachments.uploadFile(fileWithDeniedExtension);
        await E2EApp.confirmationDialogCheckMessage("Error: Denied file extension: \"gif\".");
        await E2EApp.confirmationDialogAnswer(true);

        // to big file size
        let fileWithTooBigSize = _localPublicDir + "mstile-310x310.png";
        await E2EAttachments.uploadFile(fileWithTooBigSize);
        await E2EApp.confirmationDialogCheckMessage("Error: Please upload file with max.");
        await E2EApp.confirmationDialogAnswer(true);
    });

    it('can remove an attachment (as moderator)', function () {
        let removeBtns = await E2EAttachments.getRemoveButtons();
        await expect(removeBtns.length, "Initially zero remove attachment buttons").to.equal(0);

        await E2EAttachments.uploadFile(_staticLocalFilename);

        let attachmentCountInMin = (await E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID)).length;
        await expect(attachmentCountInMin, "One attachment after upload").to.equal(1);
        removeBtns = await E2EAttachments.getRemoveButtons();
        await expect(removeBtns.length, "One remove attachment buttons after upload").to.equal(1);
        // REMOVE ATTACHMENT!
        await removeBtns[0].click();
        // check for security question pop up
        await E2EApp.confirmationDialogCheckMessage("Do you really want to delete the attachment");
        await E2EApp.confirmationDialogAnswer(true);
        // check attachment is really removed - from UI and in MongoDB
        attachmentCountInMin = (await E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID)).length;
        await expect(attachmentCountInMin, "Zero attachments after remove").to.equal(0);
        removeBtns = await E2EAttachments.getRemoveButtons();
        await expect(removeBtns.length, "Zero remove attachment buttons after remove").to.equal(0);
    });

    it('has correct UI on finalized minutes with attachments (as moderator)', function () {
        await E2EAttachments.uploadFile(_staticLocalFilename);
        expect(await E2EAttachments.isUploadButtonVisible(), "Upload button visible after upload")
            .to.be.true;
        let removeBtns = await E2EAttachments.getRemoveButtons();
        await expect(removeBtns.length, "One remove attachment button after upload")
            .to.equal(1);
        let downloadlinks = await E2EAttachments.getDownloadLinks();
        await expect(downloadlinks.length, "One download link after upload")
            .to.equal(1);

        await E2EMinutes.finalizeCurrentMinutes();
        expect(await E2EAttachments.isUploadButtonVisible(), "No Upload button visible after finalize")
            .to.be.false;
        removeBtns = await E2EAttachments.getRemoveButtons();
        await expect(removeBtns.length, "One remove attachment buttons after finalize")
            .to.equal(0);
        downloadlinks = await E2EAttachments.getDownloadLinks();
        await expect(downloadlinks.length, "Still one download link after finalize")
            .to.equal(1);
    });


    // ******************
    // * UPLOADER TESTS
    // ******************
    it('can upload an attachment to the server (as uploader)', function () {
        await E2EAttachments.switchToUserWithDifferentRole(E2EGlobal.USERROLES.Uploader, _projectName, _lastMeetingName);
        let countAttachmentsBeforeUpload = await E2EAttachments.countAttachmentsGlobally();

        await E2EAttachments.uploadFile(_staticLocalFilename);

        await expect(await E2EAttachments.countAttachmentsGlobally(),
            "Number of attachments after upload").to.equal(countAttachmentsBeforeUpload +1);
        await E2EApp.loginUser(0);
    });

    it('can remove only my own attachment (as uploader)', function () {
        // 1st Upload by Moderator
        await E2EAttachments.uploadFile(_staticLocalFilename);
        let attDocBefore = await E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID);
        await E2EAttachments.switchToUserWithDifferentRole(E2EGlobal.USERROLES.Uploader, _projectName, _lastMeetingName);

        // 2nd upload by "Uploader". We expect two attachments but only one remove button
        await E2EAttachments.uploadFile(_staticLocalFilename);
        let attachmentCountInMin = (await E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID)).length;
        await expect(attachmentCountInMin, "Two attachment after 2nd upload")
            .to.equal(2);
        await expect((await E2EAttachments.getRemoveButtons()).length, "One remove attachment buttons after upload")
            .to.equal(1);

        // REMOVE 2nd UPLOAD by Uploader!
        let removeBtns = await E2EAttachments.getRemoveButtons();
        await removeBtns[0].click();
        await E2EApp.confirmationDialogAnswer(true);
        let attDocAfter = await E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID);
        await expect(attDocBefore, "1st upload is still there after remove").to.deep.equal(attDocAfter);
        await E2EApp.loginUser(0);
    });

    // ******************
    // * INVITED TESTS
    // ******************
    it('can not upload but sees download links (as invited)', function () {
        await E2EAttachments.uploadFile(_staticLocalFilename);
        await E2EAttachments.switchToUserWithDifferentRole(E2EGlobal.USERROLES.Invited, _projectName, _lastMeetingName);

        // no need for "expanding"... it is still expanded from user1...
        expect(await E2EAttachments.isUploadButtonVisible()).to.be.false;
        await expect((await E2EAttachments.getDownloadLinks()).length, "One download link after upload by moderator")
            .to.equal(1);

        await E2EApp.loginUser(0);
    });


    // The following test downloads an attachment by clicking the download link
    // This does not work in PhantomJS - see https://github.com/ariya/phantomjs/issues/10052
    // This only works in Chrome. Chrome is configured via .meteor/chimp_config.js to
    // show no pop up dialog on saving, but instead save directly to a known target directory
    it('can download attachment via URL (as invited) - DESKTOP-CHROME-ONLY', function () {
        if (!(await E2EGlobal.browserIsPhantomJS()) && !(await E2EGlobal.browserIsHeadlessChrome())) {
            await E2EAttachments.uploadFile(_staticLocalFilename);
            await E2EAttachments.switchToUserWithDifferentRole(E2EGlobal.USERROLES.Invited, _projectName, _lastMeetingName);

            let fileShort = path.basename(_staticLocalFilename); // => e.g. "favicon.ico"
            let downloadDir = await E2EAttachments.getChromeDownloadDirectory();
            let downloadTargetFile = path.join(downloadDir, fileShort);
            if (fs.existsSync(downloadTargetFile)) {
                fs.unlinkSync(downloadTargetFile);
            }
            expect(fs.existsSync(downloadTargetFile)).to.be.false;  // No file there!

            let links = await E2EAttachments.getDownloadLinks();
            await links[0].click();                                       // now download via chrome desktop
            await E2EGlobal.waitSomeTime(2000);
            expect(fs.existsSync(downloadTargetFile)).to.be.true;   // File should be there
            // check if local pre-upload and local post-download files have same MD5 checksum
            const md5localPre = await md5File.sync(_staticLocalFilename);
            const md5localPost = await md5File.sync(downloadTargetFile);
            await expect(md5localPre,
                "Local pre-upload file should have same MD5 checksum as local post-download file")
                .to.equal(md5localPost);

            await E2EApp.loginUser(0);
        }
    });


    // ******************
    // * NOT INVITED / NOT LOGGED IN TESTS
    // ******************

    it('has no published attachment if not invited', function () {
        await E2EAttachments.uploadFile(_staticLocalFilename);
        expect((await E2EAttachments.countAttachmentsOnClientForCurrentUser()) > 0, "How many attachments are published to the client for user1")
            .to.be.true;

        await E2EApp.loginUser(2);    // switch to non-invited user
        await expect(await E2EAttachments.countAttachmentsOnClientForCurrentUser(), "How many attachments are published to the client for user3")
            .to.equal(0);
        await E2EApp.loginUser(0);
    });

    it('has no published attachment if not logged in', function () {
        await E2EAttachments.uploadFile(_staticLocalFilename);
        expect((await E2EAttachments.countAttachmentsOnClientForCurrentUser()) > 0, "How many attachments are published to the client for user1")
            .to.be.true;

        await E2EApp.logoutUser();    // log out user
        await expect(await E2EAttachments.countAttachmentsOnClientForCurrentUser(), "How many attachments are published to the client for non-logged in user")
            .to.equal(0);
        await E2EApp.loginUser(0);
    });

    it('can not download attachment via URL if user not invited', function () {
        await E2EAttachments.uploadFile(_staticLocalFilename);
        let links = await E2EAttachments.getDownloadLinks();
        let attachmentURL = await links[0].getAttribute("href");

        await E2EApp.loginUser(2);                    // switch to non-invited user
        await browser.url(attachmentURL);             // try to access download URL
        let htmlSource = await browser.getSource();
        await expect(htmlSource).to.contain("File Not Found :(");
        await E2EApp.launchApp();
        await E2EApp.loginUser(0);
    });

    it('can not download attachment via URL if user not logged in', function () {
        await E2EAttachments.uploadFile(_staticLocalFilename);
        let links = await E2EAttachments.getDownloadLinks();
        let attachmentURL = await links[0].getAttribute("href");

        await E2EApp.logoutUser();                    // log out user
        await browser.url(attachmentURL);             // try to access download URL
        let htmlSource = await browser.getSource();
        await expect(htmlSource).to.contain("File Not Found :(");
        await E2EApp.launchApp();
        await E2EApp.loginUser(0);
    });
});
