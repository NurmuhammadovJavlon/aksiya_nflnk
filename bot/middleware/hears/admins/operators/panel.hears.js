const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateOperatorAdminKeys = require("../../../../functions/keyboards/admins/operator.keyboard");

module.exports = bot.hears(match("Admin.operatorsBtn"), async (ctx) => {
  try {
    const operatorPanel = {
      text: ctx.i18n.t("AdminOrderForm.panelTxt"),
      buttons: await generateOperatorAdminKeys(ctx),
    };
    await ctx.reply(operatorPanel.text, operatorPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
