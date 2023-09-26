import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'


export class E2ETopics {
    static async addTopicToMinutes(aTopic, aResponsible) {
        await browser.waitForVisible("#id_showAddTopicDialog");
        await E2EGlobal.clickWithRetry("#id_showAddTopicDialog");

        await E2ETopics.insertTopicDataIntoDialog(aTopic, aResponsible);
        await E2ETopics.submitTopicDialog();
    };

    static async addTopicWithLabelToMinutes(aTopic, label) {
        await browser.waitForVisible("#id_showAddTopicDialog");
        await E2EGlobal.clickWithRetry("#id_showAddTopicDialog");

        await E2ETopics.insertTopicDataWithLabelIntoDialog(aTopic, label);
        await E2ETopics.submitTopicDialog();
    };

    static async addTopicToMinutesAtEnd(aTopic, aResonsible) {
        await browser.waitForVisible("#addTopicField");
        await E2EGlobal.clickWithRetry("#addTopicField");

        await E2ETopics.insertTopicDataAtEnd(aTopic, aResonsible);
        await E2ETopics.submitTopicAtEnd();
    }
    
    static async openEditTopicForMinutes(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnEditTopic";
        await browser.waitForVisible(selector);
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime(500);
    }

    static async editTopicForMinutes(topicIndex, newTopicSubject, newResponsible) {
        await E2ETopics.openEditTopicForMinutes(topicIndex);
        await E2ETopics.insertTopicDataIntoDialog(newTopicSubject, newResponsible);
        await E2ETopics.submitTopicDialog();
    }

    static async deleteTopic(topicIndex, confirmDialog) {
        const selectorMenu = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
        await browser.waitForVisible(selectorMenu);
        await E2EGlobal.clickWithRetry(selectorMenu);
        const selectorDeleteBtn = "#topicPanel .well:nth-child(" + topicIndex + ") #btnDelTopic";
        await browser.waitForVisible(selectorDeleteBtn);
        await E2EGlobal.clickWithRetry(selectorDeleteBtn);
        if (confirmDialog === undefined) {
            return;
        }
        await E2EApp.confirmationDialogAnswer(confirmDialog);
    }

    static async label2TopicEnterFreetext(labelName) {
        await (await browser.element('#id_subject')).click();
        await browser.keys("\uE004"); // Tab to reach next input field => labels
        await browser.keys(labelName+"\uE007"); // plus ENTER
    }

    static async responsible2ItemEnterFreetext(theText) {
        await E2EGlobal.waitSomeTime();

        // &%$#$@! - the following does not work => Uncaught Error: element not visible
        // browser.element(".form-group-responsibles .select2-selection").click();
        // ... so we take this as workaround: click into first select2 then Tab/Tab to the next one

        await (await browser.element(".form-group-labels .select2-selection")).click();
        await browser.keys("\uE004\uE004"); // 2 x Tab to reach next select2

        let texts = theText.split(",");
        for (let i in texts) {
            await browser.keys(texts[i]);
            await E2EGlobal.waitSomeTime(300);
            await browser.keys("\uE007"); // ENTER
        }
    }

    static async responsible2TopicEnterFreetext(theText) {
        await (await browser.element('#id_subject')).click();
        await browser.keys("\uE004\uE004"); // Tab to reach next input field => labels
        await browser.keys(theText);
        await E2EGlobal.waitSomeTime();
        await browser.keys("\uE007"); // plus ENTER
    }

    static async labelEnterFreetext(theText) {
        await E2EGlobal.waitSomeTime();
        await (await browser.element(".form-group-labels .select2-selection")).click();
        await E2EGlobal.waitSomeTime();
        await browser.keys(theText+"\uE007"); // plus ENTER
    }
    
    static async insertTopicDataIntoDialog(subject, responsible) {
        try {
            await browser.waitForVisible('#id_subject');
        } catch (e) {
            return false;
        }
        await E2EGlobal.waitSomeTime();
        
        if (subject) {
            await E2EGlobal.setValueSafe('#id_subject', subject);
        }
        if (responsible) {
            await E2ETopics.responsible2TopicEnterFreetext(responsible);
        }
    }

    static async insertTopicDataWithLabelIntoDialog(subject, label) {
        try {
            await browser.waitForVisible('#id_subject');
            await browser.waitForVisible('#id_item_selLabels');
        } catch (e) {
            return false;
        }
        await E2EGlobal.waitSomeTime();

        if (subject) {
            await E2EGlobal.setValueSafe('#id_subject', subject);
        }
        if(label) {
            await E2ETopics.label2TopicEnterFreetext(label);
        }
    }

