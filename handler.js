const pkg = require("baileys");
const simple = require("./lib/simple.js");

module.exports = {
    handler: async function (chatUpdate) {
        this.queque = this.queque || [];
        if (!chatUpdate) return;
        let m = chatUpdate.messages[0];
        if (!m) return;
        try {
          m = simple.smsg(this, m) || m;
          if (!m) return;
          console.log(m);
        } catch (err) {
          console.error(err)
        }
        
        
    },
    antiCall: async function (call) {
        console.log(call[0]);
        if (call[0].status == "offer") {
            await conn.rejectCall(call[0].id, call[0].from);
        }
    }
};
