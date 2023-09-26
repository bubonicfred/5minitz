import { E2EGlobal } from './E2EGlobal';

const fs = require('fs-extra');

export class E2EProtocols {
    static async setSettingsForProtocolGeneration(format) {
        //Set on server
        await server.call('e2e.setSettingsForProtocolGeneration', format);
        //Set on client
        await browser.execute((format) => {
            Meteor.settings.public.docGeneration.enabled = !!format;

            if (format) {
                Meteor.settings.public.docGeneration.format = format;
            }
        }, format);
    }

    static async countProtocolsInMongoDB() {
        return server.call('e2e.countProtocolsInMongoDB');
    }

    static async checkProtocolFileForMinuteExits(minuteId) {
        let path = await server.call('e2e.getProtocolStoragePathForMinute', minuteId);
        
        if (!path) { //no protocol record in MongoDB
            return false;
        }
        return fs.existsSync(path);
    }

    static async downloadButtonExists() {
        return browser.isVisible('.btn-download');
    }

    static async checkDownloadOpensConfirmationDialog() {
        await browser.click('.btn-download');
        await E2EGlobal.waitSomeTime(750);
        return browser.isVisible('#confirmationDialogOK');
    }

    static async getDownloadLinkForProtocolOfMinute(minuteId) {
        return server.call('e2e.getProtocolLinkForMinute', minuteId);
    }
}