const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const { Markup } = require("telegraf");
// const generatePromotionButtons = require("../../functions/keyboards/promotion.keyboards");

module.exports = bot.hears(match("participateBtn"), async (ctx) => {
  if (!ctx.session.prType) {
    return;
  }
  await ctx.scene.enter("FirstEventWizard");
});
