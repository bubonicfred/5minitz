import DDPClient from "meteor-sdk";

const ddpclient = new DDPClient({
  host: "localhost",
  port: 3100,
  ssl: false,
  autoReconnect: true,
  autoReconnectTimer: 500,
  maintainCollections: true,
  ddpVersion: "1",
  useSockJs: true,
});

const connect = () => {
  return new Promise((resolve, reject) => {
    ddpclient.connect((error) => {
      if (error) {
        console.error(`Error connecting: ${error}`);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const close = () => {
  ddpclient.close();
};

const call = (...args) => {
  return new Promise((resolve, reject) => {
    ddpclient.call(args[0], args.slice(1), (err, result) => {
      if (err) {
        console.error(`Error calling method: ${err}`);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const server = {
  connect: () => connect(),
  close: () => close(),
  call: (...args) => call(...args),
};

global.server = server;
export default server;
