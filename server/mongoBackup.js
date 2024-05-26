import { spawn } from "child_process";
import mongoUri from "mongo-uri";

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
