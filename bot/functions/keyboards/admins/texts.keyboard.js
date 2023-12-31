const { CheckAdmin } = require("../../../common/sequelize/user.sequelize");
const { Markup } = require("telegraf");

async function generateTextsAdminKeys(ctx) {
  try {
    const admin = await CheckAdmin(String(ctx.chat.id));
    let buttons;
    if (!admin) {
      ctx.reply(ctx.i18n.t("notAdminText"));
      return;
    }

    buttons = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("AdminTextsForm.bestWorkInfoBtn"))],
      [
        Markup.button.text(ctx.i18n.t("AdminTextsForm.firstEventTextBtn")),
        Markup.button.text(ctx.i18n.t("Admin.scoreInfoBtn")),
      ],
      [
        Markup.button.text(ctx.i18n.t("Admin.companyInfoBtn")),
        Markup.button.text(ctx.i18n.t("Admin.contactInfoBtn")),
      ],
      [Markup.button.text(ctx.i18n.t("Admin.backToAdminPanel"))],
    ])
      .oneTime()
      .resize();

    return buttons;
  } catch (error) {
    console.log(error);
  }
}

module.exports = generateTextsAdminKeys;
