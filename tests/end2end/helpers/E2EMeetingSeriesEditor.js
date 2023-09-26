import { E2EGlobal } from './E2EGlobal';
import { E2EMeetingSeries } from './E2EMeetingSeries';


export class E2EMeetingSeriesEditor {

    static async openMeetingSeriesEditor(aProj, aName, panelName = "base", skipGotoMeetingSeries) {
        // Maybe we can save "gotoStartPage => gotoMeetingSeries"?
        if (!skipGotoMeetingSeries) {
            await E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
        }

        // Open dialog
        await browser.waitForVisible('#btnEditMeetingSeries', 1000);
        await E2EGlobal.clickWithRetry('#btnEditMeetingSeries', 3000);

        // Check if dialog is there?
        await browser.waitForVisible('#btnMeetingSeriesSave', 3000);
        await E2EGlobal.clickWithRetry("#btnShowHideBaseConfig", 3000);
        await E2EGlobal.waitSomeTime(); // give dialog animation time

        if (panelName && panelName !== "base") {
            let panelSelector = "";
            if (panelName === "invited") {
                panelSelector = "#btnShowHideInvitedUsers";
            }
            else if (panelName === "labels") {
                panelSelector = "#btnShowHideLabels";
            } else {
                throw "Unsupported panelName: " + panelName;
            }
            await browser.waitForExist(panelSelector);
            await E2EGlobal.clickWithRetry(panelSelector);
            await E2EGlobal.waitSomeTime();  // wait for panel animation
        }
    };

    // assumes an open meeting series editor
    static async addUserToMeetingSeries(username, role) {
        await browser.setValue('#edt_AddUser', username);
        await browser.keys(['Enter']);

        if (role) {
            //Get Index of user's row in table
            let index = (await browser.execute((username) => {
                return $("tr:contains('" + username + "')").index();
            }, username)).value;
            index += 1; //increase by one since nth-child will start by 1 whereas index starts by 0
            let selector = "tr:nth-child(" + index + ")" + ' select.user-role-select';
            await browser.selectByValue(selector, role);
        }
    };

    static async closeMeetingSeriesEditor(save = true) {
        let selector = (save) ? '#btnMeetingSeriesSave' : '#btnMeetinSeriesEditCancel';
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime(save ? 750 : 300);
    }


    /**
     * Analyze the user editor table in the DOM and generate a dictionary with its content
     *
     * Example result:
     { user1:
        { role: 'Moderator',
          isReadOnly: true,
          isDeletable: false,
          deleteElemId: '0' },
       user2:
        { role: 'Invited',
          isReadOnly: false,
          isDeletable: true,
          deleteElemId: '236' } }
     *
     * @param colNumUser    in which 0-based table column is the user name?
     * @param colNumRole    in which 0-based table column is the role text/ role <select>?
     * @param colNumDelete  in which 0-based table column is the delete button?
     * @returns {{}}
     */
    static async getUsersAndRoles(colNumUser, colNumRole, colNumDelete) {
        // grab all user rows
        const elementsUserRows = await browser.elements('#id_userRow');
        let usersAndRoles = {};

        let selector = "select.user-role-select";   // selects *all* <selects>
        // browser.getValue(selector) delivers *all* current selections => e.g. ["Moderator","Invited","Invited"]
        // except for the current user, who has no <select>
        let usrRoleSelected = [];
        // ensure we get an array here - even in case only one value returned from getValue()!
        try {
            usrRoleSelected = usrRoleSelected.concat(await browser.getValue(selector));
        } catch (e) {
        }

        let selectNum = 0;
        // the "current user" is read-only and has no <select>
        // we must skip this user in the above usrRoleSelected
        for (let rowIndex in elementsUserRows.value) {
            let elemTRId = elementsUserRows.value[rowIndex].ELEMENT;
            let elementsTD = await browser.elementIdElements(elemTRId, "td");
            let usrName = (await browser.elementIdText(elementsTD.value[colNumUser].ELEMENT)).value;
            let elementsDelete = await browser.elementIdElements(elementsTD.value[colNumDelete].ELEMENT, "#btnDeleteUser");
            let usrIsDeletable = elementsDelete.value.length === 1;
            let usrDeleteElemId = usrIsDeletable ? elementsDelete.value[0].ELEMENT : "0";

            // for the current user usrRole already contains his read-only role string "Moderator"
            let usrRole = (await browser.elementIdText(elementsTD.value[colNumRole].ELEMENT)).value;
            let usrIsReadOnly = true;

            // For all other users we must get their role from the usrRoleSelected array
            // Here we try to find out, if we look at a <select> UI element...
            // Chrome: with '\n' linebreaks we detect a <select> for this user!
            // Phantom.js: Has no linebreaks between <option>s, it just concatenates like "InvitedModerator"
            // so we go for "usrRole.length>10" to detect a non-possible role text...
            if (usrRole.indexOf("\n") >= 0 || usrRole.length > 10) {
                usrRole = usrRoleSelected[selectNum];
                usrIsReadOnly = false;
                selectNum += 1;
            }

            usersAndRoles[usrName] = {
                role: usrRole,
                isReadOnly: usrIsReadOnly,
                isDeletable: usrIsDeletable,
                deleteElemId: usrDeleteElemId
            };
        }
        // console.log(usersAndRoles);

        return usersAndRoles;
    }

    static async changeLabel(labelName, newLabelName, newLabelColor, autoSaveLabelChange = true) {
        let labelId = await E2EMeetingSeriesEditor.getLabelId(labelName);
        let selLabelRow = '#row-label-' + labelId;

        // open label editor for labelId
        await E2EGlobal.clickWithRetry(selLabelRow + ' .evt-btn-edit-label');

        await browser.setValue(selLabelRow + " [name='labelName']", newLabelName);
        if (newLabelColor) {
            await browser.setValue(selLabelRow + " [name='labelColor-" + labelId + "']", newLabelColor);
        }

        if (autoSaveLabelChange) {
            await E2EGlobal.clickWithRetry(selLabelRow + ' .evt-btn-edit-save');

            await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
        }

        return labelId;
    }

    static async getLabelId(labelName) {
        // get all label elements
        await browser.waitForExist('#table-edit-labels .label');
        let elements = (await browser.elements('#table-edit-labels .label')).value;

        for (let elementID of elements) {
            let element = await browser.elementIdText(elementID.ELEMENT);
            if (labelName === element.value) {
                return (await browser.elementIdAttribute(elementID.ELEMENT, 'id')).value;
            }
        }
    }

    static async disableEmailForRoleChange() {
        await browser.waitForVisible('#labelRoleChange');
        await E2EGlobal.clickWithRetry('#labelRoleChange');
    }


}