    static async insertTopicDataAtEnd(subject, responsible) {
        try {
            await browser.waitForVisible('#addTopicField');
        }
        catch (e) {
            return false;
        }
        await E2EGlobal.waitSomeTime();

        if (subject) {
            await E2EGlobal.setValueSafe('#addTopicField', subject);
        }
        if (responsible) {
            await E2ETopics.responsible2TopicEnterFreetext(responsible);
        }
    }

    static async submitTopicDialog() {
        await E2EGlobal.clickWithRetry("#btnTopicSave");

        const waitForInvisible = true;
        await browser.waitForVisible('#dlgAddTopic', 10000, waitForInvisible);
        await E2EGlobal.waitSomeTime(700);
    }

    static async submitTopicAtEnd() {
        await browser.keys("Enter");
        await E2EGlobal.waitSomeTime(700);
    }

    static async openInfoItemDialog(topicIndex, type="infoItem") {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";

        await browser.waitForVisible(selector, 2000);
        await E2EGlobal.clickWithRetry(selector);
        let typeClass = ".addTopicInfoItem";
        if (type === "actionItem") {
            typeClass = ".addTopicActionItem";
        }
        await E2EGlobal.clickWithRetry("#topicPanel .well:nth-child(" + topicIndex + ") "+typeClass);

        await browser.waitForVisible('#id_item_subject', 5000);
    }

    static async addInfoItemToTopic(infoItemDoc, topicIndex, autoCloseDetailInput = true) {
        let type = ((await (infoItemDoc.hasOwnProperty('itemType')))) ? infoItemDoc.itemType : 'infoItem';
        await this.openInfoItemDialog(topicIndex, type);
        await this.insertInfoItemDataIntoDialog(infoItemDoc);
        await this.submitInfoItemDialog();

        await E2EGlobal.waitSomeTime();
        if (autoCloseDetailInput) {
            await E2EGlobal.waitSomeTime(600);
            await browser.keys(['Escape']);
            await E2EGlobal.waitSomeTime();
        }
    }

    static async openInfoItemEditor(topicIndex, infoItemIndex) {
        let selector = (await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex)) + ".btnEditInfoItem";

        await browser.waitForVisible(selector);
        await E2EGlobal.clickWithRetry(selector);

