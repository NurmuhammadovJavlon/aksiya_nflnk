const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateClientAdminKeys = require("../../../../functions/keyboards/admins/clients.keyboard");

module.exports = bot.hears(match("Admin.checkClientsBtn"), async (ctx) => {
  try {
    const orderPanel = {
      text: ctx.i18n.t("AdminOrderForm.panelTxt"),
      buttons: await generateClientAdminKeys(ctx),
    };
    await ctx.reply(orderPanel.text, orderPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
