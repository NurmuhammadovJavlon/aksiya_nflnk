const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const { Markup } = require("telegraf");
const {
  GetLatestEventInfo,
} = require("../../../common/sequelize/eventInfo.sequelize");
// const generatePromotionButtons = require("../../functions/keyboards/promotion.keyboards");

module.exports = bot.hears(match("firstPromotionBtn"), async (ctx) => {
  ctx.session.prType = 1;
  const prInfo = await GetLatestEventInfo();
  const prMsg = ctx.i18n.locale() === "uz" ? prInfo.text_uz : prInfo.text_ru;

  const promotionMenu = {
    text: ctx.i18n.t("firstPrInfo"),
    buttons: [
      [Markup.button.text(ctx.i18n.t("participateBtn"))],
      [Markup.button.text(ctx.i18n.t("backToPrMenuBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ],
  };

  if (!prInfo) {
    await ctx.reply(promotionMenu.text, promotionMenu.buttons);
    return;
  }

  await ctx.replyWithPhoto(prInfo.image, {
    parse_mode: "HTML",
    caption: prMsg,
    reply_markup: {
      keyboard: promotionMenu.buttons,
      resize_keyboard: true,
    },
  });
  //   console.log(ctx.session);
});
