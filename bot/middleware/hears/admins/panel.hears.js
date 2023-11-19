const bot = require("../../../connection/token.connection");
const generateAdminKeys = require("../../../functions/keyboards/admin.keyboard");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  [match("adminPanelBtn"), match("Admin.backToAdminPanel")],
  async (ctx) => {
    const promotionMenu = {
      text: ctx.i18n.t("choosePromotion"),
      buttons: await generateAdminKeys(ctx),
    };
    await ctx.reply(promotionMenu.text, promotionMenu.buttons);
  }
);
