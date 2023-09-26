import { E2EGlobal } from './E2EGlobal';
import { E2EApp } from './E2EApp';
import { E2EMeetingSeries } from './E2EMeetingSeries';
import {E2EMinutesParticipants} from './E2EMinutesParticipants';


export class E2EMinutes {
    /**
     * @param aProj
     * @param aName
     * @param aDate format: YYYY-MM-DD is optional!
     */
    static async addMinutesToMeetingSeries(aProj, aName, aDate) {
        await E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
        await browser.waitForVisible('#btnAddMinutes');
        await E2EGlobal.clickWithRetry('#btnAddMinutes');
        await E2EGlobal.waitSomeTime(700); // give route change time

        let minutesID = await browser.getUrl();
        minutesID = minutesID.replace(/^.*\//, '');

        if (aDate) {
            await browser.waitForVisible('#id_minutesdateInput');
            await browser.setValue('#id_minutesdateInput', '');
            await browser.setValue('#id_minutesdateInput', aDate);
        }
        return minutesID;
    }

    /**
     * Finalizes the current minute
     *
     * @param confirmDialog should the dialog be confirmed automatically
     *                      default: true
     */
    static async finalizeCurrentMinutes(confirmDialog) {
        let participantsInfo = new E2EMinutesParticipants();
        await participantsInfo.setUserPresence(await E2EApp.getCurrentUser(),true);
        await browser.waitForVisible('#btn_finalizeMinutes');
        await E2EGlobal.clickWithRetry('#btn_finalizeMinutes');

        await E2EMinutes.confirmQualityAssuranceDialog();

        if (E2EGlobal.SETTINGS.email && E2EGlobal.SETTINGS.email.enableMailDelivery) {
            if (confirmDialog === undefined || confirmDialog) {
                await E2EApp.confirmationDialogAnswer(true);
            }
        }
        await E2EGlobal.waitSomeTime(1000);
    }

    /**
     * Finalizes the current minute, when no participants present
     *
     * @param confirmDialog should the dialog be confirmed automatically
     *                      default: true
     *        processFinalize is true, when you want to proceed finalizing Minutes without participants
     */
    static async finalizeCurrentMinutesWithoutParticipants(confirmDialog, processFinalize) {
        await browser.waitForVisible('#btn_finalizeMinutes');
        await E2EGlobal.clickWithRetry('#btn_finalizeMinutes');

        if(processFinalize == true) {
            await E2EMinutes.confirmQualityAssuranceDialog();
            if (E2EGlobal.SETTINGS.email && E2EGlobal.SETTINGS.email.enableMailDelivery) {
                if (confirmDialog === undefined || confirmDialog) {
                    await E2EApp.confirmationDialogAnswer(true);
                }
            }
            await E2EGlobal.waitSomeTime(1000);
        }
        else {
            await browser.waitForVisible('#confirmationDialogCancel');
            await E2EGlobal.clickWithRetry('#confirmationDialogCancel');
        }
    }

    static async confirmQualityAssuranceDialog() {
        await E2EGlobal.waitSomeTime(600);
        if(await browser.isVisible('#minuteQualityAssuranceDialog')) {
            await E2EApp.confirmationDialogAnswer(true);
        }
    }

    static async unfinalizeCurrentMinutes() {
        await E2EGlobal.waitSomeTime(600);
        await browser.waitForVisible('#btn_unfinalizeMinutes');
        await E2EGlobal.clickWithRetry('#btn_unfinalizeMinutes');
        await E2EGlobal.waitSomeTime(1000);
    }


    static async countMinutesForSeries(aProj, aName) {
        let selector = 'a#id_linkToMinutes';
        await E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return 0;   // we have no minutes series <li> => "zero" result
        }
        const elements = await browser.elements(selector);
        return elements.value.length;
    }


    static async getMinutesId(aDate) {
        let selector = 'a#id_linkToMinutes';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }

        const elements = await browser.elements(selector);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = (await browser.elementIdText(elemId)).value;
            if (visibleText == aDate) {
                let linkTarget = (await browser.elementIdAttribute(elemId, 'href')).value;
                return linkTarget.slice(linkTarget.lastIndexOf('/')+1);
            }
        }
        return false;
    }

    static async getCurrentMinutesDate() {
        await browser.waitForVisible('#id_minutesdateInput');
        return browser.getValue('#id_minutesdateInput');
    }

    static async getCurrentMinutesId() {
        let url = await browser.getUrl();
        return url.slice(url.lastIndexOf('/')+1);
    }


    static async gotoMinutes(aDate) {
        let selector = 'a#id_linkToMinutes';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }

        const elements = await browser.elements(selector);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = (await browser.elementIdText(elemId)).value;
            if (visibleText == aDate) {
                await browser.elementIdClick(elemId);
                await E2EGlobal.waitSomeTime();
                return true;
            }
        }
        throw new Error('Could not find Minutes \''+aDate+'\'');
    }

    static async gotoLatestMinutes() {
        let selector = 'a#id_linkToMinutes';

        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;
        }

        const elements = await browser.elements(selector);
        const firstElementId = elements.value[0].ELEMENT;

        await browser.elementIdClick(firstElementId);
        await E2EGlobal.waitSomeTime(500);
    }

    static async gotoParentMeetingSeries() {
        let selector = 'a#id_linkToParentSeries';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime();
    }
}

