const { CheckAdmin } = require("../../common/sequelize/user.sequelize");
const { Markup } = require("telegraf");

async function generateAdminKeys(ctx) {
  try {
    const admin = await CheckAdmin(String(ctx.chat.id));
    let buttons;
    if (!admin) {
      ctx.reply(ctx.i18n.t("notAdminText"));
      return;
    }

    buttons = Markup.keyboard([
      [
        Markup.button.text(ctx.i18n.t("Admin.regionsBtn")),
        Markup.button.text(ctx.i18n.t("Admin.dealersBtn")),
      ],
      [
        Markup.button.text(ctx.i18n.t("Admin.ordersBtn")),
        Markup.button.text(ctx.i18n.t("Admin.productsBtn")),
      ],
      [
        Markup.button.text(ctx.i18n.t("Admin.operatorsBtn")),
        Markup.button.text(ctx.i18n.t("Admin.allTextsBtn")),
        // Markup.button.text(ctx.i18n.t("Admin.scoreInfoBtn")),
      ],
      [Markup.button.text(ctx.i18n.t("Admin.usersBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ])
      .oneTime()
      .resize();

    return buttons;
  } catch (error) {
    console.log(error);
  }
}

module.exports = generateAdminKeys;
