const pkg = require("baileys");
const util = require("util");
const simple = require("./lib/simple.js");
require("./config.js");
const isNumber = x => typeof x === "number" && !isNaN(x);
module.exports = {
    handler: async function (chatUpdate) {
        console.log(db.data);
        this.queque = this.queque || [];
        if (!chatUpdate) return;
        let m = chatUpdate.messages[0];
        console.log(m);
        if (!m) return;
        try {
            m = simple.smsg(this, m) || m;
            if (!m) return;

            try {
                let user = global.db.data.users[m.sender];
                if (typeof user !== "object")
                    global.db.data.users[m.sender] = {};
                if (user) {
                    if (!("banned" in user)) user.banned = false;
                    if (!("registered" in user)) user.registered = false;
                    if (!("premium" in user)) user.premium = false;
                    if (!("vip" in user)) user.vip = false;
                    if (!isNumber(user.money)) user.money = 10000;
                    if (!isNumber(user.afk)) user.afk = -1;
                    if (!("afkReason" in user)) user.afkReason = "";
                    if (user.registered) {
                        if (!("name" in user)) user.name = m.name;
                        if (!isNumber(user.age)) user.age = -1;
                        if (!usNumber(user.regTime)) user.regTime = -1;
                    }
                    if (!isNumber(user.exp)) user.exp = 0;
                    if (!isNumber(user.level)) user.level = 1;
                    if (!("role" in user)) user.role = "Beginner";
                    if (!isNumber(user.limit)) user.limit = 50;
                } else
                    global.db.data.users[m.sender] = {
                        banned: false,
                        registered: false,
                        premium: false,
                        vip: false,
                        money: 10000,
                        afk: -1,
                        afkReason: "",
                        name: m.name,
                        age: -1,
                        regTime: -1,
                        exp: 0,
                        level: 1,
                        limit: 50
                    };

                let chat = global.db.data.chats[m.chat];
                if (typeof chat !== "object") global.db.data.chats[m.chat] = {};
                if (chat) {
                    if (!("isBanned" in chat)) chat.isBanned = false;
                    // fitur welcome tidak sigunakan. error. jika mau tambah, saya sudh sediakan dibawah, anda boleh perbaiki.
                } else {
                    global.db.data.chats[m.chat] = {
                        isBanned: false
                    };
                }
                let settings =
                    global.db.data.settings[conn.decodeJid(this.user.id)];
                if (typeof settings !== "object")
                    global.db.data.settings[conn.decodeJid(this.user.id)] = {};
                if (settings) {
                    if (!("self" in settings)) settings.self = false;
                    if (!("autoread" in settings)) settings.autoread = false;
                    if (!("autorestart" in settings))
                        settings.autorestart = true;
                    if (!("gconly" in settings)) settings.gconly = false;
                    if (!("restartDB" in settings)) settings.restartDB = 0;
                    if (!("anticall" in settings)) settings.anticall = true;
                    if (!("clear" in settings)) settings.clear = true;
                } else
                    global.db.data.settings[conn.decodeJid(this.user.id)] = {
                        self: false,
                        autoread: false,
                        autorestart: true,
                        restartDB: 0,
                        gconly: false,
                        anticall: true,
                        clear: true
                    };
            } catch (err) {
                console.error(err);
            }

            if (
                !m.fromMe &&
                db.data.settings[conn.decodeJid(this.user.id)]?.self
            )
                return;

            if (
                db.data.settings[conn.decodeJid(this.user.id)]?.gconly &&
                !m.fromMe &&
                !m.chat?.endsWith("@g.us") &&
                db.data.users[m.sender]?.premium &&
                db.data.users[m.sender]?.vip
            ) {
                return conn.sendMessage(
                    m.chat,
                    {
                        text: "maaf, gconly diaktifkan, sila chat di grup"
                    },
                    { quoted: m ? m : null }
                );
            }

            if (typeof m.text == "string") m.text = "";

            const body = typeof m.text == "string" ? m.text : false;

            const isROwner = global.owner
                .map(([number, isCreator, isDeveploper]) =>
                    number.replace(/[^0-9]/g, "")
                )
                .flatMap(number => [
                    number + "@lid",
                    number + "@s.whatsapp.net"
                ])
                .includes(m.sender);

            const isOwner = m.fromMe || isROwner;
            const isPrems = isROwner || db.data.users[m.sender].premium;
            const isVip = isROwner || db.data.users[m.sender].vip;
            const isBans = db.data.users[m.sender].banned;

            const groupMetadata = (await conn.groupMetadata(m.chat)) || [];
            const participants = groupMetadata.participants || [];
            const user =
                participants.find(u => conn.decodeJid(u.id) === m.sender) || {};
            const isRAdmin = (user && user.admin == "superadmin") || false;
            const isAdmin = (user && user.admin == "admin") || false;
            const isBotAdmin =
                (user &&
                    (user.jid == conn.decodeJid(this.user.id) ||
                        user.id == conn.decodeJid(this.user.lid)) &&
                    user.admin == "admin") ||
                false;
        } catch (err) {
            console.error(err);
        }
    },
    antiCall: async function (call) {
        console.log(call[0]);
        if (db.data.settings[conn.decodeJid(this.user.id)]?.anticall) return;
        if (call[0].status == "offer") {
            await conn.rejectCall(call[0].id, call[0].from);
        }
    }
};
