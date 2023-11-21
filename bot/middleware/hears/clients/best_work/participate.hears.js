const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const { Markup } = require("telegraf");
// const generatePromotionButtons = require("../../functions/keyboards/promotion.keyboards");

module.exports = bot.hears(match("secondPromotionBtn"), async (ctx) => {
  ctx.session.prType = 2;
  const promotionMenu = {
    text: ctx.i18n.t("firstPrInfo"),
    buttons: Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("participateBtn"))],
      [Markup.button.text(ctx.i18n.t("backToPrMenuBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ]).resize(),
  };
  await ctx.reply(promotionMenu.text, promotionMenu.buttons);
  await ctx.scene.enter("BestWorkPromotionWizard");
});
