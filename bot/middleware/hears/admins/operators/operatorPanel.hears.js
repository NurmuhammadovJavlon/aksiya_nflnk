const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateOperatorPanelKeys = require("../../../../functions/keyboards/admins/operatorMenu.keyboard");

module.exports = bot.hears(
  match("OperatorPanel.operatorPanelBtn"),
  async (ctx) => {
    try {
      const operatorPanel = {
        text: ctx.i18n.t("OperatorPanel.operatorPanelMsg"),
        buttons: await generateOperatorPanelKeys(ctx),
      };
      await ctx.reply(operatorPanel.text, operatorPanel.buttons);
    } catch (error) {
      console.log(error);
    }
  }
);
