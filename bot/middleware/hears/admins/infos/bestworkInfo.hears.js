const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminTextsForm.bestWorkInfoBtn"),
  async (ctx) => {
    try {
      return ctx.scene.enter("BestWorkInfoWizard");
    } catch (error) {
      console.log(error);
    }
  }
);
