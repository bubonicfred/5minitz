import { E2EGlobal } from './E2EGlobal';
import { E2EApp } from './E2EApp';


export class E2EMeetingSeries {
    static async countMeetingSeries(gotToStartPage = true) {
        if (gotToStartPage) {
            await E2EApp.gotoStartPage();
        }
        try {
            await browser.waitForExist('li.meeting-series-item');
        } catch (e) {
            return 0;   // we have no meeting series <li> => "zero" result
        }
        const elements = await browser.elements('li.meeting-series-item');
        return elements.length;
    }


    static async editMeetingSeriesForm(aProj, aName, switchInput) {
        await E2EApp.gotoStartPage();

        // is "create MeetingSeries dialog" closed?
        if (!(await browser.isVisible('input[id="id_meetingproject"]'))) {
            await E2EGlobal.clickWithRetry('#btnNewMeetingSeries');  // open
            await E2EGlobal.waitSomeTime();
            await browser.waitForVisible('input[id="id_meetingproject"]');
        }

        if (switchInput) {
            await browser.setValue('input[id="id_meetingname"]', aName);
            await browser.setValue('input[id="id_meetingproject"]', aProj);
        } else {
            await browser.setValue('input[id="id_meetingproject"]', aProj);
            await browser.setValue('input[id="id_meetingname"]', aName);
        }
    }

    static async createMeetingSeries(aProj, aName, keepOpenMSEditor, switchInput) {
        await this.editMeetingSeriesForm(aProj, aName,  switchInput);
        await E2EGlobal.waitSomeTime();

        await E2EGlobal.clickWithRetry('#btnAddInvite');
        await E2EGlobal.logTimestamp('will open MS Editor');
        try {
            await browser.waitForVisible('#btnMeetinSeriesEditCancel', 5000); // will check every 500ms
            await E2EGlobal.logTimestamp('is open: MS Editor');
        } catch (e) {
            await E2EGlobal.logTimestamp('could not open: MS Editor');
            if (keepOpenMSEditor) {
                throw e;
            }
        }
        await E2EGlobal.waitSomeTime(1000);  // additional time for panel switch!
        let meetingSeriesID = await browser.getUrl();
        meetingSeriesID = meetingSeriesID.replace(/^.*\//, '');
        meetingSeriesID = meetingSeriesID.replace(/\?.*$/, '');

        if (! keepOpenMSEditor) {
            if (await browser.isVisible('#btnMeetinSeriesEditCancel')) {
                await E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');
                // browser.waitForVisible('#btnMeetinSeriesEditCancel', 4000, true); // will check for IN-VISIBLE!
            } else {
                // if for miracoulous reasons the MS editor is already gone - we will try to continue...
                await E2EGlobal.logTimestamp('MS Editor is closed by miracle. Continue.');
            }
            await E2EApp.gotoStartPage();
        }
        return meetingSeriesID;
    }


    static async getMeetingSeriesId(aProj, aName) {
        const link = $('='+aProj+': '+aName);
        if (!link.isExisting()) {
            console.log('Could not find MSId for', aProj, aName);
            return '';
        }
        let linkTarget = link.getAttribute('href');
        return linkTarget.slice(linkTarget.lastIndexOf('/')+1);
    }

    static async gotoMeetingSeries(aProj, aName) {
        await E2EApp.gotoStartPage();
        await E2EGlobal.waitSomeTime();

        let selector = 'li.meeting-series-item a';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        let compareText = aProj+': '+aName;

        const element = $('='+compareText);
        if (!(await element.isExisting())) {
            throw new Error('Could not find Meeting Series \''+compareText+'\'');
        }
        await element.scrollIntoView();
        await E2EGlobal.waitSomeTime(100);
        await element.click();
        await E2EGlobal.waitSomeTime(500);
        let currentURL = await browser.getUrl();
        if (!currentURL.includes('meetingseries')) {
            throw new Error('Could not switch to Meeting Series \''+compareText+'\'');
        }
        return true;
    }

    static async gotoTabMinutes() {
        let selector = '#tab_minutes';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime();
    }

    static async gotoTabTopics() {
        let selector = '#tab_topics';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime();
    }

    static async gotoTabItems() {
        let selector = '#tab_items';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime();
    }

    static async searchMeetingSeries(query) {
        await E2EApp.gotoStartPage();

        if (await browser.isVisible('input[id="id_MeetingSeriesSearch"]')) {
            await browser.setValue('input[id="id_MeetingSeriesSearch"]', query);
        }
        await E2EGlobal.waitSomeTime();
    }

    static async visibleMeetingSeriesSearch() {
        return browser.isVisible('input[id="id_MeetingSeriesSearch"]');
    }

    static async visibleWarning() {
        return browser.isVisible('span[id="id_noresults"]');
    }
}
