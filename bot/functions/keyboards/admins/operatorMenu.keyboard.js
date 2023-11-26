const {
  CheckOperator,
} = require("../../../common/sequelize/operator.sequelize");
const { Markup } = require("telegraf");

async function generateOperatorPanelKeys(ctx) {
  try {
    const operator = await CheckOperator(String(ctx.chat.id));
    let buttons;
    if (!operator) {
      ctx.reply(ctx.i18n.t("OperatorPanel.notOperatorMsg"));
      return;
    }

    buttons = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("OperatorPanel.unSeenOrdersbtn"))],
      [Markup.button.text(ctx.i18n.t("AdminOrderForm.orderStatusBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ])
      .oneTime()
      .resize();

    return buttons;
  } catch (error) {
    console.log(error);
  }
}

module.exports = generateOperatorPanelKeys;
