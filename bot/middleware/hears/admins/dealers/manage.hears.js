const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminDealerForm.manageDealersBtn"),
  async (ctx) => {
    return await ctx.scene.enter("ManageDealersWizard");
  }
);
