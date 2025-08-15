(async () => {
    const {
        default: makeWaSocket,
        useMultiFileAuthState,
        DisconnectReason
    } = require("baileys");

    const question = text => {
        let rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise(resolve => {
            rl.question(text, resolve);
        });
    };

    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const connectionOptions = {
        logger: require("pino")({ level: "silent" }),
        auth: state
    };

    global.conn = makeWaSocket(connectionOptions);

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // require("qrcode-terminal").generate(qr, { small: true });
            let waNumber = await question("Start with Your Number: ");
            let code = await conn.requestPairingCode(waNumber);
            console.log("your pairing code: " + code)
        }

        if (connection == "open") {
            console.log("connected: " + conn.user.id);
        }
        if (connection == "close") {
            console.log("restart bot");
        }

        if (
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output &&
            lastDisconnect.error.output.statusCode !==
                DisconnectReason.loggefOut
        ) {
            console.log(reload(true));
        }
    }

    reload = function (restartConn) {
        if (restartConn) {
            try {
                conn.ws.close();
            } catch {}
            conn = { ...conn, ...makeWaSocket(connectionOptions) };
        }

        conn.connectionUpdate = connectionUpdate.bind(conn);
        conn.saveCreds = saveCreds.bind(conn);

        conn.ev.on("creds.update", conn.saveCreds);
        conn.ev.on("connection.update", conn.connectionUpdate);
        return true;
    };
    reload();
})();
                
