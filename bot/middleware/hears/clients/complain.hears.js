const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("complainBtn"), async (ctx) => {
  try {
    return ctx.scene.enter("ComplainWizard");
  } catch (error) {
    console.log(error);
  }
});
