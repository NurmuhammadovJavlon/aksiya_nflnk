const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminTextsForm.firstEventTextBtn"),
  async (ctx) => {
    try {
      return ctx.scene.enter("FirstInfoWizard");
    } catch (error) {
      console.log(error);
    }
  }
);
