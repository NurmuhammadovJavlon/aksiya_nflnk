const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("Admin.companyInfoBtn"), async (ctx) => {
  try {
    return ctx.scene.enter("CompanyInfoWizard");
  } catch (error) {
    console.log(error);
  }
});
