(async () => {
    const {
        default: makeWaSocket,
        useMultiFileAuthState,
        DisconnectReason
    } = require("baileys");
    const chalk = require("chalk");
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
            const { request } = await require("inquirer").prompt([
                {
                    type: "list",
                    name: "request",
                    message: "Ingin menggunakan login method?",
                    choices: [
                        { name: "QrCode", value: "qr" },
                        { name: "PairingCode", value: "pairing" }
                    ]
                }
            ]);

            if (request == "qr") {
                console.log(chalk.cyan("\nScan QR dibawah"));
                require("qrcode-terminal").generate(qr, { small: true });
            }
            if (request == "pairing") {
                const { waNumber } = await require("inquirer").prompt([
                    {
                        tpye: "input",
                        name: "waNumber",
                        message: chalk.blue(
                            "Masukkan nombor whatsapp anda:"
                        ),
                        validate: input => {
                            if (!/^\d+$/.test(input)) {
                                return "Masukkan nombot sahaja";
                            }
                            if (input.length < 8) {
                                return "Nombor terlalu pendek";
                            }
                            return true;
                        }
                    }
                ]);
                const code = await conn.requestPairingCode(waNumber);
                console.log(
                    chalk.green("Your Pairing Code: " + chalk.bold(code))
                );
            }
        }

        if (connection == "open") {
            console.log(
                chalk.greenBright("Connected as: " + chalk.yellow(conn.user.id))
            );
        }
        if (connection == "close") {
            console.log(chalk.red("Connection Closed, restarting Bor..."));
        }

        if (
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output &&
            lastDisconnect.error.output.statusCode !==
                DisconnectReason.loggefOut
        ) {
            console.log(chalk.red("Reloading Bot..."));
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
