import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import {E2EGlobal} from "./helpers/E2EGlobal";


describe('MeetingSeriesSearch', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    const bootstrapSeries = async (count = 5) => {
        const initialCount = await E2EMeetingSeries.countMeetingSeries();
        if (initialCount !== count) {
            const startIndex = initialCount + 1;
            for (let i = startIndex; i <= count; i++) {
                const aProjectName = "E2E Project" + i;
                const aMeetingName = "Meeting Name #" + i;
                await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
            }
        }
    };

    it('can create four meeting series and is not able to search', function () {
        await bootstrapSeries(4);
        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(4);
        expect(await E2EMeetingSeries.visibleMeetingSeriesSearch()).to.be.false;
    });

    it('can create the fith meeting series and now is able to search', function () {
        await bootstrapSeries();
        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(5);
        expect(await E2EMeetingSeries.visibleMeetingSeriesSearch()).to.be.true;
    });

    it('can search for name', function () {
        await bootstrapSeries();
        await E2EMeetingSeries.searchMeetingSeries('#3');
        await expect(await E2EMeetingSeries.countMeetingSeries(false)).to.equal(1);
    });

    it('can search for project', function () {
        await bootstrapSeries();
        await E2EMeetingSeries.searchMeetingSeries('Project3');
        await expect(await E2EMeetingSeries.countMeetingSeries(false)).to.equal(1);
    });

    it('can search with many parameters', function () {
        await bootstrapSeries();
        await E2EMeetingSeries.searchMeetingSeries('#1 Project3 5');
        await expect(await E2EMeetingSeries.countMeetingSeries(false)).to.equal(0);
    });

    it('can notice if nothing is found', function () {
        await bootstrapSeries();
        await E2EMeetingSeries.searchMeetingSeries('Project99');
        expect(await E2EMeetingSeries.visibleWarning(false)).to.be.true;
    });
});
