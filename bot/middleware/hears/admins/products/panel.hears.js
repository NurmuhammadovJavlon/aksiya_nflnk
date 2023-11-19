const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateProductAdminKeys = require("../../../../functions/keyboards/admins/product.keyboard");

module.exports = bot.hears(match("Admin.productsBtn"), async (ctx) => {
  try {
    const productPanel = {
      text: ctx.i18n.t("AdminProductForm.panelTxt"),
      buttons: await generateProductAdminKeys(ctx),
    };
    await ctx.reply(productPanel.text, productPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
