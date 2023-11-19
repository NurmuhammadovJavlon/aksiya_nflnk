const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateRegionAdminKeys = require("../../../../functions/keyboards/admins/region.keyboard");

module.exports = bot.hears(match("Admin.regionsBtn"), async (ctx) => {
  try {
    const regionPanel = {
      text: ctx.i18n.t("AdminRegionForm.panelTxt"),
      buttons: await generateRegionAdminKeys(ctx),
    };
    await ctx.reply(regionPanel.text, regionPanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
