const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminProductForm.addProductBtn"),
  async (ctx) => {
    return await ctx.scene.enter("AddProductWizard");
  }
);
