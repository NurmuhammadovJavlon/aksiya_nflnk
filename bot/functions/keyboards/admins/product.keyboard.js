const { CheckAdmin } = require("../../../common/sequelize/user.sequelize");
const { Markup } = require("telegraf");

async function generateProductAdminKeys(ctx) {
  try {
    const admin = await CheckAdmin(String(ctx.chat.id));
    let buttons;
    if (!admin) {
      ctx.reply(ctx.i18n.t("notAdminText"));
      return;
    }

    buttons = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("AdminProductForm.addProductBtn"))],
      [Markup.button.text(ctx.i18n.t("AdminProductForm.manageProductsBtn"))],
      [Markup.button.text(ctx.i18n.t("Admin.backToAdminPanel"))],
    ])
      .oneTime()
      .resize();

    return buttons;
  } catch (error) {
    console.log(error);
  }
}

module.exports = generateProductAdminKeys;
