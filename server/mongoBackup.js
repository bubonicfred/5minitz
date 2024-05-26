import { spawn } from "child_process";
import mongoUri from "mongo-uri";

/**
 * Generates an array of parameters for MongoDB dump command based on the
 * provided URI and path.
 *
 * @param {object} uri - The MongoDB URI object.
 * @param {string} path - The path where the dump will be saved.
 * @returns {string[]} An array of parameters for the MongoDB dump command.
 */
function dumpParameters(uri, path) {
  const params = [];

  let host = uri.hosts[0];
  if (uri.ports[0]) {
    host += `:${uri.ports[0]}`;
  }

  params.push("-h", host);

  if (uri.username) {
    params.push("-u", uri.username, "-p", uri.password);
  }

  params.push("-d", uri.database, "-o", path);

  return params;
}

/**
 * Backs up MongoDB to a specified path.
 *
 * @param {string} mongoUrl - The URL of the MongoDB instance.
 * @param {string} path - The path where the backup will be saved.
 * @returns {Promise<void>} A promise that resolves when the backup is complete.
 */
export const backupMongo = (mongoUrl, path) => {
  console.log(`Backing up mongodb ${mongoUrl} to ${path}`);

  const uri = mongoUri.parse(mongoUrl);
  const parameters = dumpParameters(uri, path);
  const command = "mongodump";

  return new Promise((resolve, reject) => {
    const dumpProcess = spawn(command, parameters);

    dumpProcess.on("error", (error) => {
      console.error(`Error: ${error}`);
      reject(error);
    });

    dumpProcess.on("close", (code) => {
      console.log(`mongodump ended with exit code ${code}`);
      resolve();
    });
  });
};
