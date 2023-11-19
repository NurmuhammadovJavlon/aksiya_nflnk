const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generatePromotionButtons = require("../../../functions/keyboards/promotion.keyboards");
// const generatePromotionButtons = require("../../functions/keyboards/promotion.keyboards");

module.exports = bot.hears(match("backToPrMenuBtn"), async (ctx) => {
  const promotionMenu = {
    text: ctx.i18n.t("choosePromotion"),
    buttons: generatePromotionButtons(ctx),
  };
  await ctx.reply(promotionMenu.text, promotionMenu.buttons);
  return ctx.scene?.leave();
});
