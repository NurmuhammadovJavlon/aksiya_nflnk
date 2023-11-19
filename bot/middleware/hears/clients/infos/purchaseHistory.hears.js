const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("Score.purchaseHistoryBtn"), async (ctx) => {
  try {
    return ctx.scene.enter("PurchaseHistoryWizard");
  } catch (error) {
    console.log(error);
  }
});
