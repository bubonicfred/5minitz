import { E2EGlobal } from './E2EGlobal';
import { E2EMinutes } from './E2EMinutes';
import { E2EMeetingSeriesEditor } from './E2EMeetingSeriesEditor';
import { E2EMeetingSeries } from './E2EMeetingSeries';

export class E2ESecurity {
    static insertMeetingSeriesMethod = 'meetingseries.insert';
    static updateMinutes = 'minutes.update';
    static addMinutes = 'workflow.addMinutes';
    static removeMinute = 'workflow.removeMinute';
    static finalizeMinute = 'workflow.finalizeMinute';
    static unfinalizeMinute = 'workflow.unfinalizeMinute';
    static removeMeetingSeriesMethod = 'workflow.removeMeetingSeries';
    static updateMeetingSeriesMethod ='meetingseries.update';
    static addTopic = 'minutes.addTopic';
    static updateTopic = 'minutes.updateTopic';
    static removeTopic = 'minutes.removeTopic';
    static reopenTopic = 'workflow.reopenTopicFromMeetingSeries';
    static saveRoleForMeetingSeries = 'userroles.saveRoleForMeetingSeries';
    static removeAllRolesForMeetingSeries = 'userroles.removeAllRolesForMeetingSeries';

    //Many of the security-e2e-tests will simulate a hacker-attack by calling meteor methods directly.
    //Thus the names of the called meteor methods are hardcoded in the e2e-Tests and have to be updated if a method is renamed.
    //In order to check this, all security-e2e-tests should use this function to check if the methods called within them do still exist. 
    //If that's not the case, the test will fail and by this give a hint for the dev, which test cases have yet to be updated with the new method name.
    static async expectMethodToExist(methodName) {
        let methodExists = (await browser.execute( function(methodName) {
            //The methodHandlers-Dictionary will contain all meteor methods known to the client.
            //By default it will contain exactly the same methods as the server
            return typeof Meteor.connection._methodHandlers[methodName] === 'function'
        },methodName)).value;
        expect(methodExists, 'Method ' + methodName + ' exists').to.be.true;
    }
    
    //Due too Meteor's nature most method calls will result in an execution both on the client and the server.
    //Therefore all security related mechanisms within these methods will be checked on the client and the server.
    //As a hacker it is not possible to manipulate the server's execution of the methods, but the client one can be.
    //This is done by overwriting the local client copy of the method with an empty method stump containing no checks anymore and therefore always being executed successfully.
    //By doing this only the server-side security mechanisms remain which should of course still stop unauthorized actions.
    static async replaceMethodOnClientSide(methodName) {
        await browser.execute( function(methodName) {
            //The methodHandlers-Dictionary contains the client's copy of the meteor methods. 
            //By changing the function for a specific meteor method all future calls of this method for this session will execute the changed function.
            Meteor.connection._methodHandlers[methodName] = function () {console.log('Modified Client Method: ' + methodName);};
        }, methodName);
    }
    
    //Due to the asynchronous execution of most meteor methods and the necessarity to check their specific results within security-e2e-tests it is necessary
    //to wrap these method calls with the following function, allowing for an emulated synchronous usage of these methods.
    static async executeMethod(methodName, ...methodParameters) {
        await E2ESecurity.expectMethodToExist(methodName);
        await browser.timeouts("script", 5000);
        try {
            let result = await browser.executeAsync((methodName, methodParameters, done) => {
                await Meteor.apply(methodName, methodParameters, _ => {
                }, (error, result) => {
                    await done({error, result});
                });
            }, methodName, methodParameters);
            // console.log(`Results are in: error = ${result.value.error}, result = ${result.value.result}`);
        } catch (e) {
            console.log("Exception in executeMethod(): "+e.message);
        }
    }

    static async countRecordsInMiniMongo(collectionName) {
        return (await browser.execute((collectionName) => {
            let collectionpointer = Meteor.Collection.get(collectionName);
            return collectionpointer ? await collectionpointer.find().count() : 0;
        }, collectionName)).value;
    }

    static async returnMeteorId() {
        return (await browser.execute(function () {
            return Random.id();
        })).value;
    }

    static createMeetingSeriesAndMinute = async name => {
        await E2ESecurity.executeMethod(E2ESecurity.insertMeetingSeriesMethod, {project: name, name: name});
        let msID = await E2EMeetingSeries.getMeetingSeriesId(name, name);
        await E2EMinutes.addMinutesToMeetingSeries(name, name);
        await E2EMinutes.gotoLatestMinutes();
        return {
            min_id : await E2EMinutes.getCurrentMinutesId(),
            ms_id: msID,
            date : await E2EMinutes.getCurrentMinutesDate(),
        };
    };

