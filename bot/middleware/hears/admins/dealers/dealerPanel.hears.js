const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateDealerAdminKeys = require("../../../../functions/keyboards/admins/dealer.keyboard");

module.exports = bot.hears(match("Admin.dealersBtn"), async (ctx) => {
  try {
    const regionPanel = {
      text: ctx.i18n.t("AdminDealerForm.panelTxt"),
      buttons: await generateDealerAdminKeys(ctx),
    };
    await ctx.reply(regionPanel.text, regionPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
