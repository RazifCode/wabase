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

    return m;
};
