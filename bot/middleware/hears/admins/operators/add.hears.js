const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminOperatorForm.addOperatorBtn"),
  async (ctx) => {
    return await ctx.scene.enter("OperatorWizard");
  }
);
