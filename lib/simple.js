const pkg = require("baileys");
const {
    default: makeWaSocket,
    isJidUser,
    isJidGroup,
    isJidStatusBroadcast,
    isJidNewsletter,
    getContentType,
    jidDecode,
    proto,
    makeWALegacySocket,
    areJidsSameUser
} = pkg;

exports.makeWASocket = (connectionOptions, options = {}) => {
    const conn = makeWALegacySocket || makeWaSocket(connectionOptions);

    conn.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return decode.user && decode.server
                ? decode.user + "@" + decode.server
                : jid;
        }
        return jid;
    };

    conn.parseMention = (text = "") => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
            v => v[1] + "@s.whatsapp.net",
            v[1] + "@lid"
        );
    };
    return conn;
};

exports.smsg = (conn, m, hasParent) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    m = M.fromObject(m);

    m.chatId = m.key.remoteJid;
    m.id = m.key.id;
    m.participant = m.key.participant || m.key.participantPn;
    m.chat = m.chatId || m.message?.senderKeyDistributionMessage?.groupId || "";
    m.isGroup = m.chat?.endsWith("@g.us") || isJidGroup(m.chat);
    m.isPrivate =
        m.chat?.endsWith("@lid") ||
        m.chat?.endsWith("@s.whatsapp.net") ||
        isJidUser(m.chat);
    m.isStory =
        m.chat?.startsWith("status@broadcast") || isJidStatusBroadcast(m.chat);
    m.isChannel = m.chat?.endsWith("@newsletter") || isJidNewsletter(m.chat);
    m.sender = conn.decodeJid(
        (m.key.fromMe && conn.user.id) ||
            m.participant ||
            m.key.participant ||
            m.chat
    );
    m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id);

    if (m.message) {
        let mtype = Object.keys(m.message);
        m.mtype =
            (!["messageContextInfo"].includes(mtype[0]) && mtype[0]) ||
            (mtype.length >= 3 &&
                mtype[1] !== "messageContextInfo" &&
                mtype[1]) ||
            mtype[mtype.length - 1];
        m.msg = m.message[m.mtype];

        if (m.chat == m.isStory && ["protocolMessage"].includes(m.mtype))
            m.chat = (m.chatId !== m.isStory && m.chatId) || m.sender;

        m.text =
            m.msg?.text || m.msg?.caption || m.msg?.contentText || m.msg || "";

        if (typeof m.text !== "string") {
            if (
                [
                    "protocolMessage",
                    "messageContextInfo",
                    "stickerMessage",
                    "audioMessage"
                ].includes(m.mtype)
            ) {
                m.text = "";
            } else {
                m.text =
                    m.text?.selectDisplayText ||
                    m.text?.hydratedTemplate?.hydratedContentText ||
                    m.text;
            }
        }
        m.name = m.pushName || "nullName";
    }

    return m;
};
