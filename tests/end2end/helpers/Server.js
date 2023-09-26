const DDPClient = require('ddp');
const Future = require('fibers/future');

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
    const future = new Future();
    await ddpclient.connect(function (error) {
        if (error) {
            await future.throw(error);
        }

        await future.return();
    });

    return future;
}

async function close() {
    await ddpclient.close();
}

async function call() {
    const future = new Future();

    await ddpclient.call(
        arguments[0],
        [].slice.call(arguments, 1),
        function (err, result) {
            if (err) {
                await future.throw(err);
            }
            await future.return(result);
        }
    );

    return future;
}

const server = {
    connect: function () {
        return (await connect()).wait();
    },

    close: function () {
        await close();
    },

    call: function () {
        return (await call.apply(this, arguments)).wait();
    }
};

global.server = server;
module.exports = server;