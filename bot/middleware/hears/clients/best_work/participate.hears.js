const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const { Markup } = require("telegraf");
const {
  CheckUserWorks,
} = require("../../../../common/sequelize/bestwork.sequelize");
const { getUser } = require("../../../../common/sequelize/user.sequelize");
const {
  GetLatestBestWorkInfo,
} = require("../../../../common/sequelize/bestworkInfo.sequelize");

module.exports = bot.hears(match("secondPromotionBtn"), async (ctx) => {
  ctx.session.prType = 2;
  const user = await getUser(String(ctx.chat.id));
  const works = await CheckUserWorks(user?.id);
  const prInfo = await GetLatestBestWorkInfo();
  const prMsg = ctx.i18n.locale() === "uz" ? prInfo.text_uz : prInfo.text_ru;
  const promotionMenu = {
    text: ctx.i18n.t("firstPrInfo"),
    buttons: [
      [Markup.button.text(ctx.i18n.t("participateBtn"))],
      [Markup.button.text(ctx.i18n.t("backToPrMenuBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ],
  };

  if (works.totalItems < 3) {
    if (!prInfo) {
      await ctx.reply(
        promotionMenu.text,
        Markup.keyboard(promotionMenu.buttons).resize()
      );
    }
    await ctx.replyWithPhoto(prInfo.image, {
      parse_mode: "HTML",
      caption: prMsg,
      reply_markup: {
        keyboard: promotionMenu.buttons,
        resize_keyboard: true,
      },
    });
    return ctx.scene.enter("BestWorkPromotionWizard");
  }

  if (!prInfo) {
    await ctx.reply(ctx.i18n.t("firstPrInfo"));
  }
  await ctx.replyWithPhoto(prInfo.image, {
    parse_mode: "HTML",
    caption: prMsg,
    reply_markup: {
      keyboard: promotionMenu.buttons,
      resize_keyboard: true,
    },
  });
  return;
});
