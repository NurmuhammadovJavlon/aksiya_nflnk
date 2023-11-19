const { Markup } = require("telegraf");

function generatePromotionButtons(ctx) {
  try {
    const buttons = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("firstPromotionBtn"))],
      [Markup.button.text(ctx.i18n.t("secondPromotionBtn"))],
      [Markup.button.text(ctx.i18n.t("scoresBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ])
      .oneTime()
      .resize();

    return buttons;
  } catch (error) {
    console.log(error);
  }
}

module.exports = generatePromotionButtons;
