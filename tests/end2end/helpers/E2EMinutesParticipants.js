import {E2EGlobal} from './E2EGlobal';

export class E2EMinutesParticipants {
    
    constructor() {
        await this.updateUsersAndPresence();
    }



    // ******************** STATIC Methods
    static async isExpanded() {
        await E2EGlobal.waitSomeTime(750);
        return browser.isExisting('#edtParticipantsAdditional');
    }

    static async isCollapsed() {
        return ! (await E2EMinutesParticipants.isExpanded());
    }

    static async expand() {
        if (await E2EMinutesParticipants.isCollapsed()) {
            await E2EGlobal.clickWithRetry('#btnParticipantsExpand');
            await browser.waitForVisible('#id_participants');
        }
    }

    static async collapse() {
        if (await E2EMinutesParticipants.isExpanded()) {
            await E2EGlobal.clickWithRetry('#btnParticipantsExpand');

            const waitForInvisible = true;
            await browser.waitForVisible('#id_participants', 10000, waitForInvisible);
        }
    }

    static async getPresentParticipantsFromServer(minutesId) {
        try {
            return server.call('e2e.getPresentParticipantNames', minutesId);
        } catch (e) {
            console.log('Exception: '+e);
            console.log('Did you forget to run the server with \'--settings settings-test-end2end.json\'?');
        } 
        return undefined;
    }



    // ******************** NON-STATIC Methods

    /*  updateUsersAndPresence()
        updates this._participantsAndPresence from the current browser DOM.
        E.g., to something like this:
         {
             "##additional participants##": "Max Mustermann and some other guys",
             "user1": {
                 "present": false,
                 "checkboxElem": {...},
                 "userElem": "{...}
             },
             "user2": {
                 "present": true,
                 "checkboxElem": {...},
                 "userElem": {...}
             },
         }
     */
    async updateUsersAndPresence() {
        // scroll to top to make sure the page will not scroll if any element disappears (e.g. item input field)
        await browser.scrollXY(0, 0);
        await E2EMinutesParticipants.expand();

        this._participantsAndPresence = {};
        try {
            this._participantsAndPresence['##additional participants##'] = await $('#edtParticipantsAdditional').getValue();
        } catch(e) {
            this._participantsAndPresence['##additional participants##'] = '';
        }

        const participants = await $$('.js-participant-checkbox #id_username');
        const presence = await $$('input.js-toggle-present');

        for (let participantIndex=0; participantIndex<participants.length; participantIndex++) {
            let username = await participants[participantIndex].getText();
            let userElem = participants[participantIndex];
            let checkboxElem = presence[participantIndex];

            this._participantsAndPresence[username] = {
                present: await checkboxElem.isSelected(),
                checkboxElem: checkboxElem,
                userElem: userElem
            };
        }
    }

    async getParticipantsCount() {
        // "-1" to skip this._participantsAndPresence["##additional participants##"]
        return Object.keys(this._participantsAndPresence).length -1;
    }

    async getParticipantInfo(username) {
        return this._participantsAndPresence[username];
    }
    
    async getAdditionalParticipants() {
        return this._participantsAndPresence['##additional participants##'];
    }

    async setUserPresence(username, presence) {
        if (!this._participantsAndPresence[username]) {
            return false;
        }
        let currentSelectState = await this._participantsAndPresence[username].checkboxElem.isSelected();
        if (currentSelectState !== presence) {
            await browser.scroll('#id_participants');
            await this._participantsAndPresence[username].userElem.click();
        }
        await this.updateUsersAndPresence();
        return true;
    }
}
