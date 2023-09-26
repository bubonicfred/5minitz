
import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';


before(function() {
    console.log('End2End Settings:');
    console.log('# of test users:', E2EGlobal.SETTINGS.e2eTestUsers.length);

    // We refactor the browser.click() method to save a screenshot
    // with a unique ID if click() fails.
    browser.click_org = browser.click;
    browser.click = function (...args) {
        try {
            await browser.click_org(...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.click() target "${args[0]}" not found - see screenshot with ID: ${id}`);
            await E2EGlobal.saveScreenshot(`click-error_${id}`);
            throw e;
        }
    };

    // We refactor the browser.waitForVisible() method to save a screenshot
    // with a unique ID if waitForVisible() fails.
    browser.waitForVisible_org = browser.waitForVisible;
    browser.waitForVisible = function (selector, timeout = 10000, ...args) {
        try {
            await browser.waitForVisible_org(selector, timeout, ...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.waitForVisible() target "${selector}" not found - see screenshot with ID: ${id}`);
            await E2EGlobal.saveScreenshot(`waitForVisible-error_${id}`);
            throw e;
        }
    };

    // We refactor the browser.click() method to save a screenshot
    // with a unique ID if click() fails.
    browser.elementIdClick_org = browser.elementIdClick;
    browser.elementIdClick = function (...args) {
        try {
            await browser.elementIdClick_org(...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.elementIdClick() target "${args[0]}" not found - see screenshot with ID: ${id}`);
            await E2EGlobal.saveScreenshot(`clickId-error_${id}`);
            throw e;
        }
    };

    // Some E2E tests run more robust on "large" width screen
    if (await E2EGlobal.browserIsPhantomJS()) {
        await browser.setViewportSize({
            width: 1024,
            height: await browser.getViewportSize('height')
        });
    }

    await E2EApp.resetMyApp();
    await E2EApp.launchApp();
    await E2EApp.loginUser();
    expect(await E2EApp.isLoggedIn(), 'User is logged in').to.be.true;
});

beforeEach(function() {
    if (!this.currentTest) {
        return;
    }

    const testName = this.currentTest.title;
    await browser.execute((testName) => {
        console.log('--- TEST CASE STARTED --- >' + testName + '<');
    }, testName);

    await server.call('e2e.debugLog', `--- TEST CASE STARTED --- >${testName}<`);
});

afterEach(function() {
    if (!this.currentTest) {
        return;
    }

    const testName = this.currentTest.title,
        testState = this.currentTest.state;

    await browser.execute((testName, state) => {
        console.log('--- TEST CASE FINISHED --- >' + testName + '<');
        console.log('--- TEST CASE STATUS: ' + state);
    }, testName, testState);

    await server.call('e2e.debugLog', `--- TEST CASE FINISHED --- >${testName}<`);
    await server.call('e2e.debugLog', `--- TEST CASE STATUS: ${testState}`);

    if (this.currentTest.state !== 'passed') {
        await E2EGlobal.logTimestamp('TEST FAILED');
        console.log('!!! FAILED: ', this.currentTest.title, this.currentTest.state);
        console.log('!!! Saving POST-MORTEM SCREENSHOT:');
        console.log('!!! ', await E2EGlobal.saveScreenshot('FAILED_POST-MORTEM'));
    }
});
