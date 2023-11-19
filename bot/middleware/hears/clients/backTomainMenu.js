const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateMainMenuKeys = require("../../../functions/keyboards/main-menu.keyboard");

module.exports = bot.hears(match("backToMainMenuBtn"), async (ctx) => {
  const promotionMenu = {
    text: ctx.i18n.t("choosePromotion"),
    buttons: await generateMainMenuKeys(ctx),
  };
  await ctx.reply(promotionMenu.text, promotionMenu.buttons);
  return ctx.scene?.leave();
});
