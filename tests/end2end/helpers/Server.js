const DDPClient = require('ddp');
// const Future = require('fibers/future');

const ddpclient = new DDPClient({
    host: 'localhost',
    port: 3100,
    ssl: false,
    autoReconnect: true,
    autoReconnectTimer: 500,
    maintainCollections: true,
    ddpVersion: '1',
    useSockJs: true
});

async function connect() {
    try {
    const future = await ddpclient.connect() 
    return future
    }
    catch(err){  // this will be able to capture any errors that happen inside our async function
            console.error(err)
    }    
}

function close() {
    ddpclient.close();
}

async function call() {
    let future
    try {
    future = await ddpclient.call(
        arguments[0],
        [].slice.call(arguments, 1),
    );
           }
    catch(err) {  // this will be able to capture any errors that happen inside our async function
        console.error(err);
              }
              return future;
}

const connect = await connect()
const close = close()
const call = await call((this, arguments))
const server = [connect, close, call];
Promise.any(server).then((value) => console.log(value));

global.server = server;
module.exports = server;