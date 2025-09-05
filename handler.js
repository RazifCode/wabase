const pkg = require("baileys");

module.exports = {
    handler: async function (chatUpdate) {
        const m = chatUpdate.messages[0];

        const chatId = m.key.remoteJid;
        const id = m.key.id;
        const pushName = m.pushName || "null";
        const participant = m.key.participant;
        const isGroup = pkg.isJidGroup(chatId);
        const isPrivate = pkg.isJidUser(chatId);
        const isStory = pkg.isJidStatusBroadcast(chatId);
        const isChannel = pkg.isJidNewsletter(chatId);
        const sender = isChannel
            ? ""
            : isGroup || isStory
            ? participant
            : chatId;
        const type = pkg.getContentType(m.message);
        const body = type == "conversation" ? m.message?.conversation : "";

        console.log({
            chatId,
            id,
            pushName,
            participant,
            isGroup,
            isPrivate,
            isStory,
            isChannel,
            sender,
            type,
            body
        });
    },
    antiCall: async function (call) {
        console.log(call[0]);
        if (call[0].status == "offer") {
            await conn.rejectCall(call[0].id, call[0].from);
        }
    }
};
