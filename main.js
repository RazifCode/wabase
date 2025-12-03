(async () => {
    const {
        default: makeWaSocket,
        useMultiFileAuthState,
        DisconnectReason
    } = require("baileys");
    const chalk = require("chalk");
    const fs = require("fs");
    const { Low, JSONFile } = require("lowdb");

    const question = text => {
        let rl = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise(resolve => {
            rl.question(text, resolve);
        });
    };

    opts = new Object(
        require("yargs")(process.argv.slice(2)).exitProcess(false).parse()
    );

    //db = JSON.parse(fs.readFileSync("./database.json"));
    db = new Low(new JSONFile("database.json"));

    loadDatabase = async function loadDatabase() {
        if (db.READ)
            return new Promise(resolve => {
                setInterval(function () {
                    !db.READ
                        ? (clearInterval(conn),
                          resolve(db.data == null ? loadDatabase() : db.data))
                        : null;
                }, 1 * 1000);
            });
        if (db.data !== null) return;
        db.READ = true;
        await db.read();
        db.READ = false;
        db.data = {
            users: {},
            chats: {},
            settings: {},
            stats:{},
            ...(db.data || {})
        };
        db.chain = require("lodash").chain(db.data);
    };
    loadDatabase();

    const { state, saveCreds } = await useMultiFileAuthState("auth");

    if (db) {
        // setInterval(async () => {
        if (db.data) await db.write();
        // }, 30 * 1000);
    }
    const connectionOptions = {
        logger: require("pino")({ level: "silent" }),
        auth: state
    };

    global.conn = require("./lib/simple.js").makeWASocket(connectionOptions);

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            try {
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
            } catch (err) {
                console.error("error use qr in connection: " + err + "\n\n");
                console.log(
                    chalk.green("use a simple source qrCode\nHere this: \n\n")
                );
                await require("qrcode-terminal").generate(qr, { small: true });
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

        if (db.data == null) await loadDatabase();
    }

    const handler = require("./handler.js");
    reload = function (restartConn) {
        if (restartConn) {
            try {
                conn.ws.close();
            } catch {}
            conn = { ...conn, ...makeWaSocket(connectionOptions) };
        }

        conn.connectionUpdate = connectionUpdate.bind(conn);
        conn.saveCreds = saveCreds.bind(conn);
        conn.handler = handler.handler.bind(conn);
        conn.antiCall = handler.antiCall.bind(conn);

        conn.ev.on("creds.update", conn.saveCreds);
        conn.ev.on("connection.update", conn.connectionUpdate);
        conn.ev.on("messages.upsert", conn.handler);
        conn.ev.on("call", conn.antiCall);

        return true;
    };
    reload();
})();
