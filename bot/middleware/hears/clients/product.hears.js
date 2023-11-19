const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("productsBtn"), async (ctx) =>
  ctx.scene.enter("ProductsWizard")
);
