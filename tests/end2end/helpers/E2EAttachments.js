const fs = require('fs-extra');
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'

import { E2EMeetingSeries } from './E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './E2EMeetingSeriesEditor'
import { E2EMinutes } from './E2EMinutes'


export class E2EAttachments {
    static async expandAttachmentsArea() {
        await browser.waitForExist("#btn2AttachmentsExpand");
        await E2EGlobal.clickWithRetry("#btn2AttachmentsExpand");
        await E2EGlobal.waitSomeTime();
    }

    static async isUploadButtonVisible() {
        return browser.isVisible("#lblUpload");
    }

    static async uploadFile(filename) {
        expect(fs.existsSync(filename),
            "E2EAttachments.uploadFile(): file should exist: "+filename)
            .to.be.ok;

        if (! (await E2EAttachments.isUploadButtonVisible())) {
            await E2EAttachments.expandAttachmentsArea();
        }

        // Different file upload mechanisms for headless and desktop browsers
        if (await E2EGlobal.browserIsPhantomJS()) {
            await browser.execute(function () {
                $('#btnUploadAttachment').attr("style", "").focus();  // remove display:none style so that focus() works
            });
            await browser.keys(filename); // send filename as keystrokes
        } else {
            await browser.chooseFile("#btnUploadAttachment", filename);
        }
        await E2EGlobal.waitSomeTime(1500);
    }

    static async getChromeDownloadDirectory() {
        // .meteor/chimp_config.js configures chrome download dir relative to cwd()
        let chimpopts = require ('../../../.meteor/chimp_config');
        let downloadDir = chimpopts.webdriverio.desiredCapabilities.chromeOptions.prefs["download.default_directory"];
        expect(downloadDir, ".meteor/chimp_config.js must specify download.default_directory").to.be.ok;
        downloadDir = process.cwd() + "/" + downloadDir;
        return downloadDir;
    }

    static async switchToUserWithDifferentRole(newRole, _projectName, _lastMeetingName) {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(_projectName, _lastMeetingName, "invited");
        await E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, newRole);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor(true);  // save!
        await E2EApp.loginUser(1);
        await E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
        await E2EMinutes.gotoLatestMinutes();
    }

    static async countAttachmentsGlobally() {
        return server.call('e2e.countAttachmentsInMongoDB');
    }

    // execute an attachment collection count in the
    // client browser context with currently logged in user
    static async countAttachmentsOnClientForCurrentUser() {
        let result = await browser.execute(function () {
            let mod = require("/imports/collections/attachments_private");
            let coll = mod.AttachmentsCollection;
            return coll.find().count();
        });
        return result.value;
    }


    static async getAttachmentDocsForMinuteID(minID) {
        await E2EGlobal.waitSomeTime(2000);
        return server.call('e2e.getAttachmentsForMinute', minID);
    }


    static async getRemoveButtons() {
        return (await browser.elements('button#btnDelAttachment')).value;
    }

    static async getDownloadLinks() {
        return (await browser.elements('a.linkToAttachmentDownload')).value;
    }

}