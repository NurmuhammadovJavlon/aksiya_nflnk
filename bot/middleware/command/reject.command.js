const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");

module.exports = bot.command("reject", async (ctx) => {
  try {
    return ctx.scene.enter("RejectClientVerificationWizard");
  } catch (e) {
    console.log(e);
  }
});
