const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateProductAdminKeys = require("../../../../functions/keyboards/admins/product.keyboard");
const generateOrderAdminKeys = require("../../../../functions/keyboards/admins/order.keyboard");

module.exports = bot.hears(match("Admin.ordersBtn"), async (ctx) => {
  try {
    const orderPanel = {
      text: ctx.i18n.t("AdminOrderForm.panelTxt"),
      buttons: await generateOrderAdminKeys(ctx),
    };
    await ctx.reply(orderPanel.text, orderPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