        await E2EGlobal.waitSomeTime();
    }

    static async editInfoItemForTopic(topicIndex, infoItemIndex, infoItemDoc) {
        await E2ETopics.openInfoItemEditor(topicIndex, infoItemIndex, infoItemDoc);

        await this.insertInfoItemDataIntoDialog(infoItemDoc, true);
        await this.submitInfoItemDialog();
    }

    static async addLabelToItem(topicIndex, infoItemIndex, labelName) {
        await E2ETopics.openInfoItemEditor(topicIndex, infoItemIndex);
        await E2ETopics.labelEnterFreetext(labelName);
        await E2EGlobal.clickWithRetry("#btnInfoItemSave");
        await E2EGlobal.waitSomeTime(700);
    }

    static async deleteInfoItem(topicIndex, infoItemIndex, confirmDialog) {
        let selOpenMenu = (await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex)) + "#btnItemDropdownMenu";
        await browser.waitForVisible(selOpenMenu);
        await E2EGlobal.clickWithRetry(selOpenMenu);
        let selDelete = (await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex)) + "#btnDelInfoItem";
        await browser.waitForVisible(selDelete);
        await E2EGlobal.clickWithRetry(selDelete);

        if (confirmDialog === undefined) {
            return;
        }
        await E2EApp.confirmationDialogAnswer(confirmDialog);
    }

    static async insertInfoItemDataIntoDialog(infoItemDoc) {
        if (!(await browser.isVisible('#id_item_subject'))) {
            throw new Error('Info item dialog is not visible');
        }

        if (infoItemDoc.subject) {
            await E2EGlobal.setValueSafe('#id_item_subject', infoItemDoc.subject);
        }
        if (infoItemDoc.label) {
            await E2ETopics.labelEnterFreetext(infoItemDoc.label);
        }
        if (infoItemDoc.responsible) {
            await E2ETopics.responsible2ItemEnterFreetext(infoItemDoc.responsible);
        }
        if (infoItemDoc.priority) {
            const nthChild = infoItemDoc.priority;
            await E2EGlobal.clickWithRetry(`#id_item_priority option:nth-child(${nthChild})`);
        }

        //todo: set other fields (duedate)
    }

    static async submitInfoItemDialog() {
        await E2EGlobal.clickWithRetry("#btnInfoItemSave");
        await E2EGlobal.waitSomeTime(700);
    }

    static async toggleTopic(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .labelTopicCb";
        await browser.waitForVisible(selector);
        await E2EGlobal.clickWithRetry(selector);
    }

    static async toggleRecurringTopic(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
        try {
            // we use the "_org" / non screen shot version here intentionally,
            // as we often expect the 'recurring icon' to be hidden!
            await browser.waitForVisible_org(selector);
        } catch(e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.clickWithRetry("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring");
    }
    
    static async toggleSkipTopic(topicIndex, useDropDownMenu = true) {
        // The 2nd parameter determines if the skip should be done via the dropdown-menu or by directly clicking the IsSkipped-Icon shown on the topic. 
        // The latter one will of course only work if the topic is currently skipped
        if (useDropDownMenu) {
            let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
            try {
                // we use the "_org" / non screen shot version here intentionally,
                // as we often expect the 'recurring icon' to be hidden!
                await browser.waitForVisible_org(selector);
            } catch(e) {
                return false;
            }
            await E2EGlobal.clickWithRetry(selector);
            await E2EGlobal.clickWithRetry("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-skipped");
        }
        else {
            await E2EGlobal.waitSomeTime();
            await E2EGlobal.clickWithRetry("#topicPanel .well:nth-child(" + topicIndex + ") #topicIsSkippedIcon");
        }
    }

    static async isTopicClosed(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .btnToggleState";

        return E2EGlobal.isCheckboxSelected(selector)
    }

    static async isTopicRecurring(topicIndex) {
        return this._isSelectorVisible("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring span");
    }
    
    static async isTopicSkipped(topicIndex) {
        return this._isSelectorVisible("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-skipped span");
    }
    
    static async _isSelectorVisible(selector) {
        try {
            // we use the "_org" / non screen shot version here intentionally,
            // as we often expect the 'recurring icon' to be hidden!
            await browser.waitForVisible_org(selector);
            return true;
        } catch(e) {
            return false;
        }       
    }
    
    static async hasDropDownMenuButton(topicIndex, buttonSelector) {
        if (!buttonSelector)
            return false;
        
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
        try {
            // we use the "_org" / non screen shot version here intentionally,
            // as we often expect the 'dropdown icon' to be hidden!
            await browser.waitForVisible_org(selector);
        } catch(e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selector);
        return browser.isVisible("#topicPanel .well:nth-child(" + topicIndex + ") " + buttonSelector);      
    }
    
    static async reOpenTopic(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
        try {
            // we use the "_org" / non screen shot version here intentionally,
            // as we often expect the 'recurring icon' to be hidden!
            await browser.waitForVisible_org(selector);
        } catch(e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.clickWithRetry("#topicPanel .well:nth-child(" + topicIndex + ") #btnReopenTopic");
        await E2EApp.confirmationDialogAnswer(true);
    }

    static async toggleActionItem(topicIndex, infoItemIndex) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selector = selectInfoItem + ".checkboxLabel";
        await browser.waitForVisible(selector);
        await E2EGlobal.clickWithRetry(selector);
    }

    static async isActionItemClosed(topicIndex, infoItemIndex) {
        let selector = (await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex)) + ".btnToggleAIState";

        return E2EGlobal.isCheckboxSelected(selector)
    }

    static async toggleInfoItemStickyState(topicIndex, infoItemIndex) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);
        let selectorOpenMenu = selectInfoItem + "#btnItemDropdownMenu";
        try {
            await browser.waitForVisible_org(selectorOpenMenu);
        } catch (e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selectorOpenMenu);

        let selector = selectInfoItem + ".btnPinInfoItem";
        await E2EGlobal.clickWithRetry(selector);
    }

    static async isInfoItemSticky(topicIndex, infoItemIndex) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selector = selectInfoItem + ".btnPinInfoItem span";
        try {
            await browser.waitForVisible(selector);
            return true;
        } catch(e) {
            return false;
        }
    }

    static async getInfoItemSelector(topicIndex, infoItemIndex) {
        return "#topicPanel .well:nth-child(" + topicIndex + ") .topicInfoItem:nth-child(" + infoItemIndex + ") ";
    }

    static async expandDetails(selectorForInfoItem) {
        let selOpenDetails = selectorForInfoItem + ".expandDetails";
        await browser.waitForVisible(selOpenDetails);

        try {
            await browser.waitForVisible(selectorForInfoItem + ".detailRow");
        } catch (e) {
            await E2EGlobal.clickWithRetry(selOpenDetails);
        }
    }

    static async expandDetailsForActionItem(topicIndex, infoItemIndex) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        await E2ETopics.expandDetails(selectInfoItem);
    }

    static async expandDetailsForNthInfoItem(n) {
        let selectInfoItem = "#itemPanel .topicInfoItem:nth-child(" + n + ") ";
        await E2ETopics.expandDetails(selectInfoItem);
        await E2EGlobal.waitSomeTime();
    }

    static async addFirstDetailsToNewInfoItem(infoItemDoc, topicIndex, detailsText, autoCloseDetailInput = true) {
        let type = ((await (infoItemDoc.hasOwnProperty('itemType')))) ? infoItemDoc.itemType : 'infoItem';
        await this.openInfoItemDialog(topicIndex, type);
        await this.insertInfoItemDataIntoDialog(infoItemDoc);

        await browser.setValue('#id_item_detailInput', detailsText);
        await this.submitInfoItemDialog();
    }

    /**
     * Adds details to an action item.
     *
     * @param topicIndex index of the chosen topic (1=topmost ... n=#topics)
     * @param infoItemIndex index of the chosen AI (1=topmost ... n=#info items)
     * @param detailsText text to set
     * @param doBeforeSubmit callback, which will be called before submitting the changes
     * @returns {boolean}
     */
    static async addDetailsToActionItem(topicIndex, infoItemIndex, detailsText, doBeforeSubmit) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selOpenMenu = selectInfoItem + "#btnItemDropdownMenu";
        try {
            await browser.waitForVisible(selOpenMenu);
        } catch (e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selOpenMenu);

        let selAddDetails = selectInfoItem + ".addDetail";
        await E2EGlobal.clickWithRetry(selAddDetails);

        let newId = await E2ETopics.countDetailsForItem(topicIndex, infoItemIndex);
        let selDetails = selectInfoItem + ".detailRow:nth-child(" + newId + ") ";
        let selFocusedInput = selDetails + ".detailInput";
        try {
            await browser.waitForVisible(selFocusedInput);
        } catch (e) {
            console.error('Could not add details. Input field not visible');
            return false;
        }
        await E2EGlobal.setValueSafe(selFocusedInput, detailsText);
        if (doBeforeSubmit) {
            await doBeforeSubmit(selFocusedInput);
        }
        await browser.keys(['Tab']);
        await E2EGlobal.waitSomeTime(400);
    }

    static async editDetailsForActionItem(topicIndex, infoItemIndex, detailIndex, detailsText) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);
        await E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

        let selDetails = selectInfoItem + ".detailRow:nth-child(" + detailIndex + ") ";

        let selEditDetails = selDetails + ".detailText";
        try {
            await browser.waitForVisible(selEditDetails);
        } catch (e) {
            console.log("detailText not visible");
            return false;
        }
        await E2EGlobal.clickWithRetry(selEditDetails);

        let selFocusedInput = selDetails + ".detailInput";
        try {
            await browser.waitForVisible(selFocusedInput);
        } catch (e) {
            return false;
        }
        await E2EGlobal.setValueSafe(selFocusedInput, detailsText);
        await browser.keys(['Tab']);
    }

    static async getTopicsForMinute() {
        let selector = '#topicPanel > div.well';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return 0;
        }
        const elements = await browser.elements(selector);
        return elements.value;
    }

    static async countTopicsForMinute() {
        let topics = await E2ETopics.getTopicsForMinute();
        return (topics.length) ? topics.length : 0;
    }

    static async getLastTopicForMinute() {
        let topics = await E2ETopics.getTopicsForMinute();
        return topics[topics.length-1];
    }

    static async getItemsForTopic(topicIndexOrSelectorForParentElement) {
        let parentSel = topicIndexOrSelectorForParentElement;
        if (!isNaN(parentSel)) {
            parentSel = "#topicPanel .well:nth-child(" + topicIndexOrSelectorForParentElement + ")";
        }
        let selector = parentSel + " .topicInfoItem";
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return [];
        }
        const elements = await browser.elements(selector);
        return elements.value;
    }

    static async getAllItemsFromItemList() {
        let selector = ".topicInfoItem";
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return [];
        }
        return (await browser.elements(selector)).value;
    }

    static async getNthItemFromItemList(n) {
        const elements = await E2ETopics.getAllItemsFromItemList();
        return browser.elementIdText(elements[n].ELEMENT);
    }

    static async countItemsForTopic(topicIndex) {
        let items = await E2ETopics.getItemsForTopic(topicIndex);
        return items.length;
    }

    static async getDetailsForItem(topicIndex, infoItemIndex) {
        let selectInfoItem = await E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        await E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

        let selector = selectInfoItem + " .detailRow";
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return 0;
        }
        const elements = await browser.elements(selector);
        return elements.value;
    }

    static async countDetailsForItem(topicIndex, infoItemIndex) {
        let details = await E2ETopics.getDetailsForItem(topicIndex, infoItemIndex);
        return details.length;
    }
}
