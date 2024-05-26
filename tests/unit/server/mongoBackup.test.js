import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const spawn = sinon.stub().returns({ on: sinon.spy() });

const { backupMongo } = proxyquire("../../../server/mongoBackup", {
  child_process: { spawn, "@noCallThru": true },
});

// skipcq: JS-0241
describe("mongoBackup", function () {
  // skipcq: JS-0241
  describe("#backupMongo", function () {
    // skipcq: JS-0241
    beforeEach(function () {
      spawn.resetHistory();
    });
    // skipcq: JS-0241
    it("uses mongodump to create a backup", function () {
      backupMongo(
        "mongodb://user:password@localhost:1234/database",
        "outputdir",
      );

      const firstCall = spawn.args[0];
      const command = firstCall[0];
      const parameters = firstCall[1].join(";");

      expect(command).to.equal("mongodump");
      expect(parameters).to.equal(
        "-h;localhost:1234;-u;user;-p;password;-d;database;-o;outputdir",
      );
    });
  });
});
