import run from "./lib/task.js";
import { createInterface, on } from "readline";
function logTask(taskname) {
  return (data) => {
    process.stdout.write(`${taskname}: ${data}`);
  };
}

const tasks = [
  run("npm", ["run", "test:end2end:ldap"], logTask("ldap")),
  run("npm", ["run", "test:end2end:meteor"], logTask("meteor")),
];

function shutdown() {
  console.log("Kill all running tasks");

  const done = [].fill(false, 0, tasks.length);
  tasks.forEach((task, index) => {
    task.kill("SIGINT", (error) => {
      if (error) {
        console.warn("ERROR: ", error);
      }

      done[index] = true;
      if (!done.includes(false)) {
        throw new Error("All tasks killed, exiting.");
      }
    });
  });
}

if (process.platform === "win32") {
  createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  on("SIGINT", shutdown);
}

process.on("uncaughtException", shutdown);
process.on("SIGINT", shutdown);
