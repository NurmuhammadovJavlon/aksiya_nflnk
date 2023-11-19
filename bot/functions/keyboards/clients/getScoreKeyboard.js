const { Markup } = require("telegraf");

function generateScorePageButtons(ctx) {
  try {
    const buttons = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("Score.infoAboutScorebtn"))],
      [
        Markup.button.text(ctx.i18n.t("Score.purchaseHistoryBtn")),
        Markup.button.text(ctx.i18n.t("Score.myscoreBtn")),
      ],
      [
        Markup.button.text(ctx.i18n.t("backToPrMenuBtn")),
        Markup.button.text(ctx.i18n.t("backToMainMenuBtn")),
      ],
    ])
      .oneTime()
      .resize();

    return buttons;
  } catch (error) {
    console.log(error);
  }
}

module.exports = generateScorePageButtons;
