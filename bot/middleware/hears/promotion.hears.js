const bot = require("../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generatePromotionButtons = require("../../functions/keyboards/promotion.keyboards");

module.exports = bot.hears(match("promotionBtn"), async (ctx) => {
  try {
    const promotionMenu = {
      text: ctx.i18n.t("choosePromotion"),
      buttons: generatePromotionButtons(ctx),
    };
    await ctx.reply(promotionMenu.text, promotionMenu.buttons);
  } catch (error) {
    console.log(error);
  }
});
