const pkg = require("baileys");
const util = require('util')
const simple = require("./lib/simple.js");
require("./config.js");
const isNumber = x => typeof x === "number" && !isNaN(x);
module.exports = {
    handler: async function (chatUpdate) {
      console.log(db.data)
        this.queque = this.queque || [];
        if (!chatUpdate) return;
        let m = chatUpdate.messages[0];
        console.log(m)
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
                        isBanned: false,
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
                // tx help to fix this..
              for (let name in global.plugins) {
                let plugin = global.plugins[name]
                if (!plugin) continue
                if (plugin.disabled) continue
                if (typeof plugin.all === 'function') {
                    try {
                        await plugin.all.call(this, m, chatUpdate)
                    } catch (e) {
                        // if (typeof e === 'string') continue
                        console.error(e)
                    }
                }
                if (!opts['restrict']) if (plugin.tags && plugin.tags.includes('admin')) {
                    // global.dfail('restrict', m, this)
                    continue
                }
                const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
                let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
                let match = (_prefix instanceof RegExp ? // RegExp Mode?
                    [[_prefix.exec(m.text), _prefix]] :
                    Array.isArray(_prefix) ? // Array?
                        _prefix.map(p => {
                            let re = p instanceof RegExp ? // RegExp in Array?
                                p :
                                new RegExp(str2Regex(p))
                            return [re.exec(m.text), re]
                        }) :
                        typeof _prefix === 'string' ? // String?
                            [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                            [[[], new RegExp]]
                ).find(p => p[1])
                if (typeof plugin.before === 'function') if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    isBans,
                    chatUpdate,
                })) continue
                if (typeof plugin !== 'function') continue
                if ((usedPrefix = (match[0] || '')[0])) {
                    let noPrefix = m.text.replace(usedPrefix, '')
                    let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                    args = args || []
                    let _args = noPrefix.trim().split` `.slice(1)
                    let text = _args.join` `
                    command = (command || '').toLowerCase()
                    let fail = plugin.fail || global.dfail // When failed
                    let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
                        plugin.command.test(command) :
                        Array.isArray(plugin.command) ? // Array?
                            plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                                cmd.test(command) :
                                cmd === command
                            ) :
                            typeof plugin.command === 'string' ? // String?
                                plugin.command === command :
                                false

                    if (!isAccept) continue
                    m.plugin = name
                    if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                        let chat = global.db.data.chats[m.chat]
                        let user = global.db.data.users[m.sender]
                        if (name != 'unbanchat.js' && chat && chat.isBanned) return // Except this
                        if (name != 'unbanuser.js' && user && user.banned) return
                    }
                    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                        fail('owner', m, this)
                        continue
                    }
                    if (plugin.rowner && !isROwner) { // Real Owner
                        fail('rowner', m, this)
                        continue
                    }
                    if (plugin.owner && !isOwner) { // Number Owner
                        fail('owner', m, this)
                        continue
                    }
                    if (plugin.mods && !isMods) { // Moderator
                        fail('mods', m, this)
                        continue
                    }
                    if (plugin.premium && !isPrems) { // Premium
                        fail('premium', m, this)
                        continue
                    }
                    if (plugin.vip && !isVip) {
                        fail('vip', m, this)
                        continue
                    }
                    if (plugin.banned && !isBans) { // Banned
                        fail('banned', m, this)
                        continue
                    }
                    if (plugin.group && !m.isGroup) { // Group Only
                        fail('group', m, this)
                        continue
                    } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                        fail('botAdmin', m, this)
                        continue
                    } else if (plugin.admin && !isAdmin) { // User Admin
                        fail('admin', m, this)
                        continue
                    }
                    if (plugin.private && m.isGroup) { // Private Chat Only
                        fail('private', m, this)
                        continue
                    }
                    if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                        fail('unreg', m, this)
                        continue
                    }
                    m.isCommand = true
                    let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
                    if (xp > 9999999999999999999999) m.reply('Ngecit -_-') // Hehehe
                    else m.exp += xp
                    if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
                        this.sendMessage(m.chat, {
text: `Limit kamu habis! Beberapa command tidak dapat diakses!\n\nKamu bisa beli limit caranya:\nKetik .buy limit 5\nBisa juga mendapatkan free limit dengan mengetik .freelimit\nAtau mau limit unlimited? Silakan buy premium.`}, { quoted: m})
                     //   this.sendButton(m.chat, `Limit anda habis, silahkan beli melalui *${usedPrefix}buyall* atau *${usedPrefix}hadiah*`, author, null, [['Buy Limit', '/buyall'], ['Hadiah', '/hadiah']], m)
                        continue // Limit habis
                    }
                    if (plugin.level > _user.level) {
                        this.reply(m.chat, `diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${_user.level}`, m)
                        continue // If the level has not been reached
                    }
                    let extra = {
                        match,
                        usedPrefix,
                        noPrefix,
                        _args,
                        args,
                        body,
                        command,
                        text,
                        conn: this,
                        participants,
                        groupMetadata,
                        user,
                        bot,
                        isROwner,
                        isOwner,
                        isRAdmin,
                        isAdmin,
                        isBotAdmin,
                        isPrems,
                        isBans,
                        chatUpdate,
                    }
                    try {
                        await plugin.call(this, m, extra)
                        if (!isPrems) m.limit = m.limit || plugin.limit || true
                    } catch (e) {
                        // Error occured
                        m.error = e
                        console.error(e)
                        if (e) {
                            let text = util.format(e)
                            for (let key of Object.values(global.APIKeys))
                                text = text.replace(new RegExp(key, 'g'), 'Kemii')
                            if (e.name) for (let [jid] of global.owner.filter(([number, isCreator, isDeveloper]) => isDeveloper && number)) {
                                let data = (await conn.onWhatsApp(jid))[0] || {}
                                if (data.exists) conn.reply(data.jid, `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``, m)
                            }
                            conn.reply(m.chat, text, m)
                        }
                    } finally {
                        // m.reply(util.format(_user))
                        if (typeof plugin.after === 'function') {
                            try {
                                await plugin.after.call(this, m, extra)
                            } catch (e) {
                                console.error(e)
                            }
                        }
                       // if (m.limit) m.reply(+ m.limit + ' Limit terpakai')
                    }
                    break
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (opts['queque'] && m.text) {
                const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
                if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
            }
            //console.log(global.db.data.users[m.sender])
            let user, stats = global.db.data.stats
            if (m) {
                if (m.sender && (user = global.db.data.users[m.sender])) {
                    user.exp += m.exp
                    user.limit -= m.limit * 1
                }

                let stat
                if (m.plugin) {
                    let now = + new Date
                    if (m.plugin in stats) {
                        stat = stats[m.plugin]
                        if (!isNumber(stat.total)) stat.total = 1
                        if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                        if (!isNumber(stat.last)) stat.last = now
                        if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                    } else stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                    stat.total += 1
                    stat.last = now
                    if (m.error == null) {
                        stat.success += 1
                        stat.lastSuccess = now
                    }
                }
            }

            if (opts['autoread'])
            await conn.readMessages([m.key])
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

global.dfail = (type, m, conn) => {
    let imgr = 'https://telegra.ph/file/0b32e0a0bb3b81fef9838.jpg'
    let msg = {
    rowner: 'Maaf, command ini hanya boleh digunakan oleh *Developer* 🍪.',
    owner: 'Maaf, command ini hanya boleh digunakan oleh *Owner* 🍯.',
    mods: 'Maaf, command ini hanya boleh digunakan oleh *Moderator* 🥧.',
    premium: 'Maaf, command ini hanya untuk *pengguna premium* 🍪.',
    group: 'Maaf, command ini hanya boleh digunakan dalam *Group* 🍯.',
    vip: 'Maaf, command ini hanya untuk *Pengguna VIP* 🥧.',
    private: 'Maaf, command ini hanya boleh digunakan dalam *Chat Private* 🍪.',
    admin: 'Maaf, command ini hanya untuk *Admin* 🍯.',
    botAdmin: 'Jadikan *Bot* sebagai *Admin* 🥧 untuk menggunakan command ini.',
    restrict: 'Ciri ini telah *dinonaktifkan* 🍪.'
}[type]
    if (msg) return conn.reply(m.chat, msg, m)
    let msgg = {
        unreg: `Hallo *@${m.sender.split("@")[0]}*, sila daftar ke database terlebih dahulu jika ingin menggunakan fitur ini\n\n> *manual*: .daftar nama.umur\n> *otomatis*: @verify`
    }[type]
    if (msgg) return conn.reply(m.chat, msgg, m, {
contextInfo: {
mentionedJid: [m.sender],
externalAdReply: {
title: namebot,
thumbnailUrl: thumb,
mentionedJid: [m.sender], 
mediaType: 1,
renderLargerThumbnail: true
}}})
    let msg3 = {
        zevent: `${nmsr}\n\nPerintah ini hanya dapat digunakan saat event*!`
    }[type]
    if (msg3) return m.reply(msg3)
}