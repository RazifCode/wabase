let handler = async (m, { conn }) => {
    const response = await fetch("https://techy-api.vercel.app/api/json");
    const data = await response.json();
    await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } });
    await conn.sendMessage(
        m.chat,
        {
            text: data.message,
        },
        { quoted: m }
    );
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
};
handler.command = ["bot"];

module.exports = handler;
