const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateTextsAdminKeys = require("../../../../functions/keyboards/admins/texts.keyboard");

module.exports = bot.hears(match("Admin.allTextsBtn"), async (ctx) => {
  try {
    const textsPanel = {
      text: ctx.i18n.t("AdminTextsForm.panelTxt"),
      buttons: await generateTextsAdminKeys(ctx),
    };
    await ctx.reply(textsPanel.text, textsPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