    static tryFinalizeMinute = async (minuteID, expectToBeFinalized) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.finalizeMinute);
        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, minuteID);
        await expect(((await (server.call('e2e.findMinute', minuteID)))).isFinalized).to.equal(expectToBeFinalized);
    };

    static createMeetingSeries = async name => {
        await E2ESecurity.executeMethod(E2ESecurity.insertMeetingSeriesMethod, {project: name, name: name});
        return E2EMeetingSeries.getMeetingSeriesId(name, name);
    };

    static tryUpdateCurrentMinuteDate = async (minuteID, newDate, expectToEqualDate) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.updateMinutes);
        await E2ESecurity.executeMethod(E2ESecurity.updateMinutes, {_id: minuteID, date: newDate});
        await expect(((await (server.call('e2e.findMinute', minuteID)))).date).to.equal(expectToEqualDate);
    };

    static tryAddNewMinute = async (meetingSeriesID, date, expectToEqualNumberMinutes, userIdex) => {
        const userid = await server.call('e2e.getUserId', userIdex);
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.addMinutes);
        await E2ESecurity.executeMethod(E2ESecurity.addMinutes, {meetingSeries_id: meetingSeriesID, date: date, visibleFor:[userid]});
        await expect((await (server.call('e2e.countMinutesInMongoDB')))).to.equal(expectToEqualNumberMinutes);
    };

    static tryRemoveMinute = async (minuteID, expectToEqualNumberMinutes) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.removeMinute);
        await E2ESecurity.executeMethod(E2ESecurity.removeMinute, minuteID);
        await expect((await (server.call('e2e.countMinutesInMongoDB')))).to.equal(expectToEqualNumberMinutes);
    };

    static tryUnfinalizeMinute = async (minuteID, expectToBeUnfinalized) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.unfinalizeMinute);
        await E2ESecurity.executeMethod(E2ESecurity.unfinalizeMinute, minuteID);
        await expect(((await (server.call('e2e.findMinute', minuteID)))).isFinalized).to.equal(expectToBeUnfinalized);
    };

    static inviteUserToMeetingSerie = async (MSname, role, userIndex) => {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(MSname, MSname, 'invited');
        let user = E2EGlobal.SETTINGS.e2eTestUsers[userIndex];
        if (role === 'Invited')
            await E2EMeetingSeriesEditor.addUserToMeetingSeries(user, E2EGlobal.USERROLES.Invited);
        else
            await E2EMeetingSeriesEditor.addUserToMeetingSeries(user, E2EGlobal.USERROLES.Informed);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
    };

    static tryInsertMeetingSeries = async (name, expectToEqual, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.insertMeetingSeriesMethod);
        await E2ESecurity.executeMethod(E2ESecurity.insertMeetingSeriesMethod, {project: name, name: name});
        await expect(await server.call('e2e.countMeetingSeriesInMongDB'), testName).to.equal(expectToEqual);
    };

    static tryDeleteMeetingSeries = async (meetingSeriesID, expectToEqual, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.removeMeetingSeriesMethod);
        await E2ESecurity.executeMethod(E2ESecurity.removeMeetingSeriesMethod, meetingSeriesID);
        await expect(await server.call('e2e.countMeetingSeriesInMongDB'), testName).to.equal(expectToEqual);
    };

    static tryUpdateMeetingSeriesName = async (meetingSeriesID, newName, expectToEqual, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.updateMeetingSeriesMethod);
        await E2ESecurity.executeMethod(E2ESecurity.updateMeetingSeriesMethod, {_id: meetingSeriesID, name: newName});
        await expect(((await (server.call('e2e.findMeetingSeries', meetingSeriesID)))).name, testName).to.equal(expectToEqual);
    };

    static tryAddNewTopic = async (subject, topic_id, min_id, expectToEqual, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.addTopic);
        await E2ESecurity.executeMethod(E2ESecurity.addTopic, min_id, {subject: subject, labels: Array(0), _id: topic_id});
        await expect((await (server.call('e2e.countTopicsInMongoDB', min_id))), testName).to.equal(expectToEqual);
    };


    static tryUpdateTopicSubject = async (newSubject, topic_id, min_id, expectToEqual, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.updateTopic);
        await E2ESecurity.executeMethod(E2ESecurity.updateTopic, topic_id, {subject: newSubject});
        await expect(((await (server.call('e2e.getTopics', min_id))))[0].subject, testName).to.equal(expectToEqual);
    };

    static tryRemoveTopic = async (topic_id, min_id, expectToEqual, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.removeTopic);
        await E2ESecurity.executeMethod(E2ESecurity.removeTopic, topic_id);
        await expect((await (server.call('e2e.countTopicsInMongoDB', min_id))), testName).to.equal(expectToEqual);
    };

    static tryReopenTopic = async (topicID, meetingSeriesID, expectToBeOpened, testName) => {
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.reopenTopic);
        await E2ESecurity.executeMethod(E2ESecurity.reopenTopic, meetingSeriesID, topicID);
        await E2EGlobal.waitSomeTime();
        const topicsOfSeries = await server.call('e2e.getTopicsOfMeetingSeries', meetingSeriesID);
        await expect(topicsOfSeries[0].isOpen, testName).to.equal(expectToBeOpened);
    };

    static tryUpdateRole = async (meetingSeriesID, userIndex, newRole, expectToEqual) => {
        const userID = await server.call('e2e.getUserId', userIndex);
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.saveRoleForMeetingSeries);
        await E2ESecurity.executeMethod(E2ESecurity.saveRoleForMeetingSeries, userID, meetingSeriesID, newRole);
        await expect((await (server.call('e2e.getUserRole', meetingSeriesID, userIndex)))).to.equal(expectToEqual);
    };

    static tryRemoveRole = async (meetingSeriesID, userIndex, expectToEqual) => {
        const userID = await server.call('e2e.getUserId', userIndex);
        await E2ESecurity.replaceMethodOnClientSide(E2ESecurity.removeAllRolesForMeetingSeries);
        await E2ESecurity.executeMethod(E2ESecurity.removeAllRolesForMeetingSeries, userID, meetingSeriesID);
        await expect((await (server.call('e2e.getUserRole', meetingSeriesID, userIndex)))).to.equal(expectToEqual);
    };

}