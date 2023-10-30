const bot = require("../../connection/token.connection");

module.exports = bot.hears("two", async (ctx) => ctx.scene.enter("oneWizard"));