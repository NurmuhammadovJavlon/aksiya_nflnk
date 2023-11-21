const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const { Markup } = require("telegraf");
// const generatePromotionButtons = require("../../functions/keyboards/promotion.keyboards");

module.exports = bot.hears(match("participateBtn"), async (ctx) => {
  if (ctx.session.prType === 1) {
    return ctx.scene.enter("FirstEventWizard");
  } else if (ctx.session.prType === 2) {
    await ctx.scene.enter("BestWorkPromotionWizard");
  }
});
