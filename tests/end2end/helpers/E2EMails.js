import {E2EGlobal} from './E2EGlobal';

export class E2EMails {

    static async resetSentMailsDb() {
        await server.call('e2e.resetTestMailDB');
    }

    static async getAllSentMails() {
        await E2EGlobal.waitSomeTime(700);
        return server.call('e2e.findSentMails');
    }

    /**
     * Returns all recipients of all sent mails
     */
    static async getAllRecipients() {
        let mails = await E2EMails.getAllSentMails();
        let recipients = [];
        for (const mail of mails) {
            recipients = recipients.concat(mail.to);
        };
        return recipients;
    }
}