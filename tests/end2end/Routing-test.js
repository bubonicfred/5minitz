import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'


describe('Routing', function () {
    const aProjectName = "E2E Topics";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    });

    after("clear database and login user", function () {
        await E2EApp.launchApp();
        await E2EApp.loginUser();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    
    it('ensures that following a URL to a meeting series will relocate to the requested series after sign-in', function () {
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        const url = await browser.getUrl();

        await E2EApp.logoutUser();

        await browser.url(url);

        await E2EApp.loginUser(0, false);

        let selector = 'h2.header';
        let header = (await browser.element(selector)).value.ELEMENT;
        let headerText = (await browser.elementIdText(header)).value;
        await expect(headerText).to.have.string("Meeting Series: " + aProjectName);
    });

    it('ensures that following a URL to a concrete minute will relocate to the requested minute after sign-in', function () {
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const url = await browser.getUrl();

        await E2EApp.logoutUser();

        await browser.url(url);

        await E2EApp.loginUser(0, false);

        let selector = 'h2.header';
        let header = (await browser.element(selector)).value.ELEMENT;
        let headerText = (await browser.elementIdText(header)).value;
        await expect(headerText).to.have.string("Minutes for " + aProjectName);
    });


    it('ensures that "legal notice" route shows expected text', function () {
        expect(await browser.isVisible("div#divLegalNotice"), "legal notice should be invisible").to.be.false;
        await browser.keys(['Escape']);   // close eventually open modal dialog
        await E2EGlobal.waitSomeTime();

        // Force to switch route
        await browser.url(E2EGlobal.SETTINGS.e2eUrl+"/legalnotice");
        await expect(await browser.getUrl(), "on 'legal notice' route").to.contain("/legalnotice");
        expect(await browser.isVisible("div#divLegalNotice"), "legal notice should be visible").to.be.true;
        await expect(await browser.getText("div#divLegalNotice"), "check text in legal notice route")
            .to.contain("THE DEMO SERVICE AVAILABLE VIA");
    });


    it('ensures that "legal notice" route is reachable on login screen via About dialog', function () {
        await E2EGlobal.waitSomeTime(1500);
        await browser.keys(['Escape']);   // close open edit meeting series dialog
        await E2EGlobal.waitSomeTime();
        await E2EApp.logoutUser();

        // open about dialog and trigger legal notice link
        await expect(await browser.getUrl(), "on normal route").not.to.contain("/legalnotice");
        await E2EGlobal.clickWithRetry("#btnAbout");
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry("#btnLegalNotice");
        await expect(await browser.getUrl(), "on 'legal notice' route").to.contain("/legalnotice");
    });
});
