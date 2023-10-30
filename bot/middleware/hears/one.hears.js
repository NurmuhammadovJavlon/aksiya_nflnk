const bot = require("../../connection/token.connection");

module.exports = bot.hears("one", async (ctx) => ctx.scene.enter("oneWizard"));